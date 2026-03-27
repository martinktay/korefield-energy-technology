# Pricing Strategy — KoreField Academy

## Pricing Intelligence Engine

The Pricing Intelligence Engine computes the final payable amount by evaluating multiple inputs:

### Pricing Inputs
1. **Billing country** — determines purchasing power band
2. **Purchasing power band** — regional multiplier applied to base price
3. **Track type** — different base prices per track
4. **Track depth** — full pathway pricing (not per-level)
5. **Payment plan** — full, 2-pay, or 3-pay
6. **Active campaigns** — promotional discounts with precedence rules
7. **Approved discounts** — scholarships, sponsorships
8. **Scholarship/sponsorship adjustments** — deducted before final amount

### Pricing Outputs
- Final payable amount
- Installment schedule
- Grace period state
- Account lock threshold

### Pricing Rules
- Floor and ceiling price bounds enforced per track type and purchasing power band
- Price displayed in learner's local currency
- Exchange rates updated every 24 hours
- Displayed price locked for 30 minutes during checkout
- Computed pricing cached in Redis (5 min TTL, key: `pricing:{TRK-*}:{country}`)

## Payment Plans

| Plan | Split | Schedule |
|------|-------|----------|
| Full | 100% | Single payment at enrollment |
| 2-Pay | 60% / 40% | 60% at enrollment, 40% at midpoint |
| 3-Pay | 40% / 30% / 30% | 40% at enrollment, 30% at one-third, 30% at two-thirds |

## Grace Period and Access Control

- On overdue installment: grace period applied before access pause
- After grace period threshold: access paused, progress preserved
- On payment completion: access restored immediately
- Voluntary pause: suspends future charges, recalculates schedule on resume

## Scholarships and Sponsorships

- Scholarship adjustments (SCH-*) deducted before final amount calculation
- Approved by admin with audit trail
- Corporate sponsorships managed through Corporate Portal

## Campaign Discounts

- Campaign discounts (CMP-*) applied with defined precedence rules
- Time-bound: active_from / active_to dates
- Cannot reduce price below floor bound

## Payment Security

- PCI DSS-compliant payment gateway (tokenized storage only, no raw card data)
- Webhook signature verification for payment provider callbacks
- Payment state machine with auditable transitions
- Fraud monitoring: unusual volumes, mismatched billing, rapid successive attempts
