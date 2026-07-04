import { MessageCircle } from "lucide-react";
import { GlassCard } from "../common/GlassCard";

const commands = [
  ["!help", "Show all bot commands"],
  ["!status", "Office overview"],
  ["!room work1", "Room-specific status"],
  ["!usage", "Current power draw"]
];

export const DiscordPreview = () => (
  <GlassCard className="panel-card">
    <div className="section-heading">
      <h2 className="section-title">
        <MessageCircle size={18} /> Discord Bot Commands
      </h2>
      <span className="badge">Available in Discord</span>
    </div>
    <p className="muted command-note">Connected to the same live backend.</p>
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
