/**
 * @file logging.interceptor.ts
 * Request/response logging interceptor for structured JSON log output.
 * Captures method, URL, duration, trace ID, and outcome (success/error)
 * for every HTTP request — consumed by CloudWatch in production.
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();
    const traceId = (request.headers['x-trace-id'] as string) ?? 'no-trace';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            JSON.stringify({
              traceId,
              method,
              url,
              duration: `${duration}ms`,
              status: 'success',
              timestamp: new Date().toISOString(),
            }),
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            JSON.stringify({
              traceId,
              method,
              url,
              duration: `${duration}ms`,
              status: 'error',
              error: error.message,
              timestamp: new Date().toISOString(),
            }),
          );
        },
      }),
    );
  }
}
