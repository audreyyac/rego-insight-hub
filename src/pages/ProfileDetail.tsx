import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  Trash2,
  Pencil,
  Sparkles,
  Download,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  supabase,
  PROFILE_DOCUMENTS_BUCKET,
  PROFILE_REPORTS_BUCKET,
  N8N_WEBHOOK_URL,
  N8N_REPORT_WEBHOOK_URL,
} from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

type Doc = {
  id: string;
  name: string;
  size: string;
  uploaded: string;
  url: string;
  path: string;
};

type Report = {
  id: string;
  file_name: string;
  file_path: string;
  public_url?: string;
  file_size: number | null;
  created_at: string;
  status: string;
  progress: number | null;
  message: string | null;
};

type LatestInsight = {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string;
  html_content: string;
};

type ReportFiling = {
  k_number: string;
  submitter: string;
  device_name: string;
  cleared_date?: string;
  similarity_score: number;
  what_is_similar: string[];
  what_is_different: string[];
  competitive_implication: string;
  regulatory_insight: string;
  predicate_chain: string;
};

type ReportData = {
  top_5: ReportFiling[];
  overall_landscape_summary: string;
  recommended_predicate: string;
  recommended_predicate_rationale: string;
  standards_checklist: string[];
  action_plan: string[];
};

type LatestReport = {
  id: string;
  created_at: string;
  file_name: string;
  data: ReportData;
};

type Tab = "documents" | "reports";

const formatSize = (bytes: number) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const displayName = (storedName: string) =>
  storedName.replace(/^\d+-/, "");

const downloadBlob = async (url: string, filename: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
};

