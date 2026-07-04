import { GlassCard } from "../components/common/GlassCard";

const roadmapContent: Record<string, { intro: string; items: string[] }> = {
  Analytics: {
    intro: "Planned after historical storage is added:",
    items: [
      "Daily energy usage",
      "Per-room trends",
      "Peak usage windows",
      "Estimated cost"
    ]
  },
  Reports: {
    intro: "Planned after report generation is added:",
    items: [
      "Daily summary",
      "Usage by room",
      "Estimated electricity cost",
      "Export options"
    ]
  },
  Settings: {
    intro: "Planned after configuration support is added:",
    items: [
      "Office hours",
      "Alert thresholds",
      "Electricity cost per kWh",
      "Discord channel settings"
    ]
  }
};

export const ComingSoonPage = ({ title }: { title: string }) => {
  const content = roadmapContent[title] ?? {
    intro: "Planned after backend support is added:",
    items: ["Backend-backed controls", "Verified live data"]
  };

  return (
    <GlassCard className="coming-soon-card">
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <p>Coming in the next phase</p>
        </div>
        <span className="badge">Deferred honestly</span>
      </div>
      <div className="roadmap-card">
        <p>{content.intro}</p>
        <ul>
          {content.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <p className="muted coming-soon-note">
        This page avoids fake data because the backend does not expose these
        features yet.
      </p>
    </GlassCard>
  );
};
