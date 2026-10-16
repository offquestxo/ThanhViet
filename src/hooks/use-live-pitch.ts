"use client";

import { useEffect, useRef, useState } from "react";
import { detectPitch, toneDeflection, type PitchPoint } from "@/lib/pitch";
import type { ToneKey } from "@/lib/tones";

const FRAME = 2048; // ~43 ms at 48 kHz — enough for 70 Hz voices
const EVERY_MS = 25; // ~40 pitch estimates per second (a short word is only ~0.3 s)

type AudioContextCtor = typeof AudioContext;

/**
 * Live needle while the learner speaks. Listens to the recorder's own
 * microphone stream through Web Audio (an AnalyserNode — nothing is
 * recorded or sent anywhere by this hook) and turns the pitch trace so far
 * into a needle position with toneDeflection().
 *
 * iPhone Safari only lets Web Audio start inside a user gesture, so
 * `prime()` must be called synchronously from the mic tap, before any
 * await; `attach(stream)` connects the stream once the recorder has it.
 */
export function useLivePitch(tone: ToneKey) {
  const [needle, setNeedle] = useState<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const traceRef = useRef<PitchPoint[]>([]);

  const prime = () => {
    const Ctor: AudioContextCtor | undefined =
      typeof window === "undefined"
        ? undefined
        : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext);
    if (!Ctor) return;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = new Ctor();
    void ctxRef.current.resume().catch(() => {});
  };

  const attach = (stream: MediaStream | null) => {
    const ctx = ctxRef.current;
    if (!ctx || !stream) return;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FRAME;
    source.connect(analyser); // not connected to the speakers: no echo
    sourceRef.current = source;
    traceRef.current = [];
    setNeedle(null);

    const buf = new Float32Array(FRAME);
    const t0 = performance.now();
    let last = 0;
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (now - last < EVERY_MS) return;
      last = now;
      analyser.getFloatTimeDomainData(buf);
      traceRef.current.push({ tMs: now - t0, hz: detectPitch(buf, ctx.sampleRate) });
      const v = toneDeflection(tone, traceRef.current);
      if (v !== null) setNeedle((prev) => (prev === null ? v : prev + (v - prev) * 0.35)); // light smoothing
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  };

  const clear = () => setNeedle(null);

  // Leaving the screen mid-recording (or switching words) must not leave
  // the microphone analyser running.
  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      sourceRef.current?.disconnect();
      ctxRef.current?.close().catch(() => {});
    },
    []
  );

  return { needle, prime, attach, stop, clear };
}
