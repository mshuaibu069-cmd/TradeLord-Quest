# VEQORO MASTER BLUEPRINT

**Version:** 1.0  
**Status:** FOUNDATIONAL / APPROVED ARCHITECTURE  
**Purpose:** Canonical operating constitution for VEQORO and products built under VEQORO.

> This document exists so that future work can resume from the same architecture without requiring the owner to re-explain the system. It defines what is locked, what is allowed, how changes are evaluated, how AI is controlled, and how security/recovery are designed.

---

## 1. CORE PURPOSE

VEQORO is the central technology, intelligence, security, business, and product-operations system from which products are built and governed.

VEQORO is not merely an app.

Conceptual structure:

```
OWNER
  |
  v
VEQORO COMMAND CENTER
  |
  +--> AI COUNCIL
  |
  +--> SECURITY
  |
  +--> BUSINESS INTELLIGENCE
  |
  +--> VEQORO CORE
          |
          +--> TradeLord Quest
          +--> Future Game
          +--> Future Apps
```

The Command Center is private and owner-controlled.

---

## 2. OWNER AUTHORITY

The owner is the final authority.

AI may be highly capable, but AI is never the owner.

Authority hierarchy:

```
OWNER
  |
  v
OWNER AUTHORIZATION
  |
  v
VEQORO SECURITY / PERMISSION GATE
  |
  v
AI COUNCIL
  |
  v
PRODUCTS / SERVICES
```

No AI agent may silently grant itself more authority.

No AI agent may bypass the permission gate.

No AI agent may silently rewrite a locked architectural decision.

---

## 3. OWNER AUTHENTICATION

### LOCKED DECISION

Normal owner access uses:

```
PIN
 |
 v
VEQORO COMMAND CENTER
```

Voice authentication is **NOT** part of the owner-authentication design.

A normal password is **NOT** the primary owner login mechanism.

The PIN must be protected with:

- strong length requirements
- secure one-way verification/storage
- retry limits
- brute-force protection
- suspicious-attempt detection
- session protection
- secure reset/recovery procedures

For especially sensitive operations, a stronger approval mechanism may be required even after normal login.

---

## 4. OWNER RECOVERY

### LOCKED PRINCIPLE

**A phone number alone must never be sufficient to take over the VEQORO owner account.**

Recovery should use multiple protected factors/channels.

Planned recovery components:

- recovery codes
- phone number as one recovery channel
- separate recovery contact/channel
- trusted device(s)
- physical security key(s) for highest-security recovery and actions
- controlled emergency recovery procedure

Concept:

```
RECOVERY REQUEST
      |
      v
IDENTITY / RECOVERY CHECK
      |
      v
RISK EVALUATION
      |
   +--+--+
   |     |
 LOW    HIGH
   |     |
   v     v
NORMAL  ADDITIONAL
FLOW    PROOF / REVIEW
   |     |
   +--+--+
      |
      v
ACCOUNT RECOVERY
      |
      v
AUDIT RECORD
```

Recovery secrets must not all be stored together.

Phone-number possession alone must not unlock the account.

Recovery must be secure enough to resist takeover while remaining recoverable by the legitimate owner.

---

## 5. SECRET MEMBRANE

VEQORO information is classified by sensitivity.

### PUBLIC
Public website, public marketing, public app descriptions, public documentation.

### INTERNAL
Normal development information, internal workflows, non-sensitive analytics.

### CONFIDENTIAL
Business strategy, unreleased features, private research, financial planning, internal intelligence.

### CROWN JEWEL
Highest sensitivity:

- private keys
- payment credentials
- wallet secrets
- Supabase service-role secrets
- API secrets
- owner recovery secrets
- high-sensitivity security controls
- proprietary algorithms
- sensitive customer information
- critical unreleased intellectual property

Crown-jewel secrets must not become ordinary AI memory.

---

## 6. AI COUNCIL

Initial council:

### 1. Chief AI / Orchestrator
Coordinates agents, decomposes goals, assigns work, resolves conflicting recommendations, and prepares final recommendations.

### 2. Research Agent
Researches markets, competitors, products, users, complaints, regulations, technology, documentation, trends, and evidence.

### 3. Product Architect
Designs products, UX, requirements, architecture, feature priorities, and user journeys.

### 4. Engineering Agent
Writes code, tests, debugging changes, migrations, configuration, documentation, and pull requests.

