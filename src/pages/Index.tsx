import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Activity, Plus, Upload } from "lucide-react";
import SeverityBadge from "@/components/SeverityBadge";
import { alerts } from "@/lib/mockData";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = {
  risk: "hsl(0, 74%, 59%)",
  watch: "hsl(32, 78%, 41%)",
  advantage: "hsl(159, 70%, 37%)",
};

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
  const advantageCount = alerts.filter((a) => a.severity === "advantage").length;

  const pieData = [
    { name: "Risks", value: riskCount, color: COLORS.risk },
    { name: "Watch", value: watchCount, color: COLORS.watch },
    { name: "Advantages", value: advantageCount, color: COLORS.advantage },
  ].filter((d) => d.value > 0);

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

        <div className="surface-card p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] uppercase tracking-wider">Alert breakdown</span>
            <Link to="/alerts" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <PieChart width={180} height={100}>
            <Pie
              data={pieData}
              cx={90}
              cy={95}
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[12px] text-destructive">{riskCount} risk{riskCount !== 1 ? "s" : ""}</span>
            <span className="text-[12px] text-warning">{watchCount} watch</span>
            <span className="text-[12px] text-success">{advantageCount} adv</span>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-[11px] uppercase tracking-wider">Reports generated</span>
            <FileText className="h-4 w-4" />
          </div>
          <div className="text-[28px] font-medium text-foreground tracking-tight">
            12
          </div>
          <span className="text-[12px] text-muted-foreground mt-2 inline-block">Across all devices</span>
        </div>
      </section>

      <section className="surface-card">
        <div className="px-5 py-4 border-b hairline">
          <h2 className="text-[14px] text-foreground">Quick actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x hairline">
          <Link to="/profiles" className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/40 transition-colors group">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">New device</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Register a new medical device.</p>
            </div>
          </Link>
          <Link to="/profiles" className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/40 transition-colors group">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Upload className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">Upload document</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Add a PDF to trigger analysis.</p>
            </div>
          </Link>
        </div>
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
