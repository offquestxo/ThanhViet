import { History } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { CardContent } from "@/components/ui/card";

// No per-user recent-activity query exists anywhere in the app yet
// (user_chunk_progress isn't read on this page or any other). An honest
// empty state, not a row of invented "recently practiced" entries.
export function RecentlyPracticed() {
  return (
    <AppCard>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <History className="size-6 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">
          Nothing practiced yet — this fills in once real progress tracking lands.
        </p>
      </CardContent>
    </AppCard>
  );
}
