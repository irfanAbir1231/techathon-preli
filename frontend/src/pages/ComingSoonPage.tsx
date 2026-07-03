import { GlassCard } from "../components/common/GlassCard";

export const ComingSoonPage = ({ title }: { title: string }) => (
  <GlassCard className="coming-soon-card">
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        <p>Coming in the next phase.</p>
      </div>
      <span className="badge">Deferred</span>
    </div>
    <p className="muted">
      This page intentionally avoids fake analytics, reports, settings, or controls
      because the backend does not expose those features yet.
    </p>
  </GlassCard>
);
