import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, ShieldAlert, Activity } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SeverityBadge from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { alerts, profiles } from "@/lib/mockData";

const stats = [
  { label: "Active devices", value: "4", icon: Activity },
  { label: "Documents indexed", value: "49", icon: FileText },
  { label: "Open risks", value: "2", icon: ShieldAlert },
];

const Index = () => {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Regulatory intelligence across your device portfolio."
        actions={
          <Button asChild className="h-8 rounded-lg text-[13px]">
            <Link to="/profiles">New device</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="surface-card p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[12px] uppercase tracking-wider">{s.label}</span>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="mt-3 text-[28px] font-medium text-foreground tracking-tight">
              {s.value}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 surface-card">
          <div className="flex items-center justify-between px-5 py-4 hairline border-b">
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
        </div>

        <div className="surface-card">
          <div className="px-5 py-4 hairline border-b">
            <h2 className="text-[14px] text-foreground">Your devices</h2>
          </div>
          <ul>
            {profiles.slice(0, 4).map((p, i) => (
              <li key={p.id} className={`px-5 py-3 ${i !== 0 ? "border-t hairline" : ""}`}>
                <Link to={`/profiles/${p.id}`} className="block group">
                  <p className="text-[13px] text-foreground group-hover:text-primary transition-colors">
                    {p.name}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Class {p.deviceClass} · {p.market}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
};

export default Index;
