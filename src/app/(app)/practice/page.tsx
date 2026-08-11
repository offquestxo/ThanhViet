import { PenLine } from "lucide-react";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export default function PracticePage() {
  return (
    <ComingSoon
      title="Practice"
      description="Workspace (Talk Practice) build hasn't started yet."
      icon={PenLine}
    />
  );
}