### 5. Blue Security Agent
Defends systems, monitors threats, reviews permissions, investigates suspicious activity, hardens systems, and recommends remediation.

### 6. Red Security Lab
Performs authorized adversarial testing only against owned or explicitly authorized environments, preferably isolated. It does not perform attacks against unrelated real-world targets.

### 7. Business Intelligence Agent
Monitors users, retention, revenue, costs, conversion, subscriptions, advertising, AI spend, infrastructure spend, unit economics, and profitability.

More agents may be added later, but new agents must have clearly defined purpose, data access, permissions, limits, and escalation rules.

---

## 7. AI PERMISSION LADDER

Every AI capability is assigned a permission level.

```
1. OBSERVE
      |
2. ANALYZE
      |
3. RECOMMEND
      |
4. SIMULATE
      |
5. SAFE AUTOMATION
      |
6. HUMAN APPROVAL
      |
7. CRITICAL OWNER ACTION
```

### Observe
Read permitted information.

### Analyze
Interpret permitted information.

### Recommend
Suggest an action without executing it.

### Simulate
Test a proposed change without affecting production.

### Safe Automation
Perform only explicitly approved, low-risk actions.

### Human Approval
Owner approval is required.

### Critical Owner Action
Reserved for actions that require direct owner authorization.

---

## 8. AI PERMISSION GATE

Important actions must not go directly from an AI agent to production.

```
AI REQUEST
   |
   v
IDENTIFY AGENT
   |
   v
IDENTIFY DATA USED
   |
   v
CHECK PERMISSION
   |
   v
CLASSIFY RISK
   |
   v
SIMULATE WHEN POSSIBLE
   |
   +--------+--------+
   |                 |
APPROVAL            NO APPROVAL
REQUIRED             REQUIRED
   |                 |
   v                 v
OWNER APPROVES      EXECUTE
   |                 |
   +--------+--------+
            |
            v
          AUDIT
            |
            v
         MONITOR
```

---

## 9. NO UNIVERSAL AI MASTER KEY

There must be no single credential that gives every AI agent unrestricted access to everything.

Permissions should be compartmentalized by:

- agent
- product
- environment
- operation
- data sensitivity
- risk level

The permission gateway is the control membrane between AI and powerful systems.

---

## 10. CHANGE RESISTANCE & EVIDENCE PROTOCOL

### LOCKED OPERATING RULE

**The owner's latest request does not automatically override an earlier locked decision.**

New ideas must be evaluated before changing the architecture.

This applies especially to ideas triggered by:

- social media
- another app
- a competitor
- YouTube
- a comment
- a new AI capability
- frustration
- a sudden thought
- a negative experience

Process:

```
NEW IDEA
   |
   v
CAPTURE IDEA
   |
   v
IDENTIFY PROBLEM
   |
   v
RESEARCH / EVIDENCE
   |
   v
BENEFIT VS RISK
   |
   v
CHECK LOCKED DECISIONS
   |
   v
AI COUNCIL REVIEW
   |
   v
RECOMMENDATION
   |
   v
OWNER DECISION
   |
   v
CHANGE ONLY IF APPROVED
```

Seeing something elsewhere is not, by itself, evidence that VEQORO needs it.

---

## 11. IDEA PARKING LOT

Ideas should be capturable without immediately changing production architecture.

Each idea may be stored with:

- source
- date
- problem claimed
- proposed solution
- evidence
- risks
- affected products
- related locked decisions
- status

Possible statuses:

- NEW
- RESEARCHING
- EXPERIMENT
- KEEP
- MODIFY
- REJECT
- DEFERRED
- IMPLEMENTED

This protects the system from constant redesign.

The owner is free to bring new ideas at any time; ideas are captured first and changed later only after evaluation.

---

## 12. TWO-STAGE APPROVAL

For major changes, separate:

### Stage 1 — Investigation Approval
Approval to research/test the idea.

### Stage 2 — Change Approval
Approval to actually modify the system.

Therefore:

> "Investigate this"

does not mean:

> "Build this."

---

## 13. FORMAL RECONSIDERATION OF LOCKED DECISIONS

A locked decision can be changed, but never silently.

Process:

