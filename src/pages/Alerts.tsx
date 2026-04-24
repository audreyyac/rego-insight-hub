import PageHeader from "@/components/PageHeader";
import SeverityBadge from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { alerts } from "@/lib/mockData";
import { Link } from "react-router-dom";
import { profiles } from "@/lib/mockData";
import { Sparkles } from "lucide-react";

const profileIdByName = (name: string) =>
  profiles.find((p) => p.name === name)?.id ?? profiles[0].id;

const Alerts = () => (
  <>
    <PageHeader
      title="Alerts"
      description="New regulatory information relevant to your devices. Generate a new report to incorporate these changes."
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
            <Button
              asChild
              variant="outline"
              className="h-8 rounded-lg text-[12px] gap-1.5 whitespace-nowrap"
            >
              <Link to={`/profiles/${profileIdByName(a.profile)}?tab=reports&generate=1`}>
                <Sparkles className="h-3 w-3" /> Generate new report
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  </>
);

export default Alerts;
