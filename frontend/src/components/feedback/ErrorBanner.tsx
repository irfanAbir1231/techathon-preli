import { AlertTriangle } from "lucide-react";
import { GlassCard } from "../common/GlassCard";

export const ErrorBanner = ({
  title = "Backend unavailable",
  message,
  onRetry
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) => (
  <GlassCard className="error-panel" role="alert">
    <div>
      <AlertTriangle color="var(--red-alert)" />
      <h2>{title}</h2>
      <p className="muted">{message}</p>
      {onRetry ? (
        <button className="text-button" type="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  </GlassCard>
);