```
LOCKED DECISION
     |
     v
NEW EVIDENCE
     |
     v
WHY THE OLD DECISION MAY NO LONGER FIT
     |
     v
OPTIONS
     |
     v
RISKS / COST / EFFECT
     |
     v
RECOMMENDATION
     |
     v
OWNER APPROVAL
     |
     v
UPDATE DECISION REGISTER + BLUEPRINT
```

---

## 14. AI MEMORY ARCHITECTURE

VEQORO should not store everything blindly.

Memory categories:

### FACTS
Verified information.

### KNOWLEDGE
Useful information from trusted sources.

### DECISIONS
Owner-approved decisions.

### EXPERIENCE
Lessons from previous operations.

### SECURITY INTELLIGENCE
Threats, incidents, suspicious patterns, defenses, and lessons.

### RULES
System instructions and permanent operating constraints.

AI must distinguish between:

> "The owner decided this."

and:

> "The AI suggested this."

Secrets are handled separately and are not normal AI memory.

---

## 15. MEMORY VERIFICATION

```
SOURCE
  |
CAPTURE
  |
CLASSIFY
  |
VERIFY
  |
CONFIDENCE
  |
APPROVE IF REQUIRED
  |
VERSION
  |
TRUSTED MEMORY
```

Unverified claims must not silently become permanent facts.

---

## 16. DECISION REGISTER

VEQORO maintains a versioned Decision Register.

Each important decision should record:

- Decision ID
- Date
- Decision
- Reason
- Alternatives considered
- Risk
- Owner approval status
- Affected systems
- Version
- Current status
- Replacement decision, if later changed

Example:

```
Decision: VEQORO is the master brand
Status: LOCKED
Owner approval: YES
```

---

## 17. MASTER SOURCE-OF-TRUTH ORDER

When information conflicts, use this order:

1. Current verified system state
2. Current approved blueprint
3. Decision Register
4. Approved product/security documentation
5. Verified implementation/test results
6. Research and external evidence
7. AI suggestions
8. Social-media claims / unverified opinions

External inspiration can create an investigation, but it cannot silently override the source of truth.

---

## 18. SECURITY LOOP

Blue and Red security work together in an authorized security-improvement cycle.

```
RED SECURITY TEST
       |
       v
WEAKNESS FOUND
       |
       v
BLUE SECURITY RESPONSE
       |
       v
PATCH / HARDEN
       |
       v
RED RETEST
       |
       v
PASS / FAIL
       |
       v
SECURITY RECORD
       |
       v
LESSON ADDED TO SECURITY INTELLIGENCE
```

---

## 19. EMERGENCY KILL SWITCH

VEQORO must eventually support an emergency freeze capable of stopping or restricting:

- AI actions
- deployments
- sensitive integrations
- automated financial operations
- suspicious sessions
- privileged access

Emergency operation should favor fail-closed behavior.

After activation:

```
FREEZE
  |
INVESTIGATE
  |
CONTAIN
  |
RECOVER
  |
REVIEW
  |
HARDEN
  |
RESTORE
```

---

## 20. OWNER WALLET SECURITY

If VEQORO later integrates with OPay or another payment provider:

```
OWNER
  |
  v
VEQORO IDENTITY SECURITY
  |
  v
VEQORO WALLET GATEWAY
  |
  v
PAYMENT PROVIDER
```

We must not assume that a provider's own PIN/biometric system can be reused by VEQORO until the provider officially confirms the supported integration.

Financial secrets remain isolated from normal AI access.

---

## 21. FINANCIAL SEPARATION

AI may receive controlled financial summaries for business intelligence, but should not automatically receive underlying financial credentials.

Examples of controlled data:

- revenue
- expenses
- conversion
- payment totals
- subscription totals
- infrastructure cost
- AI cost

Do not expose:

- payment secrets
- wallet credentials
- bank credentials
- withdrawal authorization
- private financial keys

to ordinary agents.

---

## 22. PRIVACY PRINCIPLE

Collect the minimum sensitive information necessary.

Special care is required for:

- identity documents
- facial information
- financial information
- customer information
- recovery information

Do not collect sensitive information merely because it might be useful later.

---

## 23. COMMAND CENTER

The private VEQORO Command Center should eventually provide controlled visibility into:

- AI Council
- agents
- security
- business intelligence
- products
- finance
- memory
- decisions
- development
- incidents
- users
- permissions
- audit logs
- emergency controls

Example top-level sections:

