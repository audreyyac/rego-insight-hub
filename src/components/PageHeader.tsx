import { ReactNode } from "react";

const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <div className="flex items-start justify-between mb-8 pb-5 border-b hairline">
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-2 h-6 w-[3px] rounded-full bg-primary shrink-0"
      />
      <div>
        <h1 className="text-[24px] text-foreground tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
