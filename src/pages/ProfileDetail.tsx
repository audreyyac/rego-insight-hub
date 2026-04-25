import { useParams, Link, useSearchParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  FileText,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Clock,
  Loader2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SeverityBadge from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  supabase,
  PROFILE_DOCUMENTS_BUCKET,
  N8N_WEBHOOK_URL,
} from "@/lib/supabaseClient";

type Doc = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded: string;
  status: "Indexed" | "Processing";
};

type ReportVersion = {
  id: string;
  version: string;
  generated: string;
  docCount: number;
  summary: { advantages: number; watch: number; risks: number };
  note?: string;
};

type Tab = "documents" | "reports";

const initialDocs: Doc[] = [
  { id: "d1", name: "Device Description v3.2.pdf", type: "Technical file", size: "2.4 MB", uploaded: "Mar 18, 2026", status: "Indexed" },
  { id: "d2", name: "Risk Management Report.pdf", type: "ISO 14971", size: "1.1 MB", uploaded: "Mar 15, 2026", status: "Indexed" },
  { id: "d3", name: "Clinical Evaluation Plan.docx", type: "Clinical", size: "780 KB", uploaded: "Mar 14, 2026", status: "Indexed" },
  { id: "d4", name: "Software Lifecycle 62304.pdf", type: "Software", size: "3.0 MB", uploaded: "Mar 12, 2026", status: "Indexed" },
];

const analysis = [
  {
    title: "FDA 510(k) pathway viable based on predicate",
    severity: "advantage" as const,
    body: "Based on the device description and indications for use, a 510(k) submission referencing predicate K203412 is appropriate. Substantial equivalence is supportable on technological characteristics.",
    citations: ["21 CFR 807.92", "FDA Guidance: 510(k) Program (2014)"],
  },
  {
    title: "Cybersecurity documentation does not yet meet 2025 final guidance",
    severity: "risk" as const,
    body: "The current technical file references the 2018 premarket cybersecurity guidance. The September 2025 final guidance requires an updated SBOM format and documented threat modeling per the Secure Product Development Framework.",
    citations: ["FDA Cybersecurity Premarket Guidance (Sept 2025)", "AAMI TIR57"],
  },
  {
    title: "EU MDR Annex II §6.1 — clinical evaluation evidence",
    severity: "watch" as const,
    body: "Current clinical evaluation plan adequately scopes literature review, but post-market clinical follow-up plan is required for Class IIb devices and is not yet in the dossier.",
    citations: ["MDR 2017/745 Annex XIV Part B", "MDCG 2020-7"],
  },
  {
    title: "ISO 14971:2019 risk management — aligned",
    severity: "advantage" as const,
    body: "Risk management report follows ISO 14971:2019 structure including benefit-risk analysis, residual risk evaluation, and production/post-production information loop.",
    citations: ["ISO 14971:2019", "ISO/TR 24971:2020"],
  },
];

const initialReports: ReportVersion[] = [
  {
    id: "rep-3",
    version: "v3",
    generated: "Mar 18, 2026 · 14:22",
    docCount: 4,
    summary: { advantages: 2, watch: 1, risks: 1 },
    note: "Latest — incorporates updated risk management report.",
  },
  {
    id: "rep-2",
    version: "v2",
    generated: "Mar 12, 2026 · 09:48",
    docCount: 3,
    summary: { advantages: 2, watch: 2, risks: 1 },
  },
  {
    id: "rep-1",
    version: "v1",
    generated: "Feb 28, 2026 · 16:05",
    docCount: 2,
    summary: { advantages: 1, watch: 2, risks: 2 },
    note: "Initial baseline.",
  },
];