```
VEQORO COMMAND CENTER
---------------------
AI COUNCIL
SECURITY
BUSINESS
PRODUCTS
FINANCE
MEMORY
DECISIONS
DEVELOPMENT
INCIDENTS
USERS
AGENTS
PERMISSIONS
AUDIT LOG
EMERGENCY
```

---

## 24. PRODUCT FACTORY

VEQORO Core is the common foundation.

Products receive separate boundaries for:

- code
- database
- secrets
- users
- analytics
- deployment
- security
- permissions

Products can use approved VEQORO services without becoming one giant insecure system.

---

## 25. TRADELORD QUEST — PRODUCT #1

Locked identity:

**TradeLord Quest**

**Learn. Practice. Compete.**

Purpose:

Educational trading simulator/game.

V1:

- virtual money
- academy
- lessons
- quizzes
- challenges
- competitions
- points
- leaderboards
- streaks
- limited AI education
- news
- premium
- ads

No V1:

- real-money deposits
- real-money withdrawals
- real-money trading
- guaranteed profits
- guaranteed winning strategies
- "AI knows the market" claims
- binary-options-style behavior

Required brand relationship:

**Powered by VEQORO -> TradeLord Quest**

Powered-by branding is compulsory unless formally reconsidered through the change protocol.

---

## 26. FUTURE PRODUCT DISCOVERY

Before building Product #2, research should cover:

- player needs
- existing games
- complaints
- psychology
- retention
- mechanics
- monetization
- technology
- market gaps
- differentiation

Goal:

Build a genuinely useful and differentiated product, not an unrealistic claim that nobody has ever imagined it.

---

## 27. SUPPORT / COMPLAINT AI

Flow:

```
USER COMPLAINT
   |
   v
AI CLASSIFICATION
   |
   v
RISK LEVEL
```

Low risk:
AI may resolve automatically using approved information.

Medium risk:
AI may recommend/use approved knowledge.

High risk:
Human review.

Payment, privacy, security, legal, or dangerous matters:
Immediate escalation.

AI must not make irreversible high-impact decisions casually.

---

## 28. AUDIT TRAIL

Important operations should record:

- who/what acted
- action
- time
- reason
- data used
- permission level
- result
- approval
- affected resource

Audit coverage should include:

- AI actions
- security events
- deployments
- permission changes
- financial operations
- owner recovery
- privileged access
- major product changes

---

## 29. DEVELOPMENT & SECRET RULES

Current TradeLord Quest cloud-first workflow:

```
PHONE
  |
  v
CHATGPT
  |
  v
GITHUB CODESPACES
  |
  v
GITHUB
  |
  v
SUPABASE
  |
  v
EXPO EAS
  |
  v
ANDROID APK
  |
  v
PHONE
```

Never commit:

- Supabase service-role/secret keys
- OpenAI API keys
- EAS/Expo tokens
- payment secrets
- owner recovery secrets

Sensitive production secrets belong in appropriate secret-management systems.

---

## 30. AI COST CONTROL

Not every task requires the most expensive or powerful model.

Routing principle:

```
SIMPLE
 -> fast/low-cost model

MEDIUM
 -> moderate model

COMPLEX RESEARCH
 -> stronger model

CRITICAL REASONING / SECURITY
 -> highest appropriate reasoning capability
```

The Command Center should eventually measure:

- AI cost per task
- AI cost per user
- infrastructure cost per user
- revenue per user
- contribution margin

---

## 31. BUSINESS INTELLIGENCE

The business layer should eventually monitor:

### Users
- total
- active
- retention
- churn
- country
- acquisition source

### Revenue
- premium
- advertising
- other approved revenue

### Costs
- AI
- database/infrastructure
- APIs
- marketing
- payment fees
- operational expenses

### Economics
- revenue per user
- cost per user
- gross contribution
- profitability trend

---

## 32. PHYSICAL OWNER SECURITY

Longer-term owner security kit may include:

- primary phone
- backup phone
- physical security keys
- offline recovery codes
- encrypted backup storage
- power backup/UPS
- secure recovery procedure

No expensive computer lab is required for the architecture.

The system remains cloud-first.

---

## 33. STATUS DEFINITIONS

Every significant system component should have exactly one clear status:

**LOCKED** — approved and protected from casual change.

**APPROVED** — approved to implement.

**PROPOSED** — recommendation awaiting approval.

**IN PROGRESS** — being built.

**TESTING** — implemented but not fully verified.

