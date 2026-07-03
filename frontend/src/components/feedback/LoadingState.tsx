import { GlassCard } from "../common/GlassCard";

export const LoadingState = () => (
  <GlassCard className="loading-shell" role="status" aria-live="polite">
    <div>
      <h2>Loading office dashboard</h2>
      <p className="muted">Fetching the latest device state from the backend.</p>
    </div>
  </GlassCard>
);
