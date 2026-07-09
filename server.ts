import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client using GoogleGenAI recommended full-stack patterns
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ----------------- Enrichment Mock Database -----------------
interface CompanyMetadata {
  domain: string;
  name: string;
  size: number;
  industry: string;
  funding: number; // in USD
  hq: string;
  description: string;
  technologies: string[];
}

const PRESET_COMPANIES: Record<string, CompanyMetadata> = {
  "stripe.com": {
    domain: "stripe.com",
    name: "Stripe",
    size: 8500,
    industry: "Financial Technology",
    funding: 2200000000,
    hq: "San Francisco, CA",
    description: "Financial infrastructure for the internet. Stripe helps companies of all sizes accept payments and manage their businesses online.",
    technologies: ["React", "Ruby", "AWS", "Kubernetes", "Salesforce"]
  },
  "vercel.com": {
    domain: "vercel.com",
    name: "Vercel",
    size: 450,
    industry: "Cloud Infrastructure & DevOps",
    funding: 313000000,
    hq: "New York, NY",
    description: "Vercel provides developer tools and cloud hosting for frontend frameworks. Creator of Next.js.",
    technologies: ["React", "Next.js", "Node.js", "Tailwind CSS", "AWS"]
  },
  "notion.so": {
    domain: "notion.so",
    name: "Notion Labs",
    size: 650,
    industry: "Productivity & Collaboration SaaS",
    funding: 343000000,
    hq: "San Francisco, CA",
    description: "An all-in-one workspace for notes, wikis, tasks, and project management. Designed to centralize knowledge across teams.",
    technologies: ["React", "TypeScript", "PostgreSQL", "Amplitude", "Intercom"]
  },
  "retable.io": {
    domain: "retable.io",
    name: "Retable",
    size: 25,
    industry: "No-Code Database SaaS",
    funding: 1200000,
    hq: "London, UK",
    description: "An interactive no-code online spreadsheet and database platform helping operations teams collaborate.",
    technologies: ["Angular", "Python", "Docker", "Stripe", "PostgreSQL"]
  },
  "scale.com": {
    domain: "scale.com",
    name: "Scale AI",
    size: 1100,
    industry: "Artificial Intelligence & Data Labeling",
    funding: 1600000000,
    hq: "San Francisco, CA",
    description: "Scale provides data infrastructure for AI, enabling machine learning teams to generate high-quality training data at scale.",
    technologies: ["React", "Python", "PyTorch", "Kubernetes", "AWS"]
  }
};

function performEnrichment(domain: string): CompanyMetadata {
  const normalized = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
  if (PRESET_COMPANIES[normalized]) {
    return PRESET_COMPANIES[normalized];
  }

  // Generate deterministic metadata for simulated enrichment of unlisted domains
  const hash = normalized.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const name = normalized.split(".")[0].charAt(0).toUpperCase() + normalized.split(".")[0].slice(1);
  
  const industries = ["Healthcare Tech", "Logistics Software", "Cybersecurity", "E-commerce Infrastructure", "EdTech SaaS", "HR Tech", "Fintech"];
  const selectedIndustry = industries[hash % industries.length];
  
  const sizes = [12, 45, 120, 310, 850, 2400];
  const size = sizes[hash % sizes.length];
  
  const fundings = [0, 500000, 4500000, 18000000, 75000000, 250000000];
  const funding = fundings[hash % fundings.length];
  
  const hqs = ["Austin, TX", "Seattle, WA", "Boston, MA", "Chicago, IL", "Denver, CO", "Toronto, ON"];
  const hq = hqs[hash % hqs.length];

  const techPool = ["React", "Vue", "Python", "Go", "AWS", "GCP", "Salesforce", "HubSpot", "PostgreSQL"];
  const technologies = techPool.filter((_, i) => (hash + i) % 3 === 0);

  return {
    domain: normalized,
    name,
    size,
    industry: selectedIndustry,
    funding,
    hq,
    description: `${name} is a high-growth player in the ${selectedIndustry} space, specializing in enterprise workflow automation and intelligence.`,
    technologies
  };
}

// ----------------- API Endpoints -----------------

// Live/Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    gemini_configured: !!ai,
    timestamp: new Date().toISOString()
  });
});

