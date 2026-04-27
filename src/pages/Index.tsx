import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, FileText, Activity, Plus, Upload, Loader2 } from "lucide-react";
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

type Device = { id: string; product_name: string };

const folderFor = (productName: string) =>
  productName.trim().replace(/[^\w\-. ]+/g, "_").replace(/\s+/g, "_").slice(0, 100) || "device";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [reportCount, setReportCount] = useState<number | null>(null);

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
      const { count } = await supabase
        .from("client_profiles")
        .select("*", { count: "exact", head: true });
      setDeviceCount(count ?? 0);
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

  return (
    <div className="space-y-8">
      <div className="pt-2">
        <h1 className="text-[26px] font-medium text-foreground tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Here's what's happening across your device portfolio.
        </p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </section>

      <section className="surface-card">
        <div className="px-5 py-4 border-b hairline">
          <h2 className="text-[14px] text-foreground">Quick actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x hairline">
          <button
            onClick={() => navigate("/profiles?new=1")}
            className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/40 transition-colors group text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">New device</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Create a new medical device profile.</p>
            </div>
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/40 transition-colors group text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Upload className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">Upload document</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Add a PDF to the device profile.</p>
            </div>
          </button>
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
