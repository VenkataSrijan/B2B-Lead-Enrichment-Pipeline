-- =====================================================================
-- POSTGRESQL DATABASE SCHEMA MIGRATION BLUEPRINT
-- Target: consolidated_lead_profiles table for B2B high-throughput records
-- Optimizations: B-Tree Indexes on query/filter fields
-- =====================================================================

-- Drop table if exists during migrations
DROP TABLE IF EXISTS consolidated_lead_profiles CASCADE;

-- Create main lead profile table
CREATE TABLE consolidated_lead_profiles (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    employee_count INTEGER NOT NULL,
    industry VARCHAR(150) NOT NULL,
    total_funding_usd NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    geographic_headquarters VARCHAR(255),
    technologies JSONB NOT NULL DEFAULT '[]'::jsonb, -- Active technology stack array
    
    -- AI Qualification properties
    is_qualified BOOLEAN NOT NULL,
    alignment_score INTEGER NOT NULL CHECK (alignment_score BETWEEN 1 AND 10),
    justification TEXT NOT NULL,
    recommended_outbound_angle TEXT,
    
    -- Raw enrichment payload audit dump (for safety and downstream custom attributes)
    raw_enriched_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- System Audit fields
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- PERFORMANCE OPTIMIZING INDEXES FOR HIGH-THROUGHPUT PIPELINE QUERYING
-- =====================================================================

-- Index for unique lookups by domain (prevent duplicate enrichment passes)
CREATE UNIQUE INDEX idx_leads_domain ON consolidated_lead_profiles (domain);

-- Index for sales campaigns targeting qualified leads
CREATE INDEX idx_leads_is_qualified ON consolidated_lead_profiles (is_qualified);

-- Index for segmenting outbound campaigns by company industry classifications
CREATE INDEX idx_leads_industry ON consolidated_lead_profiles (industry);

-- Composite index for scoring lists by qualified alignment score descending
CREATE INDEX idx_leads_qualification_scoring ON consolidated_lead_profiles (is_qualified, alignment_score DESC);

-- GIN (Generalized Inverted Index) on Technologies JSONB column for super-fast technology querying
-- This lets you run queries like: WHERE technologies ? 'React'
CREATE INDEX idx_leads_technologies_gin ON consolidated_lead_profiles USING gin (technologies);

-- =====================================================================
-- TIMESTAMPS AUTOMATIC UPDATE TRIGGER
-- =====================================================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_profiles_modtime
    BEFORE UPDATE ON consolidated_lead_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
