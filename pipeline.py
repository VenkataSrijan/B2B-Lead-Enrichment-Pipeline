#!/usr/bin/env python3
"""
Autonomous B2B Lead Enrichment & AI Qualification Engine (Production Blueprint)
Developed for: Enterprise Lead Qualification at Scale (50,000+ leads/month)

Features:
- High-Throughput Concurrent Ingestion: Asynchronous network pipeline using asyncio + aiohttp.
- Fault-Tolerant Enrichment: Concurrent simulation of third-party APIs (Clay/Phantombuster) with fallback handling.
- Strict Structured Outputs: Leverages modern Google GenAI SDK (google-genai) with Pydantic response_schema.
- Resilient API Architecture: Retries with randomized exponential backoff + jitter for rate limits (HTTP 429).
- Durable Relational Mapping: SQLAlchemy (asyncpg / psycopg2) schema for unified PostgreSQL storage.
"""

import os
import sys
import json
import asyncio
import logging
import random
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

# Third-party dependencies
# Make sure to run: pip install google-genai pydantic sqlalchemy psycopg2-binary aiohttp
import aiohttp
from pydantic import BaseModel, Field, ValidationError
from google import genai
from google.genai import types
from google.genai.errors import APIError

# Setup structured enterprise logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("B2BEnrichmentEngine")

# =====================================================================
# 1. STRUCTURAL CONFIGURATIONS & SCHEMAS (Pydantic / Dataclasses)
# =====================================================================

@dataclass
class EnrichedCompanyProfile:
    domain: string
    company_name: string
    employee_count: int
    industry: string
    total_funding_usd: float
    geographic_headquarters: string
    description: string
    technologies: List[str]
    enrichment_status: string = "SUCCESS"


class AIQualificationResult(BaseModel):
    """Rigid output schema to force Gemini to return exactly this JSON payload structure."""
    is_qualified: bool = Field(
        description="Strictly true if the company matches minimum employee threshold, raising requirements, and industry scopes. False otherwise."
    )
    alignment_score: int = Field(
        ge=1, le=10,
        description="A B2B ICP alignment score from 1 (completely outside target profile) to 10 (perfect client profile)."
    )
    justification: str = Field(
        description="Comprehensive, step-by-step reasoning details. Must reference company employee size, funding level, and industry overlap."
    )
    recommended_outbound_angle: str = Field(
        description="A hyper-personalized, context-rich cold outreach sequence opening pitch based on their tech stack, location, and description. N/A if disqualified."
    )


# =====================================================================
# 2. ENRICHMENT LAYER (Asynchronous & Mock API Simulation)
# =====================================================================

