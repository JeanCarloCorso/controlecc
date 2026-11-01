import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface InlineFeedbackProps {
  title: string;
  description?: string;
  variant?: "info" | "success" | "error";
}

export function InlineFeedback({ title, description, variant = "info" }: InlineFeedbackProps) {
  const styles = {
    info: "gov-status-info",
    success: "gov-status-success",
    error: "gov-status-error",
  };
  const Icon = variant === "success" ? CheckCircle2 : variant === "error" ? AlertCircle : Info;

  return (
    <div className={`${styles[variant]} flex gap-3`} role={variant === "error" ? "alert" : "status"}>
      <Icon className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        {description ? <p className="mt-1 text-sm">{description}</p> : null}
      </div>
    </div>
  );
}
