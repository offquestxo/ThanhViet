import { toneTunerItems } from "@/lib/content";
import { ToneTunerClient } from "./tone-tuner-client";

export const metadata = { title: "Tone Tuner · Thanh Việt" };

export default async function ToneTunerPage({ searchParams }: PageProps<"/tone-tuner">) {
  const { item } = await searchParams;
  const initialId = typeof item === "string" ? item : undefined;
  return <ToneTunerClient items={toneTunerItems} initialId={initialId} />;
}
