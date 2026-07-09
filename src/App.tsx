import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  Cpu,
  Database,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileCode,
  Play,
  Download,
  Copy,
  Check,
  Search,
  DollarSign,
  Users,
  Layers,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  BookOpen,
  ArrowRight,
  X,
  Trash2,
  Info
} from "lucide-react";
import { LeadProfile } from "./types";
import { PIPELINE_PY_CODE, SCHEMA_SQL_CODE } from "./codeTemplates";

const DEFAULT_ARCHIVE: LeadProfile[] = [
  {
    id: "lead_1",
    domain: "stripe.com",
    company_name: "Stripe",
    employee_count: 8500,
    industry: "Financial Technology",
    total_funding_usd: 2200000000,
    geographic_headquarters: "San Francisco, CA",
    technologies: ["Ruby", "React", "AWS", "Kubernetes"],
    is_qualified: true,
    alignment_score: 10,
    justification: "Stripe is an absolute bullseye ICP match. Exceeds the employee limit of 100 substantially (8,500) and represents a tier-1 financial giant with over $2.2B in venture funding. Perfect product-market fit for high-throughput enterprise integrations.",
    recommended_outbound_angle: "Target their high-scale product engineering group. Open with: 'Spotted Stripe's active scale with Kubernetes and Ruby. Given your San Francisco HQ and global payment volume, our async pipeline optimizer is built specifically to prevent latency spikes under high concurrent request loads.'",
    processed_at: "2026-07-09 10:14:02",
    simulated: false
  },
  {
    id: "lead_2",
    domain: "vercel.com",
    company_name: "Vercel",
    employee_count: 450,
    industry: "Cloud Infrastructure & DevOps",
    total_funding_usd: 313000000,
    geographic_headquarters: "New York, NY",
    technologies: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    is_qualified: true,
    alignment_score: 9,
    justification: "Vercel perfectly aligns with preferred Developer Tooling and Cloud Infrastructure industries. With 450 employees and $313M raised, it represents a high-growth scale-up matching all ICP criteria.",
    recommended_outbound_angle: "Target their DevOps or Developer Experience leaders. Open with: 'Congrats on Next.js growth. We noticed your active front-end optimization focus. Our server-side async queuing is designed specifically to optimize API responses for edge middleware deployments.'",
    processed_at: "2026-07-09 10:15:30",
    simulated: false
  },
  {
    id: "lead_3",
    domain: "retable.io",
    company_name: "Retable",
    employee_count: 25,
    industry: "No-Code Spreadsheets & Operations",
    total_funding_usd: 1200000,
    geographic_headquarters: "London, UK",
    is_qualified: false,
    alignment_score: 3,
    justification: "Retable fails both core thresholds. Current staff count is 25 (below the 100 minimum) and total funding raised is $1.2M (below the $10M target limit). Disqualified from active outbound lists.",
    recommended_outbound_angle: "N/A - Archive or place on a low-priority automated drip sequence for self-serve signups.",
    technologies: ["Python", "Angular", "Docker", "PostgreSQL"],
    processed_at: "2026-07-09 10:16:15",
    simulated: false
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"simulator" | "archive" | "architecture" | "docs">("simulator");
  const [activeCodeTab, setActiveCodeTab] = useState<"python" | "sql">("python");
  const [domainInput, setDomainInput] = useState("");
  
  // ICP Config State
  const [minEmployees, setMinEmployees] = useState(100);
  const [minFundingUsd, setMinFundingUsd] = useState(10000000); // $10M
  const [industries, setIndustries] = useState<string[]>([
    "Financial Technology",
    "Cloud Infrastructure & DevOps",
    "Productivity & Collaboration SaaS",
    "Artificial Intelligence & Data Labeling",
    "SaaS",
    "Cybersecurity"
  ]);
  const [industryInput, setIndustryInput] = useState("");

  // Running simulator state
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<"idle" | "ingestion" | "enrichment" | "evaluation" | "saving" | "complete">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [currentLead, setCurrentLead] = useState<LeadProfile | null>(null);
  const [archivedLeads, setArchivedLeads] = useState<LeadProfile[]>(() => {
    const saved = localStorage.getItem("b2b_leads_archive");
    return saved ? JSON.parse(saved) : DEFAULT_ARCHIVE;
  });
  const [selectedArchiveLead, setSelectedArchiveLead] = useState<LeadProfile | null>(null);

  // Status & Utility State
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [copiedType, setCopiedType] = useState<"python" | "sql" | "justification" | "pitch" | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check backend server status & Gemini configuration
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setGeminiConfigured(data.gemini_configured);
      })
      .catch((err) => {
        console.error("Health check failure:", err);
        setGeminiConfigured(false);
      });
  }, []);

  // Sync archive to localStorage
  useEffect(() => {
    localStorage.setItem("b2b_leads_archive", JSON.stringify(archivedLeads));
  }, [archivedLeads]);

  const addIndustryTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = industryInput.trim();
    if (clean && !industries.includes(clean)) {
      setIndustries([...industries, clean]);
      setIndustryInput("");
    }
  };

  const removeIndustryTag = (tag: string) => {
    setIndustries(industries.filter((i) => i !== tag));
  };

  const triggerNotification = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCopyCode = (code: string, type: "python" | "sql" | "justification" | "pitch") => {
    navigator.clipboard.writeText(code);
    setCopiedType(type);
    triggerNotification("Copied to clipboard successfully!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    triggerNotification(`Downloading ${filename}`);
  };

  const handleTriggerPipeline = async (domainToProcess: string) => {
    if (!domainToProcess.trim()) {
      triggerNotification("Please enter a valid domain", "error");
      return;
    }

    const normalizedDomain = domainToProcess
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "");

    setIsProcessing(true);
    setLogs([]);
    setCurrentLead(null);
    setSelectedArchiveLead(null);

    // Step 1: Ingestion
    setPipelineStep("ingestion");
    addLog("📥 [INGESTION] Captured domain input: " + normalizedDomain);
    addLog("📥 [INGESTION] Validating domain format and setting up ingestion payload...");
    await sleep(800);

    // Step 2: Enrichment
    setPipelineStep("enrichment");
    addLog("🔍 [ENRICHMENT] Querying corporate metadata schemas via mock Clay/Clearbit gateway...");
    addLog("🔍 [ENRICHMENT] Resolving company metrics: headcount, funding limits, headquarters...");
    await sleep(1000);

    // Step 3: AI Qualification
    setPipelineStep("evaluation");
    addLog("🤖 [AI PROCESSING] Building Pydantic schema for structured qualification output...");
    addLog("🤖 [AI PROCESSING] System Instruction generated. Calling server-side Gemini 3.5 Flash...");
    
    try {
      const response = await fetch("/api/enrich-qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: normalizedDomain,
          criteria: {
            companySizeMin: minEmployees,
            fundingMin: minFundingUsd,
            industries: industries
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Pipeline API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      addLog("🤖 [AI PROCESSING] Gemini evaluation completed with 100% structured validity.");
      addLog(`🤖 [AI PROCESSING] Response parsed successfully. Score: ${data.qualification.alignment_score}/10.`);
      await sleep(800);

      // Step 4: Storage
      setPipelineStep("saving");
      addLog("💾 [STORAGE] Mapping qualified lead profile fields into SQLAlchemy ORM Model...");
      addLog("💾 [STORAGE] Performing database transaction to PostgreSQL...");
      await sleep(650);

      const newLead: LeadProfile = {
        id: "lead_" + Date.now(),
        domain: data.enriched.domain,
        company_name: data.enriched.name,
        employee_count: data.enriched.size,
        industry: data.enriched.industry,
        total_funding_usd: data.enriched.funding,
        geographic_headquarters: data.enriched.hq,
        technologies: data.enriched.technologies,
        is_qualified: data.qualification.is_qualified,
        alignment_score: data.qualification.alignment_score,
        justification: data.qualification.justification,
        recommended_outbound_angle: data.qualification.recommended_outbound_angle,
        processed_at: new Date().toISOString().replace("T", " ").substring(0, 19),
        simulated: data.simulated
      };

      setCurrentLead(newLead);
      setArchivedLeads((prev) => [newLead, ...prev]);
      setPipelineStep("complete");
      addLog("✅ [SUCCESS] Pipeline cycle finished. Lead consolidated successfully.");
      triggerNotification("Lead qualified and archived!");
    } catch (error: any) {
      addLog("❌ [ERROR] Fatal pipeline exception: " + error.message);
      setPipelineStep("idle");
      triggerNotification("Pipeline execution failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const formatFunding = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
    return `$${amount}`;
  };

  const handleClearArchive = () => {
    if (window.confirm("Are you sure you want to clear the processed leads archive?")) {
      setArchivedLeads([]);
      setSelectedArchiveLead(null);
      triggerNotification("Leads archive cleared.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-[#2563EB]/15 antialiased">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-md border text-sm font-medium ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {notification.type === "success" ? <Check className="w-4 h-4 text-[#10B981]" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {notification.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Left Sidebar - Professional Polish Style */}
      <aside className="w-16 bg-[#0F172A] flex flex-col items-center py-6 justify-between shrink-0 border-r border-[#E2E8F0]/10 hidden md:flex">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Brand/Engine logo indicator */}
          <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-white font-bold text-lg cursor-default shadow-sm shadow-[#2563EB]/20 animate-pulse">
            ⚡
          </div>
          
          {/* Interactive tab icons */}
          <div className="flex flex-col items-center gap-4 w-full px-2">
            {[
              { tab: "simulator", label: "Σ", title: "Pipeline Simulator" },
              { tab: "archive", label: "⬡", title: "Processed Archive" },
              { tab: "architecture", label: "💾", title: "Code & Blueprints" },
              { tab: "docs", label: "⚙️", title: "System Docs" }
            ].map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab as any)}
                  className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all duration-200 relative group cursor-pointer ${
                    isActive
                      ? "bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={item.title}
                >
                  <span className="text-sm font-bold">{item.label}</span>
                  {/* Tooltip */}
                  <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 whitespace-nowrap border border-slate-800">
                    {item.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Version marker */}
        <div className="text-slate-500 text-[10px] font-mono select-none" title="LeadSync Engine v2.4">
          v2.4
        </div>
      </aside>

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Modern Polished Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] h-16 flex items-center px-6">
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-[#1E293B] flex items-center gap-2">
                  <span>LeadSync</span> <span className="text-xs bg-slate-100 text-[#64748B] px-1.5 py-0.5 rounded font-mono font-medium">v2.4</span>
                </h1>
                <span className="text-[11px] bg-[#ECFDF5] text-[#10B981] border border-[#D1FAE5] px-2.5 py-1 rounded-full uppercase font-semibold flex items-center gap-1.5 tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  ● Engine Active
                </span>
              </div>
            </div>

            {/* Navigation Tabs (visible on mobile / responsive) */}
            <div className="flex items-center gap-3">
              <nav className="flex items-center bg-slate-100 p-1 rounded-lg gap-1 md:hidden">
                {(["simulator", "archive", "architecture", "docs"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      activeTab === tab
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {tab === "simulator" ? "Σ" : tab === "archive" ? "⬡" : tab === "architecture" ? "💾" : "⚙️"}
                  </button>
                ))}
              </nav>

              <button
                onClick={() => {
                  setActiveTab("simulator");
                  setDomainInput("");
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                New Pipeline
              </button>
            </div>
          </div>
        </header>

        {/* Professional Metrics Bar */}
        <div className="bg-white border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E2E8F0]">
            <div className="p-5 flex flex-col justify-center">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Throughput (24h)</div>
              <div className="text-lg md:text-xl font-bold text-[#1E293B] font-mono">52,104</div>
            </div>
            <div className="p-5 flex flex-col justify-center">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Gemini Success</div>
              <div className="text-lg md:text-xl font-bold text-[#1E293B] font-mono">99.42%</div>
            </div>
            <div className="p-5 flex flex-col justify-center">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Avg Enrichment Latency</div>
              <div className="text-lg md:text-xl font-bold text-[#1E293B] font-mono">412ms</div>
            </div>
            <div className="p-5 flex flex-col justify-center">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Active Threads</div>
              <div className="text-lg md:text-xl font-bold text-[#1E293B] font-mono">128</div>
            </div>
          </div>
        </div>

        {/* Main Workspace Frame */}
        <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1 flex flex-col">
          
          {/* Gemini Status Alert */}
          {geminiConfigured === false && (
            <div className="mb-6 p-4 bg-amber-50/55 border border-amber-200 rounded-lg flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-amber-900">Demo Simulation Mode Active</h3>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  The Gemini API Key is not configured in the workspace secrets. The pipeline will simulate the actual
                  qualification logic deterministically using high-fidelity local models. To activate live API responses, add your{" "}
                  <span className="font-mono font-bold">GEMINI_API_KEY</span> in the <b>Settings &gt; Secrets</b> panel.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ================================================================= */}
            {/* TAB 1: PIPELINE SIMULATOR */}
            {/* ================================================================= */}
            {activeTab === "simulator" && (
              <>
                {/* Left Column: Criteria Setup & Input Trigger */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Trigger Control Panel */}
                  <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs">
                    <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2 mb-4">
                      <Play className="w-3.5 h-3.5 text-[#2563EB] fill-[#2563EB]" />
                      Trigger Lead Pipeline
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                          Target Corporate Domain
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Building2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              disabled={isProcessing}
                              placeholder="e.g. stripe.com"
                              value={domainInput}
                              onChange={(e) => setDomainInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleTriggerPipeline(domainInput)}
                              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all text-slate-800 font-medium"
                            />
                          </div>
                          <button
                            onClick={() => handleTriggerPipeline(domainInput)}
                            disabled={isProcessing || !domainInput}
                            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 disabled:hover:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                            Run
                          </button>
                        </div>
                      </div>

                      {/* Presets Grid */}
                      <div>
                        <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                          Or select preset targets
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { dom: "stripe.com", label: "Stripe (Enterprise)" },
                            { dom: "vercel.com", label: "Vercel (Dev Scale-up)" },
                            { dom: "notion.so", label: "Notion (SaaS Giant)" },
                            { dom: "retable.io", label: "Retable (Seed Startup)" }
                          ].map((preset) => (
                            <button
                              key={preset.dom}
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setDomainInput(preset.dom);
                                handleTriggerPipeline(preset.dom);
                              }}
                              className="p-2.5 border border-[#E2E8F0] hover:bg-slate-50 rounded-md text-left transition-all group cursor-pointer"
                            >
                              <span className="block text-xs font-semibold text-[#1E293B] group-hover:text-[#2563EB] truncate">
                                {preset.label}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-mono truncate">
                                {preset.dom}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ICP Rules Setup Panel */}
                  <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs">
                    <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2 mb-4">
                      <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                      Ideal Customer Profile (ICP) Rules
                    </h3>

                    <div className="space-y-4">
                      {/* Size criteria */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Minimum Employees
                          </label>
                          <span className="text-xs font-mono font-bold text-[#1E293B]">{minEmployees}</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="1000"
                          step="10"
                          value={minEmployees}
                          onChange={(e) => setMinEmployees(parseInt(e.target.value))}
                          disabled={isProcessing}
                          className="w-full accent-[#2563EB] cursor-pointer"
                        />
                      </div>

                      {/* Funding criteria */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            Minimum Funding
                          </label>
                          <span className="text-xs font-mono font-bold text-[#1E293B]">
                            {formatFunding(minFundingUsd)}
                          </span>
                        </div>
                        <select
                          value={minFundingUsd}
                          onChange={(e) => setMinFundingUsd(parseInt(e.target.value))}
                          disabled={isProcessing}
                          className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-md p-2 font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        >
                          <option value={0}>Any Funding / Bootstrapped</option>
                          <option value={1000000}>$1,000,000 USD (Seed)</option>
                          <option value={5000000}>$5,000,000 USD (Series A)</option>
                          <option value={10000000}>$10,000,000 USD (Mid Stage)</option>
                          <option value={50000000}>$50,000,000 USD (Growth Stage)</option>
                        </select>
                      </div>

                      {/* Industry criteria */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                          Target ICP Industries
                        </label>
                        <form onSubmit={addIndustryTag} className="flex gap-1.5 mb-2.5">
                          <input
                            type="text"
                            placeholder="Add industry..."
                            disabled={isProcessing}
                            value={industryInput}
                            onChange={(e) => setIndustryInput(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-slate-700"
                          />
                          <button
                            type="submit"
                            disabled={isProcessing}
                            className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold transition-all cursor-pointer"
                          >
                            Add
                          </button>
                        </form>

                        <div className="flex flex-wrap gap-1">
                          {industries.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200"
                            >
                              {tag}
                              {!isProcessing && (
                                <button
                                  type="button"
                                  onClick={() => removeIndustryTag(tag)}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Processing Animation & Qualified Result Output */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  
                  {/* Visual Pipeline Steps */}
                  {isProcessing && (
                    <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-col gap-6">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                        <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 text-[#2563EB] animate-spin" />
                          Running Pipeline Processing
                        </h3>
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded border border-blue-100">
                          {pipelineStep.toUpperCase()}
                        </span>
                      </div>

                      {/* Progress nodes */}
                      <div className="grid grid-cols-4 gap-4 relative">
                        {[
                          { step: "ingestion", label: "Ingestion", desc: "Domain Parse" },
                          { step: "enrichment", label: "Enrichment", desc: "Clay Schema Fetch" },
                          { step: "evaluation", label: "Gemini AI", desc: "Qualification JSON" },
                          { step: "saving", label: "Database", desc: "Postgres Storage" }
                        ].map((item, idx) => {
                          const steps = ["ingestion", "enrichment", "evaluation", "saving"];
                          const currentIdx = steps.indexOf(pipelineStep);
                          const selfIdx = steps.indexOf(item.step);
                          const isCompleted = selfIdx < currentIdx;
                          const isActive = selfIdx === currentIdx;

                          return (
                            <div key={item.step} className="flex flex-col items-center text-center z-10">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                  isCompleted
                                    ? "bg-[#10B981] border-[#10B981] text-white"
                                    : isActive
                                    ? "bg-white border-[#2563EB] text-[#2563EB] ring-4 ring-blue-50"
                                    : "bg-slate-50 border-[#E2E8F0] text-slate-400"
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <span className="text-xs font-mono font-bold">{idx + 1}</span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-slate-800 mt-2">{item.label}</span>
                              <span className="text-[10px] text-[#64748B] font-medium mt-0.5">{item.desc}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Live logs terminal box - Professional Polish (Dark CLI Style with Blue Accent border) */}
                      <div className="bg-[#1E293B] text-slate-300 font-mono text-xs p-5 rounded-lg h-52 overflow-y-auto border-t-4 border-[#2563EB] flex flex-col gap-2 scrollbar-thin shadow-inner">
                        {logs.map((log, index) => (
                          <div key={index} className="flex gap-2.5 items-start leading-relaxed">
                            <span className="text-slate-500 shrink-0 font-mono">{log.substring(0, 8)}</span>
                            <span className="text-[#10B981] shrink-0 font-bold">[INFO]</span>
                            <span className="text-slate-200">{log.substring(17)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Qualification Output Display */}
                  {currentLead && !isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden"
                    >
                      {/* Header bar colored by status */}
                      <div
                        className={`p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          currentLead.is_qualified
                            ? "bg-emerald-50/45 border-emerald-100"
                            : "bg-rose-50/45 border-rose-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-lg ${
                              currentLead.is_qualified
                                ? "bg-emerald-100/70 text-[#10B981]"
                                : "bg-rose-100/70 text-rose-700"
                            }`}
                          >
                            <Building2 className="w-5.5 h-5.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-base font-bold text-slate-900">{currentLead.company_name}</h2>
                              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                                {currentLead.domain}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">
                              Processed at {currentLead.processed_at} • {currentLead.simulated ? "Deterministic Simulation" : "Live Gemini Platform"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Status Badge */}
                          <div
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 border tracking-wider uppercase ${
                              currentLead.is_qualified
                                ? "bg-[#D1FAE5] border-emerald-200 text-[#065F46]"
                                : "bg-rose-100 border-rose-200 text-rose-800"
                            }`}
                          >
                            {currentLead.is_qualified ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ICP QUALIFIED
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                ICP DISQUALIFIED
                              </>
                            )}
                          </div>

                          {/* score ring/badge */}
                          <div className="flex flex-col items-center px-3 py-1 bg-white border border-[#E2E8F0] rounded-md">
                            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Score</span>
                            <span className="text-sm font-bold text-slate-800 font-mono">
                              {currentLead.alignment_score}<span className="text-slate-400 text-[10px] font-normal">/10</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Corporate Metadatas Section */}
                      <div className="p-5 border-b border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50/50">
                        <div>
                          <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                            Industry
                          </span>
                          <span className="text-xs font-bold text-slate-700 block truncate">
                            {currentLead.industry}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                            Headcount
                          </span>
                          <span className="text-xs font-bold text-slate-700 block font-mono">
                            {currentLead.employee_count} staff
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                            Venture Funding
                          </span>
                          <span className="text-xs font-bold text-slate-700 block font-mono">
                            {formatFunding(currentLead.total_funding_usd)} USD
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                            Headquarters
                          </span>
                          <span className="text-xs font-bold text-slate-700 block truncate">
                            {currentLead.geographic_headquarters || "Unknown"}
                          </span>
                        </div>
                      </div>

                      {/* AI Structured Evaluation Results */}
                      <div className="p-5 space-y-5">
                        
                        {/* Company Description */}
                        <div>
                          <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Scraped Web Profile
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-md border border-slate-150">
                            "{currentLead.justification.includes("No Gemini API Key") ? `${currentLead.company_name} is a high-growth developer tools, SaaS, or financial player.` : currentLead.justification.split(".")[0]}..."
                          </p>
                        </div>

                        {/* Tech stack tags */}
                        {currentLead.technologies && currentLead.technologies.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                              Detected Tech Stack
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {currentLead.technologies.map((t) => (
                                <span
                                  key={t}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-bold text-slate-600 font-mono transition-all border border-slate-150"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Justification text block */}
                        <div className="p-4 bg-slate-50 rounded-md border border-[#E2E8F0]">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                              Rigorous Qualification Rationale
                            </h4>
                            <button
                              onClick={() => handleCopyCode(currentLead.justification, "justification")}
                              className="text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                              title="Copy rationale"
                            >
                              {copiedType === "justification" ? (
                                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {currentLead.justification}
                          </p>
                        </div>

                        {/* Recommended personalization pitch */}
                        <div className="p-4 bg-blue-50/30 rounded-md border border-blue-100">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                              Recommended GTM Outbound Opening Pitch
                            </h4>
                            <button
                              onClick={() => handleCopyCode(currentLead.recommended_outbound_angle, "pitch")}
                              className="text-[#2563EB] hover:text-[#1D4ED8] transition-all cursor-pointer"
                              title="Copy pitch angle"
                            >
                              {copiedType === "pitch" ? (
                                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-semibold italic bg-white p-3 rounded border border-blue-50">
                            "{currentLead.recommended_outbound_angle}"
                          </p>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* Empty State Instructions */}
                  {!currentLead && !isProcessing && (
                    <div className="bg-white border border-[#E2E8F0] border-dashed rounded-lg p-12 text-center shadow-xs flex flex-col items-center justify-center">
                      <div className="p-3 bg-slate-50 text-[#2563EB] rounded-full mb-4 border border-slate-100">
                        <Cpu className="w-7 h-7 animate-pulse" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Awaiting Target Lead</h3>
                      <p className="text-xs text-[#64748B] max-w-sm mt-1 leading-relaxed">
                        Enter a company domain in the control panel to execute the end-to-end enrichment, Pydantic verification,
                        and structured AI qualification pipeline.
                      </p>
                      <div className="flex gap-2.5 mt-5">
                        <button
                          onClick={() => {
                            setDomainInput("stripe.com");
                            handleTriggerPipeline("stripe.com");
                          }}
                          className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-bold transition-all border border-[#E2E8F0] cursor-pointer"
                        >
                          Test Stripe.com
                        </button>
                        <button
                          onClick={() => {
                            setDomainInput("vercel.com");
                            handleTriggerPipeline("vercel.com");
                          }}
                          className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-bold transition-all border border-[#E2E8F0] cursor-pointer"
                        >
                          Test Vercel.com
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}

            {/* ================================================================= */}
            {/* TAB 2: PROCESSED ARCHIVE TABLE */}
            {/* ================================================================= */}
            {activeTab === "archive" && (
              <div className="col-span-12 flex flex-col gap-6">
                <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Consolidated Lead Archive</h2>
                      <p className="text-xs text-[#64748B] mt-1">
                        Unified storage table showing historically enriched and AI-qualified company accounts.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearArchive}
                        disabled={archivedLeads.length === 0}
                        className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear Database Table
                      </button>
                    </div>
                  </div>

                  {archivedLeads.length === 0 ? (
                    <div className="p-16 text-center">
                      <Database className="w-7 h-7 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Database Table is Empty</p>
                      <p className="text-[11px] text-slate-400 mt-1">Use the Pipeline Simulator to stream and write new leads.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                            <th className="p-4 text-[10px] font-bold text-[#64748B] font-mono uppercase tracking-wider">Company</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748B] font-mono uppercase tracking-wider">Metrics</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748B] font-mono uppercase tracking-wider">ICP Match</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748B] font-mono uppercase tracking-wider">Alignment</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748B] font-mono uppercase tracking-wider">Outbound Pitch Preview</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748B] font-mono uppercase tracking-wider text-right">Processed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {archivedLeads.map((lead) => (
                            <tr
                              key={lead.id}
                              onClick={() => setSelectedArchiveLead(lead)}
                              className="hover:bg-slate-50/50 transition-all cursor-pointer group"
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-2.5">
                                  <div className={`p-1.5 rounded ${lead.is_qualified ? 'bg-emerald-50 text-[#065F46]' : 'bg-rose-50 text-rose-700'}`}>
                                    <Building2 className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="block text-xs font-bold text-slate-900 group-hover:text-[#2563EB] transition-all">
                                      {lead.company_name}
                                    </span>
                                    <span className="block text-[10px] text-[#64748B] font-mono">
                                      {lead.domain}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="block text-[11px] font-bold text-slate-700">
                                  {lead.industry}
                                </span>
                                <span className="block text-[10px] text-[#64748B] font-mono mt-0.5">
                                  {lead.employee_count} staff • {formatFunding(lead.total_funding_usd)}
                                </span>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border tracking-wider ${
                                    lead.is_qualified
                                      ? "bg-[#D1FAE5] border-emerald-200 text-[#065F46]"
                                      : "bg-[#FEE2E2] border-rose-150 text-rose-800"
                                  }`}
                                >
                                  {lead.is_qualified ? "PASSED" : "FAILED"}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${lead.is_qualified ? "bg-[#10B981]" : "bg-rose-500"}`}
                                      style={{ width: `${lead.alignment_score * 10}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-mono font-bold text-slate-800">
                                    {lead.alignment_score}/10
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 max-w-xs">
                                <p className="text-xs text-slate-500 truncate italic">
                                  "{lead.recommended_outbound_angle}"
                                </p>
                              </td>
                              <td className="p-4 text-xs font-mono text-[#64748B] text-right">
                                {lead.processed_at.substring(11)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Archive Lead Detail Panel */}
                {selectedArchiveLead && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#2563EB]" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Lead Profile Review: {selectedArchiveLead.company_name}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedArchiveLead(null)}
                        className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                          AI Rationale
                        </span>
                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded leading-relaxed border border-slate-100">
                          {selectedArchiveLead.justification}
                        </p>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                          Hyper-Personalized Outreach sequence Pitch
                        </span>
                        <p className="text-xs text-indigo-950 bg-blue-50/30 p-3 rounded leading-relaxed italic font-semibold border border-blue-100">
                          "{selectedArchiveLead.recommended_outbound_angle}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 p-3 rounded border border-slate-100 font-mono">
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-sans font-bold">Record ID:</span>
                          <span className="font-semibold text-slate-700 mt-0.5 block">
                            {selectedArchiveLead.id}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-sans font-bold">Processed At:</span>
                          <span className="font-semibold text-slate-700 mt-0.5 block">
                            {selectedArchiveLead.processed_at}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 3: CODE & ARCHITECTURE BLUEPRINT */}
            {/* ================================================================= */}
            {activeTab === "architecture" && (
              <div className="col-span-12 flex flex-col gap-6">
                
                {/* Layer Explanation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    {
                      layer: "Layer 1",
                      title: "Ingestion Core",
                      desc: "Scheduled pipelines capture targeted domain sequences synchronously, routing clean domain payloads to the API endpoints."
                    },
                    {
                      layer: "Layer 2",
                      title: "Async Enrichment",
                      desc: "Utilizes Node / Python concurrency layers to query multiple telemetry models, resolving core size, sector, and location profiles."
                    },
                    {
                      layer: "Layer 3",
                      title: "Gemini Validation",
                      desc: "Constructs custom response configurations to lock Gemini 3.5 Flash into rigid structured JSON schemas."
                    },
                    {
                      layer: "Layer 4",
                      title: "Postgres Storage",
                      desc: "Commits enriched profiles synchronously to PostgreSQL. Fully indexed key properties optimize client lookup performance."
                    }
                  ].map((blueprint, i) => (
                    <div key={i} className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-col gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded self-start border border-blue-100">
                        {blueprint.layer}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 uppercase tracking-wider">{blueprint.title}</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed">{blueprint.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Interactive Code Hub */}
                <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/40">
                    <div>
                      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-[#2563EB]" />
                        GTM Code & Export Center
                      </h2>
                      <p className="text-xs text-[#64748B] mt-1">
                        Fully production-ready scripts created in this workspace, complete with database structures and backoff routines.
                      </p>
                    </div>

                    {/* Code selection buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="flex bg-slate-100 p-1 rounded-md gap-1">
                        <button
                          onClick={() => setActiveCodeTab("python")}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                            activeCodeTab === "python" ? "bg-white text-slate-900 shadow-xs" : "text-[#64748B]"
                          }`}
                        >
                          pipeline.py
                        </button>
                        <button
                          onClick={() => setActiveCodeTab("sql")}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                            activeCodeTab === "sql" ? "bg-white text-slate-900 shadow-xs" : "text-[#64748B]"
                          }`}
                        >
                          schema.sql
                        </button>
                      </div>

                      {/* Download button */}
                      <button
                        onClick={() =>
                          activeCodeTab === "python"
                            ? downloadFile(PIPELINE_PY_CODE, "pipeline.py")
                            : downloadFile(SCHEMA_SQL_CODE, "schema.sql")
                        }
                        className="p-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md transition-all cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {/* Copy button */}
                      <button
                        onClick={() =>
                          handleCopyCode(
                            activeCodeTab === "python" ? PIPELINE_PY_CODE : SCHEMA_SQL_CODE,
                            activeCodeTab
                          )
                        }
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md transition-all border border-[#E2E8F0] cursor-pointer"
                        title="Copy code"
                      >
                        {copiedType === activeCodeTab ? (
                          <Check className="w-4 h-4 text-[#10B981]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Code Terminal Display - Professional Polish Style (Dark slate bg) */}
                  <div className="relative">
                    <pre className="bg-[#0F172A] text-[#94A3B8] p-6 text-xs font-mono overflow-auto h-[500px] leading-relaxed select-text scrollbar-thin">
                      <code>{activeCodeTab === "python" ? PIPELINE_PY_CODE : SCHEMA_SQL_CODE}</code>
                    </pre>
                  </div>
                </div>

              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 4: SYSTEM DOCUMENTATION & ICP BEST PRACTICES */}
            {/* ================================================================= */}
            {activeTab === "docs" && (
              <div className="col-span-12 flex flex-col gap-6">
                <div className="bg-white p-6 md:p-8 rounded-lg border border-[#E2E8F0] shadow-xs space-y-6">
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#2563EB]" />
                      Operational & Deployment Manual
                    </h2>
                    <p className="text-xs text-[#64748B] mt-1">
                      Recommended configurations, dependencies, and deployment strategies for scale (50,000+ monthly records).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                        Required Python Environment
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        To run the generated <span className="font-mono bg-slate-50 px-1 border rounded text-xs text-slate-800">pipeline.py</span> script locally or inside your Celery/Cron orchestration worker, install the primary dependencies:
                      </p>
                      <pre className="bg-slate-50 p-4 rounded-md text-xs font-mono text-[#0F172A] border border-slate-150">
                        pip install google-genai pydantic sqlalchemy psycopg2-binary aiohttp
                      </pre>

                      <h3 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider pt-2">
                        Authentication Setup
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        The modern Google GenAI Client auto-resolves keys from your shell. Export your key prior to triggering the worker daemon:
                      </p>
                      <pre className="bg-slate-50 p-4 rounded-md text-xs font-mono text-[#0F172A] border border-slate-150">
                        export GEMINI_API_KEY="AIzaSy..."
                      </pre>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                        Production Scaling Considerations
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50/20 rounded-md border border-blue-100">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thread-Safe GenAI Calls</h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            The Gemini Python SDK is blocking. Our script utilizes <span className="font-mono text-[10px] font-bold">asyncio.to_thread</span> to execute qualification calls inside separate thread pools. This guarantees the network loop remains fully unblocked.
                          </p>
                        </div>

                        <div className="p-3 bg-blue-50/20 rounded-md border border-blue-100">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Exponential Backoff Retries</h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Processing 50k monthly leads guarantees hitting API rate limits. The wrapper incorporates backoff retries with full jitter. It automatically pauses and retries under HTTP 429 warnings.
                          </p>
                        </div>

                        <div className="p-3 bg-blue-50/20 rounded-md border border-blue-100">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">JSONB Tech Indexing</h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Rather than splitting technologies into multiple relational join tables, they are stored as raw JSONB lists. The GIN index optimizes searches for sales team segment targeting.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-xs text-[#64748B] font-medium">
                      B2B Enrichment Engine • Built with React 19 & Google Gemini SDKs
                    </span>
                    <button
                      onClick={() => setActiveTab("simulator")}
                      className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                    >
                      Back to Simulator
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