// Primary Enrichment & Qualification Pipeline Trigger
app.post("/api/enrich-qualify", async (req, res) => {
  try {
    const { domain, criteria } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "Domain parameter is required" });
    }

    // 1. Perform Ingestion & Enrichment (Mock third-party API fetch like Clay or Phantombuster)
    const enrichedData = performEnrichment(domain);

    // Default target profile values if not custom set
    const companySizeMin = criteria?.companySizeMin ?? 50;
    const fundingMin = criteria?.fundingMin ?? 5000000;
    const targetIndustries = criteria?.industries ?? ["Financial Technology", "Cloud Infrastructure", "Productivity & Collaboration SaaS", "Artificial Intelligence & Data Labeling", "Cybersecurity", "SaaS"];

    // 2. Prepare Structured LLM Qualification Request
    const systemPrompt = `You are an elite, highly critical B2B Sales Development Representative (SDR) and Go-To-Market Analyst. 
Your single goal is to evaluate if a target company profile aligns with our strict Ideal Customer Profile (ICP).

Strict ICP Criteria:
- Minimum Company Size: ${companySizeMin} employees.
- Minimum Funding Raised: $${fundingMin.toLocaleString()} USD.
- Preferred Industries: ${targetIndustries.join(", ")}.

Your evaluation must be highly objective, analytical, and logical. Underperforming companies or industries outside the scope should be disqualified with a low score.
You must return a structured JSON response matching the requested schema.`;

    const promptText = `Please evaluate the following enriched company profile against the criteria:

ENRICHED PROFILE:
- Company Domain: ${enrichedData.domain}
- Legal Entity Name: ${enrichedData.name}
- Total Employee Count: ${enrichedData.size}
- Main Industry Classification: ${enrichedData.industry}
- Total Venture Capital Raised: $${enrichedData.funding.toLocaleString()} USD
- Geographic Headquarters: ${enrichedData.hq}
- Company Description: ${enrichedData.description}
- Active Tech Stack: ${enrichedData.technologies.join(", ")}

Analyze this data. Note if it hits all criteria perfectly, partially, or fails them. 
Be rigorous with the alignment score (1-10). Provide a highly actionable, tailored outbound sales angle if qualified, or a professional rationale for rejection if disqualified.`;

    // 3. AI Processing Layer - Execute Structured Gemini Call
    if (!ai) {
      // If Gemini Key is not configured yet, return realistic simulated qualification based on math
      const passesSize = enrichedData.size >= companySizeMin;
      const passesFunding = enrichedData.funding >= fundingMin;
      const isPreferredIndustry = targetIndustries.some((ind: string) => 
        enrichedData.industry.toLowerCase().includes(ind.toLowerCase())
      );

      const score = (passesSize ? 3 : 1) + (passesFunding ? 3 : 1) + (isPreferredIndustry ? 4 : 1);
      const isQualified = score >= 6;

      const justification = `[SIMULATED - No Gemini API Key in Secrets] Company '${enrichedData.name}' raising $${(enrichedData.funding / 1e6).toFixed(1)}M with ${enrichedData.size} employees evaluated against ICP. Sizes metric passes: ${passesSize}. Funding metric passes: ${passesFunding}. Industry matches preferred criteria: ${isPreferredIndustry}. Calculated raw alignment score is ${score}/10.`;
      
      const outboundAngle = isQualified 
        ? `Leverage their active tech stack (${enrichedData.technologies.slice(0, 2).join(", ")}) to pitch our high-throughput integrations, positioning our value proposition specifically for their headquarters in ${enrichedData.hq}.`
        : "N/A - Disqualified.";

      return res.json({
        enriched: enrichedData,
        qualification: {
          is_qualified: isQualified,
          alignment_score: score,
          justification: justification,
          recommended_outbound_angle: outboundAngle
        },
        simulated: true
      });
    }

    // Call the actual Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_qualified: { 
              type: Type.BOOLEAN, 
              description: "True if the company is a strong ICP match and qualified for marketing outbound campaigns, false otherwise." 
            },
            alignment_score: { 
              type: Type.INTEGER, 
              description: "Rigorous corporate alignment score from 1 (terrible match) to 10 (perfect match)." 
            },
            justification: { 
              type: Type.STRING, 
              description: "Detailed step-by-step breakdown explaining why they are or are not qualified, detailing criteria matches." 
            },
            recommended_outbound_angle: { 
              type: Type.STRING, 
              description: "If qualified, a highly hyper-personalized outbound sequence hook. If disqualified, suggest a polite deferral strategy." 
            }
          },
          required: ["is_qualified", "alignment_score", "justification", "recommended_outbound_angle"]
        },
        systemInstruction: systemPrompt
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text returned from Gemini API");
    }

    const qualification = JSON.parse(resultText.trim());

    res.json({
      enriched: enrichedData,
      qualification,
      simulated: false
    });

  } catch (error: any) {
    console.error("API Pipeline Error:", error);
    res.status(500).json({
      error: "Failed to process lead qualification pipeline",
      details: error.message || error
    });
  }
});

// Serve frontend app
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
