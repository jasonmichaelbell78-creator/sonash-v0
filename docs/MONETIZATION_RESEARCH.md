# Monetization Strategy Research Initiative

**Document Version**: 2.0 **Created**: 2025-12-15 **Last Updated**: 2026-01-02
**Status**: IN_PROGRESS **Overall Completion**: 75% (3/4 phases complete)
**Target Completion**: Post-Growth Tab implementation

---

## 📋 Purpose & Scope

### What This Document Covers

This document provides a comprehensive research initiative for monetization
strategies for the SoNash recovery app.

**Primary Goal**: Determine the best monetization approach that balances
sustainability with accessibility for recovery users.

**Scope**:

- ✅ **In Scope**:
  - Monetization model research and comparison
  - Ethical considerations for recovery apps
  - Legal and compliance requirements
  - Market research and competitor analysis
  - Cost/revenue projections
  - Technical implementation planning
- ❌ **Out of Scope**:
  - Actual payment integration code (Phase 4)
  - B2B sales outreach
  - Marketing strategy

**Related To**:

- [M3 - Meetings](../ROADMAP.md#m3-meetings-location-planned-q2-2026) - Feature
  value creation
- [Growth Tab Features](../ROADMAP.md) - Premium feature development
- Post-Growth Tab implementation

---

## Quick Start

1. Review research findings summary
2. Check milestone recommendations
3. Follow implementation timeline

---

## 🗺️ STATUS DASHBOARD

| Phase   | Description         | Status          | Completion |
| ------- | ------------------- | --------------- | ---------- |
| Phase 1 | AI Research Prompts | **✅ COMPLETE** | 100%       |
| Phase 2 | Analysis Framework  | **✅ COMPLETE** | 100%       |
| Phase 3 | Decision Framework  | **✅ COMPLETE** | 100%       |
| Phase 4 | Implementation      | **📋 PENDING**  | 0%         |

**Progress Summary**:

- **Completed**: 3 phases (75%)
- **Pending**: 1 phase (Phase 4 - Implementation)

**Key Decision Made**: Freemium model with Growth Tab features as premium

---

## 🎯 Research Objectives

1. **Models** - What monetization approaches work for recovery/wellness apps?
2. **Ethics** - What should never be paywalled? What's the community perception?
3. **Legalities** - HIPAA, payment processing, subscription laws, refund
   requirements
4. **Market Research** - What do competitors charge? What's the willingness to
   pay?
5. **Cost Analysis** - What are our costs? What margins do we need?
6. **Implementation** - Technical requirements for each model

---

## 📋 Phase 1: AI Research Prompts (✅ Complete)

Use these prompts with multiple AIs (Gemini, ChatGPT, Claude, etc.) to gather
perspectives:

### Prompt 1: Monetization Models

```
I'm building a 12-step recovery companion app (AA/NA focused) with features like:
- Daily journaling and mood tracking
- Step 4 inventory tools
- Meeting finder
- Prayer/readings library
- Speaker tape library
- Milestone/chip tracking

What monetization models work best for recovery and wellness apps?
Consider: freemium, subscription, one-time purchase, donations, B2B licensing.
For each model, explain pros, cons, and examples of apps using it successfully.
```

### Prompt 2: Ethics and Recovery Culture

```
For a 12-step recovery app, what are the ethical considerations for monetization?
- What features should always remain free?
- How does AA/NA tradition of "self-supporting" apply to an app?
- What would the recovery community find acceptable vs exploitative?
- How do I balance sustainability with accessibility for those who can't pay?
- Are there examples of recovery apps that got this wrong?
```

### Prompt 3: Legal and Compliance

```
What legal considerations apply to monetizing a recovery/wellness app?
Cover:
- HIPAA and health data (does journaling about recovery count?)
- Payment processing for subscriptions (Apple/Google requirements)
- Subscription auto-renewal laws by state/country
- Right to refund and cancellation requirements
- Terms of service requirements
- Privacy policy requirements for paid features
- Tax implications of app revenue
```

### Prompt 4: Market Research

```
Research the recovery app market:
- What do competing recovery apps charge? (I Am Sober, Nomo, Loosid, Sober Grid, etc.)
- What's the typical price range for wellness/mental health app subscriptions?
- What features are commonly gated behind paywalls?
- What's the conversion rate from free to paid for wellness apps?
- What's the churn rate for wellness app subscriptions?
- What price points have the best conversion?
```

### Prompt 5: Cost Analysis Framework

```
Help me build a cost analysis for a recovery app:
- Firebase costs at different user scales (100, 1K, 10K, 100K users)
- Audio streaming costs (speaker tapes feature)
- Development and maintenance costs
- What margins should I target?
- At what user count does each monetization model become viable?
- Break-even analysis for subscription vs one-time purchase
```

### Prompt 6: Technical Implementation

```
What's the technical implementation for each monetization model in a Next.js + Firebase app?
- RevenueCat vs native StoreKit/Google Play Billing
- Firebase Extensions for payments
- Stripe integration for web subscriptions
- Managing entitlements across platforms
- Handling subscription state and grace periods
- Implementing feature flags for premium features
```

---

## 📋 Phase 2: Analysis Framework (✅ Complete)

> **Analysis Source**: `docs/Monetization_Research_Phase1_Results.md` (Multi-AI
> aggregation)

### A. Monetization Models Comparison

| Model             | Revenue Potential        | Ethical Fit (Recovery)           | Technical Complexity     | User Friction                | Verdict                   |
| ----------------- | ------------------------ | -------------------------------- | ------------------------ | ---------------------------- | ------------------------- |
| **Freemium**      | High Vol / Low Margin    | **High** - if core is free       | Med (IAP + entitlements) | Low entry / High upgrade     | **Strong Contender**      |
| **Subscription**  | High LTV / Predictable   | Med - Churn/Cancel risks         | High (StoreKit/Auth)     | Med - "Subscription fatigue" | **Industry Standard**     |
| **One-time**      | Low LTV / Front-loaded   | **High** - Sensitive/Transparent | Low                      | High entry ("Stocker shock") | Good supplementary        |
| **Donation**      | Very Low / Unpredictable | **Highest** - "7th Tradition"    | Low (Stripe/IAP)         | Zero                         | **Not scalable alone**    |
| **B2B Licensing** | High Contract Value      | High - Subsidizes users          | High (Teams/Reporting)   | Zero for end-user            | **Strong Parallel Track** |

### B. Feature Gating Matrix

| Feature                | Must Be Free       | Could Be Premium | Notes                                                        |
| ---------------------- | ------------------ | ---------------- | ------------------------------------------------------------ |
| **Crisis/SOS tools**   | ✅ YES             | ❌ NO            | **Ethical Hard Line**: Never paywall safety.                 |
| **Meeting finder**     | ✅ YES             | ❌ NO            | Core utility; paywalling reduces accuracy/value.             |
| **Basic journaling**   | ✅ YES             | ❌ NO            | "Meeting in your pocket" must remain accessible.             |
| **Step 4 inventories** | ✅ Basic templates | ✅ "Power Tools" | Deep structured wizards, pattern analysis, export.           |
| **Speaker tapes**      | ✅ Streaming       | ✅ Offline/Notes | Hosting cost is low (external), value is organization.       |
| **Data Features**      | ✅ Export          | ✅ Cloud Sync    | "Data hostage" dynamics kill trust; sync cost justifies fee. |
| **Analytics**          | ✅ Basic streaks   | ✅ Deep Trends   | Advanced correlations (Mood vs Sleep vs Meetings).           |

### C. Legal Checklist & Compliance (US)

- [ ] **HIPAA Applicability**: Likely **NO** for B2C (unless acting as "Business
      Associate" for treatment center).
- [ ] **Data Sensitivity**: Treat as **SUD Restricted** (42 CFR Part 2
      conceptual equivalent) even if not legally bound.
- [ ] **Store Compliance**: Must use IAP (Apple/Google) for digital features;
      strictly no "web-pay-only" tricks.
- [ ] **Privacy Policy**: Must explicitly state "No data sharing with ad
      networks" (FTC Health Breach Risk).
- [ ] **Cancellation**: "Click-to-cancel" must be as easy as signup (ROSCA/State
      laws).
- [ ] **Terms**: Include "Not medical advice" and "No outcome guarantees"
      disclaimers.

### D. Cost/Revenue Projections (Estimates)

| User Scale       | Monthly Costs (Est)   | Required Revenue | Break-even Analysis                              |
| ---------------- | --------------------- | ---------------- | ------------------------------------------------ |
| **100 users**    | ~$0 (Free tiers)      | $0               | **Funded by Dev**                                |
| **1,000 users**  | <$50 (Firestore)      | $50              | ~5 subs @ $9.99/mo                               |
| **10,000 users** | ~$200 (DB+Functions)  | $200             | ~20 subs @ $9.99/mo                              |
| **100k users**   | ~$800 (mostly DB/Net) | $800             | **Highly Profitable** (if audio is external URL) |

> **Note on Audio**: If we host files, 100k users = ~$350/mo bandwidth. If we
> use external URLs (YouTube/Archive.org links), bandwidth is $0 for us.

---

## 📋 Phase 3: Decision Framework (✅ Complete)

### Key Strategy Decisions (Dec 15, 2025)

1. **Gating Strategy**: **Growth Tab features are PREMIUM.**
   - _Free Core_: Meetings, Today (Sobriety), Support Network.
   - _Premium_: Analytics, Advanced Inventories, Growth Dashboard charts.

2. **Timing**: Monetization logic implementation happens **AFTER** Growth Tab
   features are built.
   - _Reasoning_: Build value first, then gate it. Avoids slowing down feature
     dev with entitlement logic early on.

3. **Model**: Implies **Freemium** (Free Core + Paid Growth Tab upgrades).

---

## 📋 Phase 4: Implementation Roadmap (📋 Pending)

Once Growth Tab features are ready:

- [ ] Select Payment Provider (RevenueCat recommended for simplicity)
- [ ] Create "Growth Plan" entitlement
- [ ] Wrap Growth Tab components in `<PremiumGate>` component
- [ ] Build "Upgrade to Unlock Insights" paywall screen
- [ ] Connect to App Store / Play Store IAP

---

## 📚 References to Gather

- [ ] I Am Sober pricing/features analysis
- [ ] Nomo pricing/features analysis
- [ ] Headspace/Calm monetization case study
- [ ] BetterHelp monetization case study
- [ ] Recovery app market size reports
- [ ] App Store subscription best practices
- [ ] AA World Services guidelines on technology

---

## 🗓️ Version History

| Version | Date       | Changes                                      | Author           |
| ------- | ---------- | -------------------------------------------- | ---------------- |
| 2.0     | 2026-01-02 | Standardized structure per Phase 4 migration | Claude           |
| 1.0     | 2025-12-15 | Initial research document                    | Development Team |

---

## 🤖 AI Instructions

**For AI Assistants working on monetization:**

1. **Read Phase 2 & 3 decisions** before making implementation suggestions
2. **Never suggest paywalling** crisis/SOS, meeting finder, or basic journaling
3. **Reference Feature Gating Matrix** when discussing premium features
4. **Follow Freemium model** as decided in Phase 3
5. **Wait for Growth Tab** completion before implementing payment logic
6. **Update this document** when research findings change

**When implementing Phase 4:**

```bash
# Update this document when payment provider selected
# Add implementation notes as you build
git add docs/MONETIZATION_RESEARCH.md
git commit -m "docs: Update Monetization Research - Phase 4 progress"
```

---

## 📝 Update Triggers

**Update this document when:**

- ✅ New market research completed
- ✅ Competitor pricing changes
- ✅ Feature gating decisions change
- ✅ Cost projections need updating
- ✅ Phase 4 implementation progresses

---

**END OF DOCUMENT**
