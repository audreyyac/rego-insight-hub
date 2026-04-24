import { cn } from "@/lib/utils";

type Sev = "risk" | "watch" | "advantage";

const map: Record<Sev, { label: string; className: string }> = {
  advantage: { label: "Advantage", className: "bg-success/10 text-success border-success/20" },
  watch: { label: "Watch", className: "bg-warning/10 text-warning border-warning/20" },
  risk: { label: "Risk", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const SeverityBadge = ({ severity }: { severity: Sev }) => {
  const v = map[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
        v.className
      )}
      style={{ borderWidth: "0.5px", borderStyle: "solid" }}
    >
      {v.label}
    </span>
  );
};

export default SeverityBadge;
