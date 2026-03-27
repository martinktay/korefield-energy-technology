# Global Pricing Engine — KoreField Academy

## Pricing Intelligence Engine

Computes the final payable amount for any learner by evaluating:

### Input Variables
1. Billing country → determines CountryBand (CBN-*)
2. Purchasing power band → regional multiplier
3. Track type → base price from PricingConfig (PRC-*)
4. Track depth → full pathway pricing
5. Payment plan → full / 2-pay / 3-pay
6. Active campaigns → CMP-* promotional discounts
7. Approved discounts → scholarships, sponsorships
8. Scholarship adjustments → SCH-* deductions

### Computation Order
1. Look up base price for track (PRC-*)
2. Apply purchasing power multiplier from CountryBand (CBN-*)
3. Apply campaign discounts (with precedence rules)
4. Apply scholarship/sponsorship deductions
5. Enforce floor and ceiling price bounds
6. Generate installment schedule based on payment plan
7. Convert to learner's local currency

### Output
- Final payable amount
- Installment schedule (dates and amounts)
- Grace period state
- Account lock threshold

### Caching
- Key: `pricing:{TRK-*}:{country}`
- TTL: 5 minutes
- Exchange rates updated every 24 hours
- Displayed price locked for 30 minutes during checkout

### Country Bands
Each country is assigned a purchasing power band with a multiplier:
- Band determines how base price is adjusted for regional affordability
- Floor and ceiling bounds prevent extreme pricing
- Multipliers stored in CountryBand table (CBN-*)

### Payment Plans
| Plan | Enrollment | Midpoint | One-Third | Two-Thirds |
|------|-----------|----------|-----------|------------|
| Full | 100% | — | — | — |
| 2-Pay | 60% | 40% | — | — |
| 3-Pay | 40% | — | 30% | 30% |

### Grace Period Logic
- Overdue installment → grace period starts
- Grace period expires → access paused, progress preserved
- Payment completed → access restored immediately
- Voluntary pause → future charges suspended, schedule recalculated on resume
