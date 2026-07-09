# LeadSync v2.4 — Autonomous B2B Lead Enrichment & AI Qualification Engine

LeadSync is an enterprise-grade, full-stack B2B pipeline simulation and execution engine. It automates the process of corporate domain ingestion, multi-source metadata enrichment (simulating Clay, Phantombuster, and Clearbit), and structured AI qualification using Google GenAI (Gemini) against custom Ideal Customer Profile (ICP) rules.

The system is split into a **highly responsive React dashboard** styled under the **Professional Polish Design System** and a **robust Express + Vite backend server** implementing the `@google/genai` TypeScript SDK with rigid schema schemas. In addition, production blueprints for autonomous Python runners and optimized PostgreSQL tables are included.

---

## 🏗️ System Architecture & Workflow

The platform implements a multi-tiered pipeline that executes in four deterministic, high-fidelity steps:

```
[ Domain Ingestion ] ➔ [ Data Enrichment ] ➔ [ Gemini AI Evaluation ] ➔ [ Database Persistence ]
   (Input / Presets)      (Company Profiler)       (Structured Schema)       (Postgres Archive)
```

1. **Ingestion Layer**: Users input a target domain (e.g., `stripe.com`, `vercel.com`, `notion.so`) or trigger a custom batch pipeline.
2. **Enrichment Layer**: The engine scrapes and generates structured company profile data, including headcount, venture funding, headquarters location, corporate descriptions, and active technological stacks.
3. **Evaluation Layer (Gemini API)**: The core intelligence executes a server-side LLM call via the Google GenAI SDK. If a `GEMINI_API_KEY` is present, it issues structured prompts requiring Pydantic-like JSON responses containing qualification flags, alignment scoring (1-10), strict rationales, and outbound sales pitches. If no key is set, the system falls back gracefully to a deterministic local rules-engine simulation.
4. **Storage Layer**: Processed leads are cached and displayed in a real-time table queue and stored permanently in an in-memory session database, with SQL schemas prepared for production PostgreSQL warehousing.

---

## 🎨 Professional Polish UI Features

The interface is styled using customized **Tailwind CSS v4** configurations based on the **Professional Polish Theme**:

- **Cosmic Slate Sidebar**: A left-hand vertical control center containing responsive tab triggers, interactive hover tooltip menus, and unified layout bounds.
- **Dynamic Real-Time Metrics Bar**: Displays core operating metrics including 24-hour pipeline throughput, Gemini AI success rate, average enrichment latency (ms), and active network worker threads.
- **Dynamic ICP Rule Panel**: Interactive controls allowing on-the-fly adjustment of Employee Headcount thresholds, VC Venture Funding levels, and multi-tag target Industry filters.
- **Detailed Qualification Inspector**: Beautifully displays qualification badges, alignment metrics (e.g., `9.4/10`), structured scraped technologies, LLM qualification justifications, and hyper-personalized GTM outreach opening pitch suggestions with copy-to-clipboard functionality.
- **Multi-Tab Architecture Layout**:
  - **`Σ` Pipeline Simulator**: Trigger and inspect individual company runs in real-time.
  - **`⬡` Processed Archive**: A high-density data grid showcasing past runs, searchable results, and individual record inspections.
  - **`💾` Code & Blueprints**: Displays physical file mappings for the production Python script and PostgreSQL migrations.
  - **`⚙️` System Docs**: Comprehensive developer manuals detailing the exact API shapes, JSON structures, and environmental options.

---

## 📁 File Structure

```
├── server.ts             # Express.js entry point with custom Vite middleware & Gemini integration
├── src/
│   ├── App.tsx           # Primary React workspace, view tabs, and core client UI
│   ├── index.css         # Global stylesheet importing Tailwind CSS v4 & custom color vars
│   ├── main.tsx          # Client-side mount point
│   ├── types.ts          # Shared TypeScript type signatures and interfaces
│   └── codeTemplates.ts  # Pre-bundled static files displayed in the Blueprints section
├── pipeline.py           # Production-grade Python concurrent async pipeline blueprint
├── schema.sql            # Performance-optimized PostgreSQL table definitions and indexing scripts
├── package.json          # Dependency management configuration
└── .env.example          # Template file for secret keys and custom parameters
```