// Turn the device name into a safe storage folder segment.
const folderFor = (productName: string) =>
  productName
    .trim()
    .replace(/[^\w\-. ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 100) || "device";

const scoreColor = (score: number) => {
  if (score >= 80) return "#1D9E75";
  if (score >= 60) return "#BA7517";
  return "#E24B4A";
};

const LatestReportSummary = ({ report }: { report: LatestReport }) => {
  const { data, created_at } = report;
  const generatedAt = new Date(created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="surface-card p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
              style={{ color: "#FF9100", background: "rgba(255,145,0,0.1)" }}
            >
              Latest
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Report summary
            </span>
          </div>
          <h3 className="text-[16px] font-medium text-foreground">
            {report.file_name}
          </h3>
        </div>
        <span className="text-[12px] text-muted-foreground shrink-0">
          {generatedAt}
        </span>
      </div>

      {data.overall_landscape_summary && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Competitive landscape
          </div>
          <p className="text-[13px] leading-relaxed text-foreground">
            {data.overall_landscape_summary}
          </p>
        </div>
      )}

      {data.recommended_predicate && (
        <div className="rounded-lg border hairline p-4 bg-secondary/30">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            Recommended predicate
          </div>
          <div className="text-[14px] font-medium text-foreground mb-1">
            {data.recommended_predicate}
          </div>
          {data.recommended_predicate_rationale && (
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              {data.recommended_predicate_rationale}
            </p>
          )}
        </div>
      )}

      {Array.isArray(data.top_5) && data.top_5.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
            Top {data.top_5.length} similar filings
          </div>
          <div className="space-y-3">
            {data.top_5.map((f, i) => (
              <div
                key={`${f.k_number}-${i}`}
                className="rounded-lg border hairline p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-foreground truncate">
                      {i + 1}. {f.device_name}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {f.submitter} · {f.k_number}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-[20px] font-medium leading-none"
                      style={{ color: scoreColor(f.similarity_score) }}
                    >
                      {f.similarity_score}%
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      similarity
                    </div>
                  </div>
                </div>

                {(f.what_is_similar?.length || f.what_is_different?.length) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    {f.what_is_similar?.length > 0 && (
                      <div className="rounded-md p-3" style={{ background: "rgba(29,158,117,0.08)" }}>
                        <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "#0F6E56" }}>
                          Similar
                        </div>
                        <ul className="space-y-1">
                          {f.what_is_similar.map((s, idx) => (
                            <li key={idx} className="text-[12px] leading-snug text-foreground flex gap-1.5">
                              <span style={{ color: "#1D9E75" }}>•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {f.what_is_different?.length > 0 && (
                      <div className="rounded-md p-3" style={{ background: "rgba(226,75,74,0.08)" }}>
                        <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "#A32D2D" }}>
                          Different
                        </div>
                        <ul className="space-y-1">
                          {f.what_is_different.map((d, idx) => (
                            <li key={idx} className="text-[12px] leading-snug text-foreground flex gap-1.5">
                              <span style={{ color: "#E24B4A" }}>•</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {f.competitive_implication && (
                  <div className="text-[12px] leading-relaxed text-muted-foreground mt-2">
                    <span className="font-medium text-foreground">Implication: </span>
                    {f.competitive_implication}
                  </div>
                )}
                {f.regulatory_insight && (
                  <div className="text-[12px] leading-relaxed text-muted-foreground mt-1.5">
                    <span className="font-medium" style={{ color: "#534AB7" }}>Regulatory: </span>
                    {f.regulatory_insight}
                  </div>
                )}
                {f.predicate_chain && (
                  <div className="text-[12px] leading-relaxed text-muted-foreground mt-1.5">
                    <span className="font-medium text-foreground">Predicate chain: </span>
                    {f.predicate_chain}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(data.action_plan) && data.action_plan.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
            Action plan
          </div>
          <ol className="space-y-2">
            {data.action_plan.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span
                  className="shrink-0 w-6 h-6 rounded-full text-[11px] font-medium flex items-center justify-center"
                  style={{ background: "rgba(255,145,0,0.12)", color: "#FF9100" }}
                >
                  {i + 1}
                </span>
                <span className="text-[13px] leading-relaxed text-foreground pt-0.5">
                  {step.replace(/^\d+\.\s*/, "")}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {Array.isArray(data.standards_checklist) && data.standards_checklist.length > 0 && (() => {
        const recommendedRe = /recommended based on competitor filings/i;
        const cited = data.standards_checklist.filter((s) => !recommendedRe.test(s));
        const recommended = data.standards_checklist.filter((s) => recommendedRe.test(s));
        const stripRecommendedSuffix = (s: string) =>
          s.replace(/\s*[—-]?\s*Recommended based on competitor filings.*$/i, "")
            .replace(/\(Recommended based on competitor filings.*?\)/i, "")
            .trim();
        return (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
              Standards checklist
            </div>
            {cited.length > 0 && (
              <div className="mb-3">
                <div className="text-[11px] font-medium text-foreground mb-2">Cited in client filing</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cited.map((s, i) => (
                    <div key={i} className="rounded-md border hairline px-3 py-2 bg-secondary/30 text-[12px] text-foreground">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {recommended.length > 0 && (
              <div>
                <div className="text-[11px] font-medium mb-2" style={{ color: "#BA7517" }}>
                  Recommended based on competitor filings
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {recommended.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-md px-3 py-2 text-[12px]"
                      style={{ background: "#FAEEDA", color: "#633806", border: "1px solid #BA7517" }}
                    >
                      {stripRecommendedSuffix(s)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<{ id: string; product_name: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDeviceOpen, setDeleteDeviceOpen] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobMessage, setJobMessage] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [latestReport, setLatestReport] = useState<LatestReport | null>(null);

  const { user } = useAuth();
  const userId = user?.id ?? "";

  const rawTab = searchParams.get("tab");
  const initialTab: Tab = rawTab === "reports" ? "reports" : "documents";
  const [tab, setTab] = useState<Tab>(initialTab);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const loadDocs = useCallback(async () => {
    if (!id || !profile || !userId) return;
    const folder = `${userId}/${folderFor(profile.product_name)}`;
    setDocsLoading(true);
    const { data, error } = await supabase.storage
      .from(PROFILE_DOCUMENTS_BUCKET)
      .list(folder, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
    if (error) {
      toast.error(`Couldn't load documents: ${error.message}`);
      setDocsLoading(false);
      return;
    }
    const items: Doc[] = (data ?? [])
      .filter((f) => f.name && f.name !== ".emptyFolderPlaceholder")
      .map((f) => {
        const path = `${folder}/${f.name}`;
        const { data: pub } = supabase.storage
          .from(PROFILE_DOCUMENTS_BUCKET)
          .getPublicUrl(path);
        return {
          id: f.id ?? path,
          name: displayName(f.name),
          size: formatSize((f.metadata as any)?.size ?? 0),
          uploaded: formatDate(f.created_at ?? (f as any).updated_at),
          url: pub.publicUrl,
          path,
        };
      });
    setDocs(items);
    setDocsLoading(false);
  }, [id, profile, userId]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const loadReports = useCallback(async () => {
    if (!id || !userId) return;
    setReportsLoading(true);
    const folder = `${userId}/${id}`;
    const { data, error } = await supabase.storage
      .from(PROFILE_REPORTS_BUCKET)
      .list(folder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      toast.error(`Couldn't load reports: ${error.message}`);
      setReportsLoading(false);
      return;
    }
    const items: Report[] = (data ?? [])
      .filter((f) => f.name && f.name !== ".emptyFolderPlaceholder")
      .map((f) => {
        const path = `${folder}/${f.name}`;
        const tsMatch = f.name.match(/^(\d+)-/);
        const ts = tsMatch ? parseInt(tsMatch[1], 10) : 0;
        const label = ts
          ? `Report — ${new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}`
          : displayName(f.name);
        const { data: pub } = supabase.storage.from(PROFILE_REPORTS_BUCKET).getPublicUrl(path);
        return {
          id: f.id ?? path,
          file_name: label,
          file_path: path,
          public_url: pub.publicUrl,
          file_size: (f.metadata as any)?.size ?? null,
          created_at: f.created_at ?? (f as any).updated_at ?? "",
          status: "complete",
          progress: null,
          message: null,
        };
      });
    setReports(items);
    setReportsLoading(false);
  }, [id, userId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const loadLatestReport = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("reports")
      .select("id, created_at, file_name, report_data")
      .eq("device_id", id)
      .eq("status", "complete")
      .not("report_data", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return;
    if (!data || !data.report_data) {
      setLatestReport(null);
      return;
    }
    const raw = data.report_data as any;
    const parsed: ReportData | null =
      typeof raw === "string"
        ? (() => {
            try {
              return JSON.parse(raw) as ReportData;
            } catch {
              return null;
            }
          })()
        : (raw as ReportData);
    if (!parsed || !Array.isArray(parsed.top_5)) {
      setLatestReport(null);
      return;
    }
    setLatestReport({
      id: data.id,
      created_at: data.created_at,
      file_name: data.file_name,
      data: parsed,
    });
  }, [id]);

  useEffect(() => {
    loadLatestReport();
  }, [loadLatestReport]);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!profile) {
      toast.error("Device not loaded yet");
      return;
    }
    const file = files[0];
    if (file.type && file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    setUploading(true);
    try {
      const folder = `${userId}/${folderFor(profile.product_name)}`;
      const path = `${folder}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from(PROFILE_DOCUMENTS_BUCKET)
        .upload(path, file, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage
        .from(PROFILE_DOCUMENTS_BUCKET)
        .getPublicUrl(path);

      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: pub.publicUrl,
          file_name: file.name,
          file_path: path,
          product_name: profile.product_name,
          device_id: profile.id,
          user_id: userId,
        }),
      });

      toast.success(`${file.name} uploaded`);
      setTab("documents");
      setSearchParams({ tab: "documents" }, { replace: true });
      await loadDocs();
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong during upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const generateReport = async () => {
    if (!profile || !N8N_REPORT_WEBHOOK_URL) {
      toast.error("Report webhook not configured yet");
      return;
    }
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { toast.error("Not signed in"); return; }

    const label = `Report — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    const { data: job, error: jobErr } = await supabase
      .from("reports")
      .insert({ device_id: profile.id, user_id: currentUser.id, file_name: label, file_path: "", status: "processing" })
      .select()
      .single();
    if (jobErr) { toast.error(jobErr.message); return; }

    setActiveJobId(job.id);
    setJobProgress(0);
    setJobMessage("Starting…");
    setGeneratingReport(true);
    switchTab("reports");

    fetch(N8N_REPORT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: job.id, device_id: profile.id, product_name: profile.product_name, user_id: currentUser.id }),
    }).catch(console.error);
  };

  useEffect(() => {
    if (!activeJobId) return;
    const channel = supabase
      .channel(`report-${activeJobId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reports", filter: `id=eq.${activeJobId}` }, (payload) => {
        const r = payload.new as Report;
        if (r.status === "complete" || r.status === "error") {
          if (r.status === "complete") setJobProgress(100);
          setTimeout(() => { setGeneratingReport(false); setActiveJobId(null); }, 800);
          r.status === "complete" ? toast.success("Report ready") : toast.error("Report generation failed");
          loadReports();
          if (r.status === "complete") loadLatestReport();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeJobId, loadReports, loadLatestReport]);

  useEffect(() => {
    if (!generatingReport) return;
    const interval = setInterval(() => {
      setJobProgress(prev => {
        if (prev >= 80) return prev;      // hold at 80% waiting for Gemini
        if (prev >= 60) return prev + 1;  // slow from 60–80%
        return prev + 3;                  // fast from 0–60%
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [generatingReport]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };

  const openEdit = () => {
    if (!profile) return;
    setEditName(profile.product_name);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!profile) return;
    const newName = editName.trim();
    if (!newName) {
      toast.error("Device name can't be empty");
      return;
    }
    if (newName === profile.product_name) {
      setEditOpen(false);
      return;
    }
    setSavingEdit(true);
    try {
      const oldFolder = `${userId}/${folderFor(profile.product_name)}`;
      const newFolder = `${userId}/${folderFor(newName)}`;

      // Move existing files in storage if folder changes.
      if (oldFolder !== newFolder) {
        const { data: existing, error: listErr } = await supabase.storage
          .from(PROFILE_DOCUMENTS_BUCKET)
          .list(oldFolder, { limit: 1000 });
        if (listErr) throw listErr;
        for (const f of existing ?? []) {
          if (!f.name || f.name === ".emptyFolderPlaceholder") continue;
          const { error: mvErr } = await supabase.storage
            .from(PROFILE_DOCUMENTS_BUCKET)
            .move(`${oldFolder}/${f.name}`, `${newFolder}/${f.name}`);
          if (mvErr) throw mvErr;
        }
      }

      const { error: updErr } = await supabase
        .from("client_profiles")
        .update({ product_name: newName })
        .eq("id", profile.id);
      if (updErr) throw updErr;

      setProfile({ ...profile, product_name: newName });
      toast.success("Device updated");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't update device");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.storage
      .from(PROFILE_DOCUMENTS_BUCKET)
      .remove([deleteTarget.path]);
    setDeleting(false);
    if (error) {
      toast.error(`Couldn't delete: ${error.message}`);
      return;
    }
    toast.success(`${deleteTarget.name} deleted`);
    setDeleteTarget(null);
    await loadDocs();
  };

  const confirmDeleteDevice = async () => {
    if (!profile) return;
    setDeletingDevice(true);
    try {
      const folder = `${userId}/${folderFor(profile.product_name)}`;

      const { data: existing, error: listErr } = await supabase.storage
        .from(PROFILE_DOCUMENTS_BUCKET)
        .list(folder, { limit: 1000 });
      if (listErr) throw new Error(`Storage list failed: ${listErr.message}`);

      const paths = (existing ?? [])
        .filter((f) => f.name)
        .map((f) => `${folder}/${f.name}`);

      if (paths.length > 0) {
        const { error: rmErr } = await supabase.storage
          .from(PROFILE_DOCUMENTS_BUCKET)
          .remove(paths);
        if (rmErr) throw new Error(`Storage remove failed: ${rmErr.message}`);
      }

      const { error: delErr } = await supabase
        .from("client_profiles")
        .delete()
        .eq("id", profile.id);
      if (delErr) throw new Error(`DB delete failed: ${delErr.message}`);

      toast.success(`${profile.product_name} deleted`);
      navigate("/profiles");
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't delete device");
      setDeletingDevice(false);
    }
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
          <Button
            variant="outline"
            className="h-8 rounded-lg text-[13px] gap-1.5"
            onClick={openEdit}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit device
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
                <p className="text-[13px] text-foreground">Drop a PDF or click to upload</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Single PDF only. Upload at least one device document to generate a report.
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              disabled={uploading}
              className="hidden"
              onChange={(e) => onUpload(e.target.files)}
            />
          </div>

          <div className="surface-card">
            <div className="grid grid-cols-12 px-5 py-2.5 border-b hairline text-[11px] uppercase tracking-wider text-muted-foreground">
              <div className="col-span-5">Document</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-3">Uploaded</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {docsLoading ? (
              <div className="px-5 py-10 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : docs.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                No documents uploaded yet.
              </div>
            ) : (
              <ul>
                {docs.map((d, i) => (
                  <li
                    key={d.id}
                    className={cn(
                      "grid grid-cols-12 px-5 py-3.5 items-center",
                      i !== 0 && "border-t hairline"
                    )}
                  >
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-[13px] text-foreground truncate">{d.name}</span>
                    </div>
                    <div className="col-span-2 text-[12px] text-muted-foreground">{d.size}</div>
                    <div className="col-span-3 text-[12px] text-muted-foreground">{d.uploaded}</div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        onClick={() => downloadBlob(d.url, d.name)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label={`Download ${d.name}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(d)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`Delete ${d.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === "reports" && (
        <div className="space-y-4">
          {latestReport && !generatingReport && (
            <LatestReportSummary report={latestReport} />
          )}

          <button
            onClick={generateReport}
            disabled={generatingReport}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-xl text-white font-medium text-[15px] transition-colors disabled:opacity-60"
            style={{ background: "#FF9100" }}
            onMouseEnter={e => { if (!generatingReport) (e.currentTarget as HTMLButtonElement).style.background = "#e68200"; }}
            onMouseLeave={e => { if (!generatingReport) (e.currentTarget as HTMLButtonElement).style.background = "#FF9100"; }}
          >
            {generatingReport ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Generating report…</>
            ) : (
              <><Sparkles className="h-5 w-5" /> Generate new report</>
            )}
          </button>

          {generatingReport && (
            <div className="surface-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[13px] text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  Generating report
                </div>
                <span className="text-[13px] font-medium" style={{ color: "#FF9100" }}>{jobProgress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${jobProgress}%`, background: "#FF9100" }}
                />
              </div>
              {jobMessage && (
                <p className="text-[12px] text-muted-foreground mt-2">{jobMessage}</p>
              )}
            </div>
          )}

          <div className="surface-card">
            <div className="grid grid-cols-12 px-5 py-2.5 border-b hairline text-[11px] uppercase tracking-wider text-muted-foreground">
              <div className="col-span-5">Report</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-3">Created</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {reportsLoading ? (
              <div className="px-5 py-10 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                No reports yet. Click "Generate new report" to create one.
              </div>
            ) : (
              <ul>
                {reports.map((r, i) => (
                  <li
                    key={r.id}
                    className={cn("grid grid-cols-12 px-5 py-3.5 items-center", i !== 0 && "border-t hairline")}
                  >
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] text-foreground truncate">{r.file_name}</span>
                        {i === 0 && (
                          <span className="shrink-0 text-[11px] font-medium px-1.5 py-0.5 rounded-md" style={{ color: "#FF9100", background: "rgba(255,145,0,0.1)" }}>
                            Latest
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-[12px] text-muted-foreground">
                      {r.file_size ? formatSize(r.file_size) : "—"}
                    </div>
                    <div className="col-span-3 text-[12px] text-muted-foreground">{formatDate(r.created_at)}</div>
                    <div className="col-span-2 flex items-center justify-end">
                      <button
                        onClick={() => downloadBlob(r.public_url ?? "", r.file_name + ".pdf")}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label="Download report"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit device</DialogTitle>
            <DialogDescription>
              Renaming the device also renames its document folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-device-name" className="text-[12px]">
              Device name
            </Label>
            <Input
              id="edit-device-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !savingEdit && editName.trim()) saveEdit();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setDeleteDeviceOpen(true);
              }}
              disabled={savingEdit}
              className="text-destructive hover:text-destructive gap-1.5 mr-auto"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete device
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit || !editName.trim()}>
              {savingEdit ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} will be permanently removed from storage. This
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDeviceOpen}
        onOpenChange={(o) => !o && !deletingDevice && setDeleteDeviceOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete device?</AlertDialogTitle>
            <AlertDialogDescription>
              {profile.product_name} and all of its uploaded documents will be
              permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingDevice}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteDevice();
              }}
              disabled={deletingDevice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingDevice ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Deleting…
                </>
              ) : (
                "Delete device"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileDetail;
