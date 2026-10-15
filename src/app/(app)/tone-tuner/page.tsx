import { toneTunerItems } from "@/lib/content";
import { TONE_ORDER, type ToneKey } from "@/lib/tones";
import { ToneTunerClient } from "./tone-tuner-client";

export const metadata = { title: "Tone Tuner · Thanh Việt" };

export default async function ToneTunerPage({ searchParams }: PageProps<"/tone-tuner">) {
  const { item, tone } = await searchParams;
  const initialId = typeof item === "string" ? item : undefined;
  const initialTone = TONE_ORDER.includes(tone as ToneKey) ? (tone as ToneKey) : undefined;
  return <ToneTunerClient items={toneTunerItems} initialId={initialId} initialTone={initialTone} />;
}
