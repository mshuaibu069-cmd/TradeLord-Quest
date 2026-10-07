# VEQORO / TradeLord Quest — Compliance Baseline

**Status:** Owner-approved hardening baseline  
**Purpose:** Keep the product clearly positioned as an educational virtual-money simulator while higher-risk regulatory and platform questions remain under review.

> This document is an engineering/product guardrail, not legal advice. Jurisdiction-specific legal and store-review decisions remain subject to owner/council review.

## Product boundary

TradeLord Quest must remain, unless the owner/council explicitly approves a new regulatory review:

- virtual-money simulation;
- education, lessons, quizzes, challenges and competitions;
- virtual points and progression;
- educational AI explanations;
- educational market summaries;
- premium access to educational features.

TradeLord Quest must not be presented as:

- a broker, exchange, bank, investment service or real-money trading platform;
- a deposit/withdrawal service;
- a provider of guaranteed profits or guaranteed trading outcomes;
- a binary-options service;
- a provider of personalized buy/sell investment instructions.

## AI boundary

The AI Teacher is an educational assistant.

It must not:

- claim certainty about future market movements;
- promise profits;
- present personalized investment instructions as guaranteed;
- expose provider API secrets in the mobile app.

Live AI must use a controlled server-side endpoint with authentication, rate limits and appropriate logging.

## Market/news boundary

Until rights are reviewed and an authorized source is connected:

- use original educational summaries;
- do not republish full third-party articles;
- do not imply that a live news feed is available when it is not;
- require appropriate rights/licensing and attribution before adding a live feed.

## Privacy/security baseline

- Supabase service-role secrets and AI provider secrets remain server-side.
- Collect only data required for the feature.
- Privacy claims must match actual SDKs, APIs and third-party data sharing.
- Support automation must have human escalation for sensitive or high-impact cases.
- Account deletion requests remain available.
- Applicable age requirements must be respected before public launch.

## Store-policy review flags

Google Play states that apps with financial features must complete the Financial features declaration, and its policy prohibits binary-options trading.  
https://support.google.com/googleplay/android-developer/answer/9876821

Apple's App Review Guidelines restrict financial trading/investing apps and prohibit binary-options trading; CFD/FOREX/derivative services require appropriate licensing in applicable jurisdictions.  
https://developer.apple.com/app-store/review/guidelines/

Before public store release, the owner/council should review:

1. Google Play Financial features declaration.
2. Apple App Store financial-app classification.
3. Target-country financial-services rules.
4. Privacy/age requirements for each target market.
5. AI/data-processing disclosures.
6. Advertising and subscription disclosures.
7. Market/news content rights.
8. VEQORO trademark and brand clearance.

## Change-control rule

No feature should be changed from simulation/education into real-money trading, personalized financial advice, paid trading signals, brokerage execution, deposits/withdrawals, or other regulated financial functionality without a new owner/council review.
