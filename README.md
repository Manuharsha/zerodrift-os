# ZeroDrift OS — Enterprise Financial Reconciler & Controller
> Track 4: AI Finance Controller · Razorpay AI Buildathon

ZeroDrift OS is an autonomous financial reconciliation engine designed to resolve the verification bottleneck in multi-source fintech operations. It pairs deterministic paise-accurate validation against the RBI/Razorpay MDR fee matrix with an automated diagnostic triage loop and structured dispute API dispatch.

---

## Key Capabilities

- **Deterministic Paise Accuracy ($\epsilon \le ₹0.05$):** Eliminates floating-point rounding drift across complex MDR fee tiers (UPI 0%, Domestic Cards 2%, International 3% + 18% GST).
- **76.36% Automated Settlement:** Ingests dual streams (merchant order ledger vs. Razorpay payout batch) and auto-closes verified matches with zero human touch.
- **Honest Exception Triage:** Classifies remaining variances into 4 root causes:
  1. Gateway Dropped Events (Webhook Loss)
  2. MDR / GST Tier Surcharges (Over-deductions)
  3. Refund Reversal & Clawback Mismatches
  4. T+2 Bank Clearing Floats (Recognized as timing latency, not permanent loss)
- **Active Dispute Resolution:** Dispatches mock structured payloads to `POST /v1/disputes/create`, issues live dispute IDs, and dynamically updates ledger leakage.
- **Cryptographic Audit Export:** Generates downloadable batch CSV audit packets signed with an SHA-256 non-repudiation verification seal.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Executive Light UI + Animated Gemini Blue Accents)
- **State Management:** React Hooks & Deterministic Epsilon Math Engine

---

## Local Development

```bash
git clone [https://github.com/manunp1318np/zerodrift-os.git](https://github.com/manunp1318np/zerodrift-os.git)
cd zerodrift-os
npm install
npm run dev
Open http://localhost:3000 to view the application.

5. Scroll down, click the green **Commit changes...** button, and confirm by clicking **Commit changes**.

---

Once committed, GitHub displays this formatted technical overview on your repository homepage for evaluators, and Vercel will automatically sync the commit without interrupting your running live site.
