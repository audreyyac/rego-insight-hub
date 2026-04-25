import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Activity, Plus, Upload, AlertTriangle } from "lucide-react";
import SeverityBadge from "@/components/SeverityBadge";
import { alerts } from "@/lib/mockData";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user } = useAuth();
  const [deviceCount, setDeviceCount] = useState<number | null>(null);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "Audrey";

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("client_profiles")
        .select("*", { count: "exact", head: true });
      setDeviceCount(count ?? 0);
    })();
  }, []);

  const riskCount = alerts.filter((a) => a.severity === "risk").length;
  const watchCount = alerts.filter((a) => a.severity === "watch").length;

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

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <span className="text-[11px] uppercase tracking-wider">Open risks</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-[28px] font-medium text-destructive tracking-tight">
            {riskCount}
          </div>
          <Link to="/alerts" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1 mt-2">
            View alerts <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-[11px] uppercase tracking-wider">Watch items</span>
            <FileText className="h-4 w-4" />
          </div>
          <div className="text-[28px] font-medium text-warning tracking-tight">
            {watchCount}
          </div>
          <Link to="/alerts" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1 mt-2">
            View alerts <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/profiles" className="surface-card p-5 flex items-center gap-4 hover:bg-secondary/40 transition-colors group">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-foreground group-hover:text-primary transition-colors">New device</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Add a device and start tracking regulatory requirements.</p>
          </div>
        </Link>

        <Link to="/profiles" className="surface-card p-5 flex items-center gap-4 hover:bg-secondary/40 transition-colors group">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-foreground group-hover:text-primary transition-colors">Upload document</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Add a PDF to a device to trigger regulatory analysis.</p>
          </div>
        </Link>
      </section>

      <section className="surface-card">
        <div className="flex items-center justify-between px-5 py-4 border-b hairline">
          <h2 className="text-[14px] text-foreground">Recent alerts</h2>
          <Link to="/alerts" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <ul>
          {alerts.slice(0, 4).map((a, i) => (
            <li
              key={a.id}
              className={`px-5 py-4 flex items-start gap-4 ${i !== 0 ? "border-t hairline" : ""}`}
            >
              <SeverityBadge severity={a.severity} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground truncate">{a.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {a.source} · {a.profile}
                </p>
              </div>
              <span className="text-[12px] text-muted-foreground whitespace-nowrap">{a.date}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Index;
