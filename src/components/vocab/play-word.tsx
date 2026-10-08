"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlayWord({ src }: { src: string }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label="Play" onClick={() => new Audio(src).play()}>
      <Volume2 />
    </Button>
  );
}