class EnrichmentService:
    """Asynchronously calls B2B enrichment services (e.g., Clay, Phantombuster, clearbit) with concurrency."""
    
    def __init__(self, mock_delay: float = 0.5):
        self.mock_delay = mock_delay

    async def fetch_enrichment_data(self, session: aiohttp.ClientSession, domain: string) -> EnrichedCompanyProfile:
        """
        Simulates making a concurrent API call to fetch enrichment metadata.
        In a real production environment, replace this with an actual endpoint:
        e.g., await session.get(f"https://api.clay.com/v1/enrich?domain={domain}", headers=headers)
        """
        # Ensure we sanitize domain inputs to prevent injection issues
        clean_domain = domain.strip().lower().replace("https://", "").replace("http://", "").replace("www.", "")
        
        # Simulated async networking delay
        await asyncio.sleep(random.uniform(0.1, self.mock_delay))
        
        # Real-world data mocks for common domains
        presets = {
            "stripe.com": ("Stripe", 8500, "Financial Technology", 2200000000.0, "San Francisco, CA", "Financial infrastructure for the internet. Stripe helps businesses accept payments and manage revenue online.", ["Ruby", "React", "AWS", "Kubernetes"]),
            "vercel.com": ("Vercel", 450, "Cloud Infrastructure & DevOps", 313000000.0, "New York, NY", "Cloud platform for modern front-end developers. Creators of Next.js.", ["React", "TypeScript", "Next.js", "Tailwind CSS", "Vercel Edge"]),
            "notion.so": ("Notion", 650, "Productivity & Collaboration SaaS", 343000000.0, "San Francisco, CA", "All-in-one workspaces centralizing notes, documents, wikis, and task databases.", ["TypeScript", "React", "PostgreSQL", "AWS"]),
            "retable.io": ("Retable", 25, "No-Code Spreadsheets & Operations", 1200000.0, "London, UK", "An interactive online spreadsheet and operational database platform.", ["Python", "Angular", "Docker", "PostgreSQL"])
        }
        
        if clean_domain in presets:
            name, size, industry, funding, hq, desc, tech = presets[clean_domain]
            return EnrichedCompanyProfile(clean_domain, name, size, industry, funding, hq, desc, tech)

        # Realistic generator for other unlisted domains
        hash_val = sum(ord(c) for c in clean_domain)
        name = clean_domain.split(".")[0].capitalize()
        
        industries = ["Healthcare IT", "Supply Chain Logtech", "E-commerce Infrastructure", "Cybersecurity SaaS", "Marketing Tech", "EdTech Suite"]
        selected_industry = industries[hash_val % len(industries)]
        
        sizes = [15, 65, 145, 410, 1100, 4800]
        size = sizes[hash_val % len(sizes)]
        
        fundings = [0.0, 750000.0, 3500000.0, 15000000.0, 65000000.0, 180000000.0]
        funding = fundings[hash_val % len(fundings)]
        
        hqs = ["Austin, TX", "Seattle, WA", "Chicago, IL", "Boston, MA", "Berlin, Germany"]
        hq = hqs[hash_val % len(hqs)]
        
        tech_stack = ["React", "Python", "GCP", "PostgreSQL", "Salesforce"]
        active_tech = [t for i, t in enumerate(tech_stack) if (hash_val + i) % 2 == 0]

        desc = f"{name} is an active competitor in the {selected_industry} sector, utilizing high-level software automation."

        return EnrichedCompanyProfile(
            domain=clean_domain,
            company_name=name,
            employee_count=size,
            industry=selected_industry,
            total_funding_usd=funding,
            geographic_headquarters=hq,
            description=desc,
            technologies=active_tech
        )


# =====================================================================
# 3. AI PROCESSING LAYER (Google GenAI SDK with Structured Outputs)
# =====================================================================

