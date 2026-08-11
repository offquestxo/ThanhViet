"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures each user/request gets its own QueryClient instance
  // rather than sharing one across requests on the server.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required by shadcn's tooltip component (Stage 2 nav uses it) —
          added per the CLI's own post-install instructions. */}
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}
