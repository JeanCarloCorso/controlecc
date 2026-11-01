import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="gov-page-heading flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        {eyebrow ? <p className="gov-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="gov-page-actions">{actions}</div> : null}
    </header>
  );
}