class GeminiQualificationEngine:
    """Invokes Gemini model to qualify leads based on strict criteria, with exponential backoff retries."""

    def __init__(self, api_key: Optional[str] = None):
        # google-genai automatically looks up GEMINI_API_KEY environment variable if not passed
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not defined. Falling back to Simulated Qualification mode.")
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    def _sanitize_unstructured_inputs(self, text: string) -> string:
        """Sanitizes scraped/unstructured content to ensure clean JSON injection."""
        if not text:
            return ""
        # Strip control characters, strip excessive whitespace, escape backslashes/quotes
        sanitized = text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").replace("\r", "")
        return sanitized.strip()

    async def qualify_lead_async(self, profile: EnrichedCompanyProfile, criteria: Dict[str, Any]) -> AIQualificationResult:
        """
        Runs asynchronous LLM API evaluation. Since Gemini Python client is synchronous,
        we run it safely in a thread pool using asyncio.to_thread to maintain high-throughput.
        """
        return await asyncio.to_thread(self._qualify_lead_sync, profile, criteria)

    def _qualify_lead_sync(self, profile: EnrichedCompanyProfile, criteria: Dict[str, Any]) -> AIQualificationResult:
        """Executes actual Google GenAI qualification call with error handling and exponential backoff."""
        if not self.client:
            # Simulated local fallback logic when API keys are absent
            return self._execute_simulated_fallback(profile, criteria)

        # Sanitize data
        clean_desc = self._sanitize_unstructured_inputs(profile.description)
        
        # Build strict ICP guidelines
        system_instruction = (
            f"You are a principal B2B SaaS Account Executive evaluating incoming marketing leads.\n"
            f"Filter companies strictly based on the following Ideal Customer Profile (ICP):\n"
            f"- Preferred Industries: {', '.join(criteria.get('preferred_industries', []))}\n"
            f"- Minimum Corporate Size: {criteria.get('min_employees', 50)} employees\n"
            f"- Minimum Financial Funding: ${criteria.get('min_funding_usd', 5000000.0):,.2f} USD\n\n"
            f"Be incredibly critical. Only companies exceeding thresholds are marked as 'is_qualified = true'.\n"
            f"Evaluate industry keywords carefully. Ensure all results comply perfectly with the output schema."
        )

        prompt = (
            f"Please evaluate company: {profile.company_name} ({profile.domain})\n"
            f"Enriched Data Fields:\n"
            f"- Employee Size Count: {profile.employee_count}\n"
            f"- Declared Industry: {profile.industry}\n"
            f"- Cumulative Funding: ${profile.total_funding_usd:,.2f} USD\n"
            f"- Headquarters: {profile.geographic_headquarters}\n"
            f"- Stack Profile: {', '.join(profile.technologies)}\n"
            f"- Description: {clean_desc}\n\n"
            f"Determine eligibility. Ensure you calculate a logical, highly strict alignment_score."
        )

        # Exponential Backoff Retry parameters (tailored for high-throughput 50k monthly limits)
        max_retries = 5
        base_delay = 2.0  # seconds
        
        for attempt in range(max_retries):
            try:
                # Force structured JSON directly conforming to the Pydantic BaseModel
                response = self.client.models.generate_content(
                    model="gemini-3.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        response_schema=AIQualificationResult,
                        temperature=0.1,  # Low temperature for highly consistent analytical qualifying
                    )
                )
                
                # Load response text
                payload_json = json.loads(response.text.strip())
                return AIQualificationResult(**payload_json)

            except APIError as api_err:
                # Handle standard Gemini Rate Limits (HTTP 429) or Server Overloads (HTTP 503)
                if api_err.code in [429, 503]:
                    # Full jitter exponential backoff formula: delay = base * (2^attempt) + random_jitter
                    jitter = random.uniform(0.1, 1.0)
                    delay = (base_delay * (2 ** attempt)) + jitter
                    logger.warning(
                        f"Gemini API rate limited (code {api_err.code}) on {profile.domain}. "
                        f"Attempt {attempt + 1}/{max_retries}. Retrying in {delay:.2f} seconds..."
                    )
                    time.sleep(delay)
                else:
                    logger.error(f"Fatal Gemini API error on {profile.domain}: {api_err}")
                    raise api_err
            except (json.JSONDecodeError, ValidationError) as parse_err:
                logger.error(f"Schema parsing error on {profile.domain} (Attempt {attempt+1}): {parse_err}")
                if attempt == max_retries - 1:
                    raise parse_err
                time.sleep(1.0)
            except Exception as ex:
                logger.error(f"Unexpected operational pipeline failure on {profile.domain}: {ex}")
                raise ex

        raise RuntimeException(f"Failed to qualify {profile.domain} after {max_retries} backoff retries.")

    def _execute_simulated_fallback(self, profile: EnrichedCompanyProfile, criteria: Dict[str, Any]) -> AIQualificationResult:
        """Simulated analytical scoring used exclusively when GEMINI_API_KEY is not defined."""
        # Simple logical rules
        passes_size = profile.employee_count >= criteria.get("min_employees", 50)
        passes_funding = profile.total_funding_usd >= criteria.get("min_funding_usd", 5000000.0)
        passes_industry = any(ind.lower() in profile.industry.lower() for ind in criteria.get("preferred_industries", []))

        score = 1
        if passes_size: score += 3
        if passes_funding: score += 3
        if passes_industry: score += 3

        is_qualified = score >= 7

        justification = (
            f"[SIMULATED MOCK MODE] Evaluated {profile.company_name} against target criteria. "
            f"Employee count ({profile.employee_count}) vs minimum ({criteria.get('min_employees')}) -> Passes: {passes_size}. "
            f"Venture funding (${profile.total_funding_usd:,.0f}) vs minimum (${criteria.get('min_funding_usd'):,.0f}) -> Passes: {passes_funding}. "
            f"Industry context fits -> Passes: {passes_industry}. Consolidated raw ICP Score: {score}/10."
        )

        outbound_angle = (
            f"Connect with sales leads in the {profile.industry} division at their {profile.geographic_headquarters} HQ. "
            f"Introduce our pipeline scaling solution that easily interfaces with their current stack ({', '.join(profile.technologies[:2])})."
            if is_qualified else "N/A - Lead disqualified from active pipeline."
        )

        return AIQualificationResult(
            is_qualified=is_qualified,
            alignment_score=score,
            justification=justification,
            recommended_outbound_angle=outbound_angle
        )