**VERIFIED** — actually tested and confirmed.

**BLOCKED** — cannot proceed until a dependency is resolved.

**DEPRECATED** — deliberately replaced.

**UNKNOWN** — insufficient evidence.

A mockup, proposal, or planned feature must never be represented as verified functionality.

---

## 34. MASTER OPERATING LOOP

Future work follows:

```
UNDERSTAND
   |
CHECK BLUEPRINT
   |
VERIFY CURRENT STATE
   |
INVESTIGATE
   |
IDENTIFY RISKS
   |
GENERATE OPTIONS
   |
RECOMMEND
   |
GET APPROVAL WHEN REQUIRED
   |
IMPLEMENT
   |
TEST
   |
VERIFY
   |
AUDIT
   |
UPDATE DOCUMENTATION
   |
UPDATE DECISION REGISTER
```

Never claim completion without verification.

---

## 35. FIVE QUESTIONS FOR IMPORTANT AI ACTIONS

Before an important action, the system should be able to answer:

1. What am I trying to do?
2. What information am I using?
3. Am I authorized?
4. What happens if I am wrong?
5. Does the owner need to approve this?

If those questions cannot be answered safely, stop or escalate.

---

## 36. ANTI-IMPULSIVE-CHANGE RULE

The owner is encouraged to submit new observations, ideas, complaints, discoveries, and possible improvements.

However:

> **New information is a trigger for investigation, not an automatic instruction to modify the architecture.**

The assistant/AI should protect the project from impulsive redesign.

A social-media observation can be useful.

It can also be misleading, temporary, copied, or irrelevant.

Therefore:

**Capture -> investigate -> compare -> recommend -> decide -> change.**

---

## 37. PHASED BUILD ORDER

### Phase 1 — Foundation
Identity, PIN, recovery architecture, permission model, secret classification, audit design.

### Phase 2 — Command Center
Private owner dashboard and system visibility.

### Phase 3 — AI Core
Orchestrator, agent registry, memory, decision register, permission gate.

### Phase 4 — Security
Blue Security, isolated Red Security Lab, monitoring, incidents, kill switch.

### Phase 5 — Product Factory
TradeLord Quest integration and future product boundaries.

### Phase 6 — Business Intelligence
Users, revenue, cost, growth, profitability.

### Phase 7 — Advanced Automation
Safe AI employees and controlled autonomous workflows.

---

## 38. CURRENT PROJECT CONTEXT

TradeLord Quest remains the current product and is not being discarded or rebuilt.

Existing cloud/phone-first work remains the starting point.

This VEQORO blueprint adds the larger governing architecture above the product.

Before changing TradeLord Quest, verify the current repository and implementation state first.

---

## 39. NON-NEGOTIABLE PRINCIPLES

1. Owner remains final authority.
2. AI never receives unrestricted universal authority.
3. Locked decisions are not silently changed.
4. Phone number alone cannot recover the owner account.
5. Voice authentication is not used for owner login.
6. Sensitive secrets are isolated from normal AI memory.
7. Red security testing is authorized and isolated.
8. Important actions are auditable.
9. Production changes must be verified.
10. Social-media discoveries do not automatically become product requirements.
11. Ideas can be parked without being implemented.
12. Security, privacy, and user safety come before convenience.
13. Do not claim a feature works until it is actually verified.
14. VEQORO powered-by branding remains protected.
15. Virtual-money educational boundaries remain intact for TradeLord Quest V1.

---

## 40. BLUEPRINT MAINTENANCE

This blueprint is a living but controlled document.

It may be updated only when:

- a new major decision is approved
- a locked decision is formally reconsidered
- a security requirement materially changes
- verified implementation reveals a necessary correction
- new evidence materially changes the architecture

Routine ideas do not automatically modify this document.

Every substantive change should be recorded in the Decision Register.

---

## FINAL OPERATING COMMAND

When the owner says:

**"Continue VEQORO."**

First determine:

- current verified state
- locked decisions
- what has already been built
- what remains
- what is broken
- what is unknown
- safest and highest-value next step

Then respond using:

**CURRENT STATE -> PROBLEM/GAP -> RECOMMENDATION -> RISK -> NEXT ACTION**

Do not restart the project.

Do not silently redesign it.

Do not treat inspiration as authority.

Do not confuse proposals with verified implementation.

**Understand first. Investigate second. Decide third. Change last.**
