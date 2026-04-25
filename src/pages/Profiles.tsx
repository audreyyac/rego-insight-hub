import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type Device = {
  id: string;
  product_name: string;
  date_created: string | null;
};

const formatRelative = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Profiles = () => {
  const [query, setQuery] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_profiles")
      .select("id, product_name, date_created")
      .order("date_created", { ascending: false });
    if (error) {
      toast.error(`Couldn't load devices: ${error.message}`);
    } else {
      setDevices(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = devices.filter((d) =>
    d.product_name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const createDevice = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("client_profiles")
      .insert({ product_name: name })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast.error(`Couldn't create device: ${error.message}`);
      return;
    }
    setDevices((d) => [data as Device, ...d]);
    setNewName("");
    setOpen(false);
    toast.success(`Device "${name}" created`);
  };

  return (
    <>
      <PageHeader
        title="My Devices"
        description="Each device aggregates documents and regulatory analysis."
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="h-8 rounded-lg text-[13px] gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> New device
          </Button>
        }
      />

      <div className="surface-card">
        <div className="px-5 py-3 hairline border-b flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search devices…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 border-0 shadow-none focus-visible:ring-0 px-0 text-[13px]"
          />
        </div>

        <div className="grid grid-cols-12 px-5 py-2.5 border-b hairline text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="col-span-9">Device</div>
          <div className="col-span-3 text-right">Created</div>
        </div>

        {loading ? (
          <div className="px-5 py-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <ul>
            {filtered.map((d, i) => (
              <li key={d.id}>
                <Link
                  to={`/profiles/${d.id}`}
                  className={`grid grid-cols-12 px-5 py-3.5 items-center hover:bg-secondary/50 transition-colors ${
                    i !== 0 ? "border-t hairline" : ""
                  }`}
                >
                  <div className="col-span-9">
                    <p className="text-[13px] text-foreground">{d.product_name}</p>
                  </div>
                  <div className="col-span-3 text-right text-[12px] text-muted-foreground">
                    {formatRelative(d.date_created)}
                  </div>
                </Link>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                {devices.length === 0
                  ? "No devices yet. Click \"New device\" to create one."
                  : `No devices match "${query}".`}
              </li>
            )}
          </ul>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New device</DialogTitle>
            <DialogDescription>
              Give your device a name. You can edit it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="device-name" className="text-[12px]">
              Device name
            </Label>
            <Input
              id="device-name"
              placeholder="e.g. Cardiac Monitor X1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creating && newName.trim()) createDevice();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={createDevice} disabled={creating || !newName.trim()}>
              {creating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Creating…
                </>
              ) : (
                "Create device"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Profiles;