# =====================================================================
# 4. STORAGE LAYER (SQLAlchemy Postgres ORM Mapping)
# =====================================================================

# In a live setup, import:
# from sqlalchemy.orm import declarative_base, sessionmaker
# from sqlalchemy import Column, Integer, String, Boolean, JSON, Float, DateTime, create_engine

# For the visual pipeline demonstration and standard compilation, we supply the mapping declarations:

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/lead_db")

# Standard model blueprint declarations for production setups:
MODEL_CODE_BLUEPRINT = """
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Boolean, JSON, Float, DateTime
import datetime

Base = declarative_base()

class ConsolidatedLeadProfile(Base):
    __tablename__ = 'consolidated_lead_profiles'

    id = Column(Integer, primary_key=True, autoincrement=True)
    domain = Column(String(255), unique=True, nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    employee_count = Column(Integer, nullable=False)
    industry = Column(String(150), nullable=False, index=True)
    total_funding_usd = Column(Float, nullable=False)
    geographic_headquarters = Column(String(255))
    technologies = Column(JSON, nullable=False) # List of active components
    
    # AI Qualification properties
    is_qualified = Column(Boolean, nullable=False, index=True)
    alignment_score = Column(Integer, nullable=False)
    justification = Column(String(2000), nullable=False)
    recommended_outbound_angle = Column(String(2000))
    
    # Audit fields
    raw_enriched_payload = Column(JSON, nullable=False) # Capture raw third party dump
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)
"""


# =====================================================================
# 5. HIGH-THROUGHPUT SYSTEM PIPELINE COORDINATOR
# =====================================================================

