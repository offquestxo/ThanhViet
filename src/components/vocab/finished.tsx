import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparrow } from "@/components/mascot/sparrow";

export function Finished({
  score,
  total,
  backHref,
  onRestart,
}: {
  score?: number;
  total?: number;
  backHref: string;
  onRestart: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 py-8 text-center">
      <Sparrow mood="happy" size={88} />
      <p className="text-xl font-semibold">Nice work!</p>
      {score !== undefined && total !== undefined && (
        <p className="text-muted-foreground">
          {score} / {total} right
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onRestart}>
          Again
        </Button>
        <Button asChild>
          <Link href={backHref}>Back to words</Link>
        </Button>
      </div>
    </div>
  );
}