const ProfileDetail = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<{ id: string; product_name: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("client_profiles")
        .select("id, product_name")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) toast.error(`Couldn't load device: ${error.message}`);
      setProfile(data as any);
      setProfileLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const rawTab = searchParams.get("tab");
  const initialTab: Tab =
    rawTab === "reports" || rawTab === "analysis" ? "reports" : "documents";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [reports, setReports] = useState<ReportVersion[]>(initialReports);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!profile) {
      toast.error("Device not loaded yet");
      return;
    }
    setUploading(true);
    const fileArr = Array.from(files);
    const file_urls: string[] = [];
    const file_names: string[] = [];
    try {
      for (const f of fileArr) {
        const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${profile.id}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from(PROFILE_DOCUMENTS_BUCKET)
          .upload(path, f, { upsert: false, contentType: f.type || undefined });
        if (upErr) throw new Error(`Upload failed for ${f.name}: ${upErr.message}`);
        const { data: pub } = supabase.storage
          .from(PROFILE_DOCUMENTS_BUCKET)
          .getPublicUrl(path);
        file_urls.push(pub.publicUrl);
        file_names.push(f.name);
      }

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: "",
          device_name: profile.product_name,
          product_code: "",
          cfr_number: "",
          description: "",
          file_urls,
          file_names,
        }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

      const next: Doc[] = fileArr.map((f, i) => ({
        id: `new-${Date.now()}-${i}`,
        name: f.name,
        type: "Uploaded",
        size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
        uploaded: "Just now",
        status: "Indexed",
      }));
      setDocs((d) => [...next, ...d]);
      toast.success(`${next.length} document${next.length > 1 ? "s" : ""} uploaded`);
      setSearchParams({ tab: "documents" }, { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong during upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      const nextNum = reports.length + 1;
      const now = new Date();
      const stamp = now.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const newReport: ReportVersion = {
        id: `rep-${Date.now()}`,
        version: `v${nextNum}`,
        generated: stamp,
        docCount: docs.length,
        summary: { advantages: 2, watch: 1, risks: 1 },
        note: "New version generated from current device documents.",
      };
      setReports((r) => [newReport, ...r]);
      setGenerating(false);
      toast.success(`Report ${newReport.version} generated`);
    }, 1200);
  };

  // Auto-trigger generation if coming from an alert link
  useEffect(() => {
    if (searchParams.get("generate") === "1") {
      setTab("reports");
      generateReport();
      searchParams.delete("generate");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="py-10 text-center text-[13px] text-muted-foreground">
        Device not found.{" "}
        <Link to="/profiles" className="text-primary underline">
          Back to devices
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        to="/profiles"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-3 w-3" /> All devices
      </Link>

      <PageHeader
        title={profile.product_name}
        description="Device documents and regulatory reports"
        actions={
          <Button variant="outline" className="h-8 rounded-lg text-[13px]">
            Edit device
          </Button>
        }
      />

      <div className="mb-6 flex gap-2 p-1 rounded-lg bg-secondary w-fit">
        {[
          { k: "documents", label: "Documents" },
          { k: "reports", label: "Reports & insights" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => switchTab(t.k as Tab)}
            className={cn(
              "px-4 py-1.5 text-[13px] rounded-md transition-colors",
              tab === t.k
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "documents" && (
        <>
          <div
            className={cn(
              "surface-card border-dashed p-8 text-center mb-4 transition-colors",
              uploading
                ? "opacity-70 cursor-wait"
                : "cursor-pointer hover:bg-secondary/30"
            )}
            style={{ borderStyle: "dashed", borderWidth: "1px" }}
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (uploading) return;
              onUpload(e.dataTransfer.files);
            }}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 text-muted-foreground mx-auto mb-2 animate-spin" />
                <p className="text-[13px] text-foreground">Uploading and analyzing…</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Please keep this page open.
                </p>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-[13px] text-foreground">Drop files or click to upload</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  PDF, DOCX up to 25 MB. New documents update the device profile and unlock a fresh report.
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              multiple
              disabled={uploading}
              className="hidden"
              onChange={(e) => onUpload(e.target.files)}
            />
          </div>

          <div className="surface-card">
            <div className="grid grid-cols-12 px-5 py-2.5 border-b hairline text-[11px] uppercase tracking-wider text-muted-foreground">
              <div className="col-span-6">Document</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-2">Uploaded</div>
              <div className="col-span-1 text-right">Status</div>
            </div>
            <ul>
              {docs.map((d, i) => (
                <li
                  key={d.id}
                  className={cn(
                    "grid grid-cols-12 px-5 py-3.5 items-center",
                    i !== 0 && "border-t hairline"
                  )}
                >
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-[13px] text-foreground truncate">{d.name}</span>
                  </div>
                  <div className="col-span-2 text-[12px] text-muted-foreground">{d.type}</div>
                  <div className="col-span-1 text-[12px] text-muted-foreground">{d.size}</div>
                  <div className="col-span-2 text-[12px] text-muted-foreground">{d.uploaded}</div>
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    {d.status === "Indexed" ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-success">
                        <CheckCircle2 className="h-3 w-3" /> Indexed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[12px] text-warning">
                        <AlertCircle className="h-3 w-3" /> Processing
                      </span>
                    )}
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {tab === "reports" && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[14px] text-foreground">Reports & insights for {profile.product_name}</h3>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Each report is a snapshot built from the device's documents at the time of
                  generation. Key insights below reflect the latest version.
                </p>
              </div>
              <Button
                onClick={generateReport}
                disabled={generating}
                className="h-8 rounded-lg text-[13px] gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {generating ? "Generating…" : "Generate new report"}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5">
              <SummaryStat
                label="Advantages"
                count={reports[0]?.summary.advantages ?? 0}
                tone="text-success"
              />
              <SummaryStat
                label="Watch items"
                count={reports[0]?.summary.watch ?? 0}
                tone="text-warning"
              />
              <SummaryStat
                label="Risks"
                count={reports[0]?.summary.risks ?? 0}
                tone="text-destructive"
              />
            </div>
          </div>

          <div className="surface-card">
            <div className="px-5 py-3 border-b hairline flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Key insights · tied to {reports[0]?.version ?? "latest"} ({reports[0]?.generated})
              </div>
              <span className="text-[11px] text-muted-foreground">
                What you should know about this report
              </span>
            </div>
            <ul>
              {analysis.map((a, i) => (
                <li
                  key={a.title}
                  className={cn("px-5 py-4", i !== 0 && "border-t hairline")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-[13px] text-foreground leading-snug">{a.title}</h4>
                    <SeverityBadge severity={a.severity} />
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                    {a.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.citations.map((c) => (
                      <span
                        key={c}
                        className="text-[11px] text-muted-foreground bg-secondary rounded-md px-2 py-0.5"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card">
            <div className="px-5 py-3 border-b hairline flex items-center gap-2 text-[12px] text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Report history · {reports.length} version{reports.length !== 1 ? "s" : ""}
            </div>
            <ul>
              {reports.map((r, i) => (
                <li
                  key={r.id}
                  className={cn(
                    "px-5 py-4 flex items-start gap-4",
                    i !== 0 && "border-t hairline"
                  )}
                >
                  <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] text-foreground">
                        {profile.product_name} regulatory report
                      </p>
                      <span className="text-[11px] text-muted-foreground bg-secondary rounded-md px-1.5 py-0.5">
                        {r.version}
                      </span>
                      {i === 0 && (
                        <span className="text-[11px] text-primary bg-primary/10 rounded-md px-1.5 py-0.5">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {r.generated} · {r.docCount} documents ·{" "}
                      <span className="text-success">{r.summary.advantages} adv</span> ·{" "}
                      <span className="text-warning">{r.summary.watch} watch</span> ·{" "}
                      <span className="text-destructive">{r.summary.risks} risk</span>
                    </p>
                    {r.note && (
                      <p className="text-[12px] text-muted-foreground mt-1 italic">{r.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" className="h-8 rounded-lg text-[12px]">
                      View
                    </Button>
                    <Button variant="outline" className="h-8 rounded-lg text-[12px] gap-1.5">
                      <Download className="h-3 w-3" /> PDF
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

const SummaryStat = ({ label, count, tone }: { label: string; count: number; tone: string }) => (
  <div className="hairline border rounded-lg p-3">
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className={cn("text-[22px] font-medium mt-1", tone)}>{count}</div>
  </div>
);

export default ProfileDetail;