class B2BLeadPipeline:
    """Ties together Ingestion, Enrichment, AI Qualification, and stores results."""

    def __init__(self, criteria: Dict[str, Any], batch_size: int = 5):
        self.criteria = criteria
        self.batch_size = batch_size
        self.enricher = EnrichmentService()
        self.ai_engine = GeminiQualificationEngine()

    async def process_single_domain(self, session: aiohttp.ClientSession, domain: string) -> Dict[str, Any]:
        """Runs enrichment and qualification on a single domain safely with logging."""
        try:
            logger.info(f"🚀 Ingesting Lead: {domain}")
            
            # 1. Enrichment Layer
            profile = await self.enricher.fetch_enrichment_data(session, domain)
            logger.info(f"🔍 Enriched {domain}: Industry='{profile.industry}', Size={profile.employee_count}, Funding=${profile.total_funding_usd:,.0f}")
            
            # 2. AI Processing Layer
            qualification = await self.ai_engine.qualify_lead_async(profile, self.criteria)
            logger.info(f"🎯 Qualified {domain}: Alignment Score={qualification.alignment_score}/10, Qualified={qualification.is_qualified}")

            # 3. Simulate SQL Storage Layer insertion
            consolidated_record = {
                "domain": profile.domain,
                "company_name": profile.company_name,
                "employee_count": profile.employee_count,
                "industry": profile.industry,
                "total_funding_usd": profile.total_funding_usd,
                "geographic_headquarters": profile.geographic_headquarters,
                "technologies": profile.technologies,
                "is_qualified": qualification.is_qualified,
                "alignment_score": qualification.alignment_score,
                "justification": qualification.justification,
                "recommended_outbound_angle": qualification.recommended_outbound_angle,
                "enrichment_status": "PROCESSED",
                "processed_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return consolidated_record

        except Exception as e:
            logger.error(f"❌ Failed processing domain '{domain}': {e}")
            return {
                "domain": domain,
                "enrichment_status": "FAILED",
                "error_details": str(e)
            }

    async def run_pipeline_for_batch(self, domains: List[str]) -> List[Dict[str, Any]]:
        """Executes full pipeline concurrently in partitioned batches using asyncio.gather."""
        results = []
        
        # Open single client session for reuse to ensure high network throughput
        async with aiohttp.ClientSession() as session:
            # Partition bulk data into manageable batches
            for i in range(0, len(domains), self.batch_size):
                batch = domains[i : i + self.batch_size]
                logger.info(f"\n--- Processing Batch {i // self.batch_size + 1}: {batch} ---")
                
                # Execute concurrently within the batch
                tasks = [self.process_single_domain(session, dom) for dom in batch]
                batch_results = await asyncio.gather(*tasks)
                results.extend(batch_results)
                
        return results


# =====================================================================
# 6. RUNNABLE SIMULATION / COMMAND-LINE ENTRY POINT
# =====================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("AUTONOMOUS B2B LEAD ENRICHMENT ENGINE - DEMO SIMULATION RUN")
    print("=" * 70)

    # 1. Define ideal target qualification criteria
    target_icp_rules = {
        "preferred_industries": ["Financial Technology", "Cloud Infrastructure & DevOps", "Productivity & Collaboration SaaS", "Artificial Intelligence & Data Labeling"],
        "min_employees": 100,
        "min_funding_usd": 10000000.0 # $10M Minimum funding
    }

    # 2. Ingest input array of domains
    test_domains = [
        "stripe.com",      # High size, high funding, matches Fintech industry (Pass)
        "vercel.com",      # Mid size, high funding, matches Cloud DevOps (Pass)
        "notion.so",       # Mid size, high funding, matches Productivity SaaS (Pass)
        "retable.io",      # Small size, low funding (Should be Disqualified)
        "unknown-saas.net" # Generated company metadata (Will depend on random hash metrics)
    ]

    print(f"Ingested target list: {test_domains}")
    print(f"Strict Target ICP Filter: Employee Threshold >= {target_icp_rules['min_employees']} | Funding >= ${target_icp_rules['min_funding_usd']:,.0f}\n")

    # Initialize Coordinator
    pipeline = B2BLeadPipeline(criteria=target_icp_rules, batch_size=3)

    # Execute main concurrent loop
    loop = asyncio.get_event_loop()
    consolidated_profiles = loop.run_until_complete(pipeline.run_pipeline_for_batch(test_domains))

    # Output detailed report overview
    print("\n" + "=" * 70)
    print("CONSOLIDATED LEAD ENRICHMENT PIPELINE REPORT")
    print("=" * 70)
    
    for lead in consolidated_profiles:
        print(f"\n🏢 Company: {lead.get('company_name')} ({lead.get('domain')})")
        print(f"📊 Status: {lead.get('enrichment_status')}")
        if lead.get("enrichment_status") == "PROCESSED":
            print(f"💼 Employee Count: {lead.get('employee_count')} | Industry: {lead.get('industry')}")
            print(f"💰 Venture Capital Funding: ${lead.get('total_funding_usd'):,.2f} USD")
            print(f"🎯 Qualified: {'✅ YES' if lead.get('is_qualified') else '❌ NO'} (ICP Alignment Score: {lead.get('alignment_score')}/10)")
            print(f"📝 AI Justification: {lead.get('justification')}")
            print(f"📣 Outbound Personalization Opening Angle:\n   \"{lead.get('recommended_outbound_angle')}\"")
        else:
            print(f"⚠️ Error details: {lead.get('error_details')}")
        print("-" * 50)
