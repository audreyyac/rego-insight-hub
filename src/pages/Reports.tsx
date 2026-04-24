import { Download, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

const reports = [
  { id: "r1", name: "Q1 2026 portfolio regulatory review", profile: "All profiles", generated: "Mar 20, 2026", pages: 42 },
  { id: "r2", name: "Cardiac Monitor X1 — 510(k) readiness", profile: "Cardiac Monitor X1", generated: "Mar 18, 2026", pages: 28 },
  { id: "r3", name: "InsulinPump Pro — EU MDR gap analysis", profile: "InsulinPump Pro", generated: "Mar 12, 2026", pages: 36 },
  { id: "r4", name: "Cybersecurity guidance impact assessment", profile: "All profiles", generated: "Mar 05, 2026", pages: 18 },
];

const Reports = () => (
  <>
    <PageHeader
      title="Reports"
      description="Exportable regulatory deliverables generated from your profiles."
      actions={<Button className="h-8 rounded-lg text-[13px]">Generate report</Button>}
    />
    <div className="surface-card">
      <ul>
        {reports.map((r, i) => (
          <li
            key={r.id}
            className={`px-5 py-4 flex items-center gap-4 ${i !== 0 ? "border-t hairline" : ""}`}
          >
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-foreground">{r.name}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {r.profile} · {r.pages} pages · {r.generated}
              </p>
            </div>
            <Button variant="outline" className="h-8 rounded-lg text-[13px] gap-1.5">
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
          </li>
        ))}
      </ul>
    </div>
  </>
);

export default Reports;
