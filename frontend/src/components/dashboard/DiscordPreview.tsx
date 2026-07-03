import { MessageCircle } from "lucide-react";
import { GlassCard } from "../common/GlassCard";

const commands = [
  ["!status", "Get overall office status"],
  ["!room work1", "View Work Room 1 details"],
  ["!usage", "View current power usage"]
];

export const DiscordPreview = () => (
  <GlassCard className="panel-card">
    <div className="section-heading">
      <h2 className="section-title">
        <MessageCircle size={18} /> Discord Bot Commands
      </h2>
      <span className="badge">Coming in Discord phase</span>
    </div>
    <div className="command-list">
      {commands.map(([command, description]) => (
        <div className="command-item" key={command}>
          <strong>{command}</strong>
          <p className="muted">{description}</p>
        </div>
      ))}
    </div>
  </GlassCard>
);
