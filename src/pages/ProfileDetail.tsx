import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  Trash2,
  Pencil,
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

// Strip the "<timestamp>-" prefix we add at upload time so the original
// filename is shown to the user.
const displayName = (storedName: string) =>
  storedName.replace(/^\d+-/, "");

// Turn the device name into a safe storage folder segment.
const folderFor = (productName: string) =>
  productName
    .trim()
    .replace(/[^\w\-. ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 100) || "device";

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
                  Single PDF only. Sent to the processing webhook.
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
              <div className="col-span-6">Document</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-3">Uploaded</div>
              <div className="col-span-1 text-right">Actions</div>
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
                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-foreground truncate hover:underline"
                      >
                        {d.name}
                      </a>
                    </div>
                    <div className="col-span-2 text-[12px] text-muted-foreground">{d.size}</div>
                    <div className="col-span-3 text-[12px] text-muted-foreground">{d.uploaded}</div>
                    <div className="col-span-1 flex items-center justify-end">
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
        <div className="surface-card p-10 text-center">
          <p className="text-[13px] text-foreground">No reports yet</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Reports generated for this device will appear here.
          </p>
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
