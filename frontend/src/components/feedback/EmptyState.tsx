import { CheckCircle2 } from "lucide-react";

export const EmptyState = ({
  title,
  message
}: {
  title: string;
  message: string;
}) => (
  <div className="empty-state">
    <div>
      <CheckCircle2 color="var(--green-live)" />
      <h3>{title}</h3>
      <p className="muted">{message}</p>
    </div>
  </div>
);
