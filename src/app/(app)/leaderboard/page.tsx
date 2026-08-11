import { Trophy } from "lucide-react";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export default function LeaderboardPage() {
  return (
    <ComingSoon
      title="Leaderboard"
      description="The group-wide leaderboard view exists in the database — this screen doesn't read it yet."
      icon={Trophy}
    />
  );
}
