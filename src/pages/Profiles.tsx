import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profiles } from "@/lib/mockData";

const statusStyle: Record<string, string> = {
  Active: "text-success",
  "Under review": "text-warning",
  Draft: "text-muted-foreground",
};

const Profiles = () => {
  const [query, setQuery] = useState("");
  const filtered = profiles.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <>
      <PageHeader
        title="My Devices"
        description="Each device aggregates documents and regulatory analysis."
        actions={
          <Button className="h-8 rounded-lg text-[13px] gap-1.5">
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
          <div className="col-span-5">Device</div>
          <div className="col-span-2">Class</div>
          <div className="col-span-2">Markets</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Docs</div>
        </div>

        <ul>
          {filtered.map((p, i) => (
            <li key={p.id}>
              <Link
                to={`/profiles/${p.id}`}
                className={`grid grid-cols-12 px-5 py-3.5 items-center hover:bg-secondary/50 transition-colors ${
                  i !== 0 ? "border-t hairline" : ""
                }`}
              >
                <div className="col-span-5">
                  <p className="text-[13px] text-foreground">{p.name}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Updated {p.updated}</p>
                </div>
                <div className="col-span-2 text-[13px] text-foreground">Class {p.deviceClass}</div>
                <div className="col-span-2 text-[13px] text-muted-foreground">{p.market}</div>
                <div className={`col-span-2 text-[13px] ${statusStyle[p.status]}`}>{p.status}</div>
                <div className="col-span-1 text-right text-[13px] text-muted-foreground">
                  {p.documents}
                </div>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-5 py-8 text-center text-[13px] text-muted-foreground">
              No devices match "{query}".
            </li>
          )}
        </ul>
      </div>
    </>
  );
};

export default Profiles;
