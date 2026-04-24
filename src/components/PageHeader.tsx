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
  <div className="flex items-start justify-between mb-8">
    <div>
      <h1 className="text-[22px] text-foreground">{title}</h1>
      {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
