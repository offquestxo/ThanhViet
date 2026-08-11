import { AudioWaveform } from "lucide-react";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export default function ToneTunerPage() {
  return (
    <ComingSoon
      title="Tone Tuner"
      description="Gated on Phase 1b's reference recordings — not built yet."
      icon={AudioWaveform}
    />
  );
}
