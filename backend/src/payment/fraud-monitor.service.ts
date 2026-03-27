/**
 * @file fraud-monitor.service.ts
 * Real-time payment fraud detection service.
 * Monitors transaction patterns for unusual volume, billing country mismatches,
 * and rapid successive failed attempts. Uses in-memory tracking (production
 * would use Redis or a dedicated fraud detection service).
 */
import { Injectable, Logger } from '@nestjs/common';

/**
 * Fraud alert severity levels.
 */
export type FraudAlertSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Fraud alert types.
 */
export type FraudAlertType =
  | 'unusual_volume'
  | 'billing_mismatch'
  | 'rapid_successive_attempts';

/**
 * Structured fraud alert record.
 */
export interface FraudAlert {
  type: FraudAlertType;
  severity: FraudAlertSeverity;
  user_id: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

/** Thresholds */
const MAX_ATTEMPTS_PER_HOUR = 5;
const MAX_FAILED_ATTEMPTS_IN_WINDOW = 3;
const FAILED_ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const VOLUME_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Payment fraud monitoring service.
 *
 * Requirement 31.35: Analyse transaction patterns for indicators of
 * fraudulent activity including unusual transaction volumes, mismatched
 * billing details, and rapid successive payment attempts.
 */
@Injectable()
export class FraudMonitorService {
  private readonly logger = new Logger(FraudMonitorService.name);

  /**
   * In-memory store for payment attempt tracking.
   * Production would use Redis or a dedicated fraud detection service.
   */
  private readonly attemptLog: Map<
    string,
    { timestamp: number; success: boolean }[]
  > = new Map();

  /**
   * Check for unusual payment volume from a single user.
   * Flags if more than 5 payment attempts in 1 hour.
   */
  checkUnusualVolume(userId: string): FraudAlert | null {
    const now = Date.now();
    const attempts = this.getRecentAttempts(userId, now - VOLUME_WINDOW_MS);

    if (attempts.length > MAX_ATTEMPTS_PER_HOUR) {
      const alert: FraudAlert = {
        type: 'unusual_volume',
        severity: 'high',
        user_id: userId,
        details: {
          attempt_count: attempts.length,
          window_hours: 1,
          threshold: MAX_ATTEMPTS_PER_HOUR,
        },
        timestamp: new Date(),
      };

      this.logAlert(alert);
      return alert;
    }

    return null;
  }

  /**
   * Check for mismatched billing country.
   * Flags when payment country differs from learner's registered country.
   */
  checkBillingMismatch(
    userId: string,
    paymentCountry: string,
    registeredCountry: string,
  ): FraudAlert | null {
    if (
      paymentCountry.toUpperCase() !== registeredCountry.toUpperCase()
    ) {
      const alert: FraudAlert = {
        type: 'billing_mismatch',
        severity: 'medium',
        user_id: userId,
        details: {
          payment_country: paymentCountry.toUpperCase(),
          registered_country: registeredCountry.toUpperCase(),
        },
        timestamp: new Date(),
      };

      this.logAlert(alert);
      return alert;
    }

    return null;
  }

  /**
   * Check for rapid successive failed attempts.
   * Flags if more than 3 failed attempts in 10 minutes.
   */
  checkRapidFailedAttempts(userId: string): FraudAlert | null {
    const now = Date.now();
    const recentAttempts = this.getRecentAttempts(
      userId,
      now - FAILED_ATTEMPT_WINDOW_MS,
    );
    const failedAttempts = recentAttempts.filter((a) => !a.success);

    if (failedAttempts.length > MAX_FAILED_ATTEMPTS_IN_WINDOW) {
      const alert: FraudAlert = {
        type: 'rapid_successive_attempts',
        severity: 'critical',
        user_id: userId,
        details: {
          failed_count: failedAttempts.length,
          window_minutes: 10,
          threshold: MAX_FAILED_ATTEMPTS_IN_WINDOW,
        },
        timestamp: new Date(),
      };

      this.logAlert(alert);
      return alert;
    }

    return null;
  }

  /**
   * Run all fraud checks for a payment attempt.
   * Returns an array of triggered alerts (empty if clean).
   */
  runAllChecks(params: {
    userId: string;
    paymentCountry?: string;
    registeredCountry?: string;
  }): FraudAlert[] {
    const alerts: FraudAlert[] = [];

    const volumeAlert = this.checkUnusualVolume(params.userId);
    if (volumeAlert) alerts.push(volumeAlert);

    if (params.paymentCountry && params.registeredCountry) {
      const mismatchAlert = this.checkBillingMismatch(
        params.userId,
        params.paymentCountry,
        params.registeredCountry,
      );
      if (mismatchAlert) alerts.push(mismatchAlert);
    }

    const rapidAlert = this.checkRapidFailedAttempts(params.userId);
    if (rapidAlert) alerts.push(rapidAlert);

    return alerts;
  }

  /**
   * Record a payment attempt for tracking.
   */
  recordAttempt(userId: string, success: boolean): void {
    const attempts = this.attemptLog.get(userId) ?? [];
    attempts.push({ timestamp: Date.now(), success });
    this.attemptLog.set(userId, attempts);
  }

  /**
   * Get recent attempts within a time window.
   */
  private getRecentAttempts(
    userId: string,
    since: number,
  ): { timestamp: number; success: boolean }[] {
    const attempts = this.attemptLog.get(userId) ?? [];
    return attempts.filter((a) => a.timestamp >= since);
  }

  /**
   * Log a fraud alert with structured logging.
   */
  private logAlert(alert: FraudAlert): void {
    this.logger.warn(
      JSON.stringify({
        event: 'fraud_alert',
        type: alert.type,
        severity: alert.severity,
        user_id: alert.user_id,
        details: alert.details,
        timestamp: alert.timestamp.toISOString(),
      }),
    );
  }

  /**
   * Clear attempt history for a user (for testing or admin reset).
   */
  clearAttempts(userId: string): void {
    this.attemptLog.delete(userId);
  }
}
