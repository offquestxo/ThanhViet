import { User } from "lucide-react";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export default function ProfilePage() {
  return (
    <ComingSoon
      title="Profile"
      description="Streak calendar, badges, and accuracy history aren't built yet."
      icon={User}
    />
  );
}
