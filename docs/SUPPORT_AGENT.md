# TradeLord Quest Support Agent

## Goal
Automate routine support while keeping sensitive or high-impact decisions under controlled human review.

## Architecture
User → TradeLord Quest app → secure server endpoint → support queue → AI triage → safe action or escalation → user notification.

## Safe automatic actions
- classify a complaint;
- summarize a complaint;
- suggest a help article;
- send a transparent status update;
- detect duplicate support tickets;
- flag possible security abuse;
- create an owner-review task.

## Human-review actions
The agent should ask the owner for a decision before permanent account deletion outside the normal user request flow, financial or subscription changes, security-policy changes, database-permission changes, serious enforcement, significant privacy/security complaints, or responses to regulators and lawyers.

## Never do
- put an AI API key in the APK;
- secretly record conversations or device activity;
- claim that users were watched when they were not;
- claim that hacking is impossible;
- automatically make irreversible high-impact decisions.

## Security alerts
Use transparent messages such as: "Security alert: we detected unusual activity on your account. Please review your account or contact support."

Do not use surveillance-style messages unless the underlying event actually occurred and the privacy notice covers the processing.

## Data minimization
The support agent receives only the information needed for the support task. Sensitive data should be redacted before sending it to an external AI provider where practical.

## Current implementation
The app now has a secure support-ticket table, privacy settings, complaint UI, and account-deletion request flow. The actual AI reasoning layer should be server-side and added only after the secure endpoint and provider policy are configured.
