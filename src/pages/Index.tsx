import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Activity, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SeverityBadge from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { alerts } from "@/lib/mockData";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Device = {
  id: string;
  product_name: string;
  date_created: string | null;
};

const Index = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("client_profiles")
        .select("id, product_name, date_created")
        .order("date_created", { ascending: false })
        .limit(4);
      if (!error) setDevices(data ?? []);
      setDevicesLoading(false);
    })();
  }, []);

  const stats = [
    {
      label: "Active devices",
      value: devicesLoading ? "—" : String(devices.length),
      icon: Activity,
    },
    { label: "Reports generated", value: "—", icon: FileText },
  ];

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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
          <div className="flex items-center justify-between px-5 py-4 hairline border-b">
            <h2 className="text-[14px] text-foreground">Your devices</h2>
            <Link to="/profiles" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {devicesLoading ? (
            <div className="px-5 py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : devices.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">
              No devices yet.{" "}
              <Link to="/profiles" className="text-primary hover:underline">
                Add one
              </Link>
            </div>
          ) : (
            <ul>
              {devices.map((d, i) => (
                <li key={d.id} className={`px-5 py-3 ${i !== 0 ? "border-t hairline" : ""}`}>
                  <Link to={`/profiles/${d.id}`} className="block group">
                    <p className="text-[13px] text-foreground group-hover:text-primary transition-colors">
                      {d.product_name}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
};

export default Index;
