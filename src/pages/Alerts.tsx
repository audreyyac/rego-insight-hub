import PageHeader from "@/components/PageHeader";
import SeverityBadge from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { alerts } from "@/lib/mockData";

const Alerts = () => (
  <>
    <PageHeader
      title="Alerts"
      description="Regulatory changes affecting your monitored profiles."
      actions={<Button variant="outline" className="h-8 rounded-lg text-[13px]">Configure</Button>}
    />
    <div className="surface-card">
      <ul>
        {alerts.map((a, i) => (
          <li
            key={a.id}
            className={`px-5 py-4 flex items-start gap-4 ${i !== 0 ? "border-t hairline" : ""}`}
          >
            <SeverityBadge severity={a.severity} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-foreground">{a.title}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {a.source} · Affects <span className="text-foreground">{a.profile}</span>
              </p>
            </div>
            <span className="text-[12px] text-muted-foreground whitespace-nowrap">{a.date}</span>
          </li>
        ))}
      </ul>
    </div>
  </>
);

export default Alerts;