---

## ⚡ Tech Stack & Libraries

- **Frontend**: React 19, Motion (by Framer) for transitions, Lucide React for modern vector icons.
- **Backend & Middleware**: Express 4, Vite 6 dev-server proxying, TSX script execution, Esbuild compilation bundling.
- **Intelligence**: `@google/genai` TypeScript SDK (utilizing the recommended full-stack patterns).
- **Styling**: Tailwind CSS v4, custom CSS variables (`--color-brand-*`).
- **Blueprints**: Python 3 (asyncio + aiohttp), SQLAlchemy, PostgreSQL indexes (B-Tree + JSONB GIN).

---

## 🚀 Installation & Local Execution

Follow these instructions to run the full-stack system locally.

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) and **npm** installed on your workstation.

### 2. Install Dependencies
Clone your exported workspace and run:
```bash
npm install
```

### 3. Environment Setup
Configure your server environment variables. Create a `.env` file in the root of the project:
```bash
cp .env.example .env
```
Inside `.env`, define your Gemini API key to activate the live AI qualification engine:
```env
# Server-side Secret Keys (Do not prefix with VITE_)
GEMINI_API_KEY=your_actual_google_gemini_api_key_here
```

### 4. Run Development Server
Boot the Express + Vite server concurrently using:
```bash
npm run dev
```
The server will start on port **3000** and can be accessed at `http://localhost:3000`.

### 5. Production Build & Execution
To compile the codebase for high-performance production distribution:
```bash
# Compiles React static assets and bundles server.ts into dist/server.cjs
npm run build

# Starts the standalone compiled Node server
npm run start
```

---

## 🛠️ API Documentation

### `POST /api/enrich-qualify`
Triggers the full pipeline on a given domain.

**Request Payload:**
```json
{
  "domain": "stripe.com",
  "criteria": {
    "minEmployees": 100,
    "minFundingUsd": 10000000,
    "targetIndustries": ["Financial Technology", "SaaS", "Enterprise Tech"]
  }
}
```

**Response Output (Live AI Streamed Data Structure):**
```json
{
  "domain": "stripe.com",
  "company_name": "Stripe",
  "employee_count": 8500,
  "industry": "Financial Technology",
  "total_funding_usd": 2200000000,
  "geographic_headquarters": "San Francisco, CA",
  "technologies": ["React", "Ruby", "AWS", "Kubernetes", "Salesforce"],
  "is_qualified": true,
  "alignment_score": 10,
  "justification": "Stripe represents a perfect ICP match. Headcount (8,500) exceeds the 100 employee minimum, and funding ($2.2B) is substantially above the $10M VC threshold. Furthermore, the industry (Financial Technology) perfectly aligns with the target parameters.",
  "recommended_outbound_angle": "Hey there, seeing as Stripe is scaling out its Financial Technology infrastructure utilizing React and AWS, I'd love to show you how our automation streamlines these precise development workflows...",
  "processed_at": "2026-07-09T11:55:00.000Z",
  "simulated": false
}
```

---

## 🐍 Python & PostgreSQL Production Integration

### Python Pipeline Execution (`pipeline.py`)
For headless cron jobs or larger data-science models, run the production blueprint.
1. Install dependencies:
   ```bash
   pip install google-genai pydantic sqlalchemy psycopg2-binary aiohttp
   ```
2. Configure credentials:
   ```bash
   export GEMINI_API_KEY="your-key"
   ```
3. Run the script:
   ```bash
   python pipeline.py
   ```

### Database Schema Migrations (`schema.sql`)
Import the performance-optimized migrations to your PostgreSQL target:
```bash
psql -U your_user -d your_db -f schema.sql
```
This migration deploys the `consolidated_lead_profiles` table, configures optimal B-Tree keys, creates a **GIN Index** on the `technologies` JSONB array for accelerated search, and hooks up an automatic modification timestamp trigger.

---

## 🛡️ License and Security

This project employs server-side token proxies to ensure your **`GEMINI_API_KEY` is never exposed** to the client web browser. All requests are securely routed and executed in isolated server environments.
