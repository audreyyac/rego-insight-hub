import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, FileText, Activity, Plus, Upload, Loader2, Clock, Cpu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase, PROFILE_DOCUMENTS_BUCKET, N8N_WEBHOOK_URL } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Device = { id: string; product_name: string; date_created?: string };

const folderFor = (productName: string) =>
  productName.trim().replace(/[^\w\-. ]+/g, "_").replace(/\s+/g, "_").slice(0, 100) || "device";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [reportCount, setReportCount] = useState<number | null>(null);
  const [recentDevices, setRecentDevices] = useState<Device[] | null>(null);
  const [latestDeviceName, setLatestDeviceName] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDevices, setUploadDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "Audrey";
  const userId = user?.id ?? "";

  useEffect(() => {
    (async () => {
      const { data, count } = await supabase
        .from("client_profiles")
        .select("id, product_name, date_created", { count: "exact" })
        .order("date_created", { ascending: false })
        .limit(5);
      setDeviceCount(count ?? 0);
      setRecentDevices(data ?? []);
      setLatestDeviceName(data?.[0]?.product_name ?? null);
    })();
    (async () => {
      const { count } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "complete");
      setReportCount(count ?? 0);
    })();
  }, []);

  useEffect(() => {
    if (!uploadOpen) return;
    setSelectedDeviceId("");
    setUploadFile(null);
    (async () => {
      const { data } = await supabase
        .from("client_profiles")
        .select("id, product_name")
        .order("product_name");
      setUploadDevices(data ?? []);
    })();
  }, [uploadOpen]);

  const handleUpload = async () => {
    if (!uploadFile || !selectedDeviceId) return;
    const device = uploadDevices.find((d) => d.id === selectedDeviceId);
    if (!device) return;

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { toast.error("Not signed in"); return; }

    setUploading(true);
    try {
      const folder = `${currentUser.id}/${folderFor(device.product_name)}`;
      const path = `${folder}/${Date.now()}-${uploadFile.name}`;

      const { error: upErr } = await supabase.storage
        .from(PROFILE_DOCUMENTS_BUCKET)
        .upload(path, uploadFile, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage
        .from(PROFILE_DOCUMENTS_BUCKET)
        .getPublicUrl(path);

      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: pub.publicUrl,
          file_name: uploadFile.name,
          file_path: path,
          product_name: device.product_name,
          device_id: device.id,
          user_id: currentUser.id,
        }),
      });

      toast.success(`${uploadFile.name} uploaded to ${device.product_name}`);
      setUploadOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const formatRelative = (iso?: string) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  const reportsPerDevice =
    deviceCount && reportCount !== null && deviceCount > 0
      ? (reportCount / deviceCount).toFixed(1)
      : "—";

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl surface-card px-6 py-7">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(600px 200px at 0% 0%, hsl(var(--primary) / 0.10), transparent 60%), radial-gradient(500px 180px at 100% 100%, hsl(var(--primary) / 0.07), transparent 65%)",
          }}
        />
        <div className="relative">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Dashboard</span>
          <h1 className="text-[26px] font-medium text-foreground tracking-tight mt-1">
            Welcome back, {firstName}
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Here's what's happening across your device portfolio.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-[11px] uppercase tracking-wider">Active devices</span>
            <Activity className="h-4 w-4" />
          </div>
          <div className="text-[28px] font-medium text-foreground tracking-tight">
            {deviceCount === null ? "—" : deviceCount}
          </div>
          <Link to="/profiles" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1 mt-2">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-[11px] uppercase tracking-wider">Reports generated</span>
            <FileText className="h-4 w-4" />
          </div>
          <div className="text-[28px] font-medium text-foreground tracking-tight">
            {reportCount === null ? "—" : reportCount}
          </div>
          <span className="text-[12px] text-muted-foreground mt-2 inline-block">Across all devices</span>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-[11px] uppercase tracking-wider">Reports / device</span>
            <Cpu className="h-4 w-4" />
          </div>
          <div className="text-[28px] font-medium text-foreground tracking-tight">
            {reportsPerDevice}
          </div>
          <span className="text-[12px] text-muted-foreground mt-2 inline-block">Average across portfolio</span>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-[11px] uppercase tracking-wider">Latest device</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-[16px] font-medium text-foreground tracking-tight truncate">
            {latestDeviceName ?? "—"}
          </div>
          <span className="text-[12px] text-muted-foreground mt-2 inline-block">
            {recentDevices?.[0]?.date_created ? `Added ${formatRelative(recentDevices[0].date_created)}` : "No devices yet"}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="surface-card lg:col-span-2">
          <div className="px-5 py-4 border-b hairline">
            <h2 className="text-[14px] text-foreground">Quick actions</h2>
          </div>
          <div className="divide-y hairline">
            <button
              onClick={() => navigate("/profiles?new=1")}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-secondary/40 transition-colors group text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">New device</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Create a new medical device profile.</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-secondary/40 transition-colors group text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Upload className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">Upload document</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Add a PDF to the device profile.</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

        <div className="surface-card lg:col-span-3">
          <div className="px-5 py-4 border-b hairline flex items-center justify-between">
            <h2 className="text-[14px] text-foreground">Recent devices</h2>
            <Link to="/profiles" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recentDevices === null ? (
            <div className="px-5 py-6 text-[13px] text-muted-foreground">Loading…</div>
          ) : recentDevices.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Cpu className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-[13px] text-foreground">No devices yet</p>
              <p className="text-[12px] text-muted-foreground mt-1">Create your first device to get started.</p>
            </div>
          ) : (
            <ul className="divide-y hairline">
              {recentDevices.map((d) => (
                <li key={d.id}>
                  <Link
                    to={`/profiles/${d.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/40 transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {d.product_name}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Added {formatRelative(d.date_created)}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Dialog open={uploadOpen} onOpenChange={(o) => !uploading && setUploadOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription>
              Select a PDF then choose which device it belongs to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="border border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {uploadFile ? (
                <p className="text-[13px] text-foreground">{uploadFile.name}</p>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-[13px] text-foreground">Click to select a PDF</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a device…" />
              </SelectTrigger>
              <SelectContent>
                {uploadDevices.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.product_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !selectedDeviceId}
            >
              {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Uploading…</> : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
