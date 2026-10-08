"use client";

import { useCallback, useRef, useState } from "react";

// Container the browser can actually produce. Chrome/Firefox/Android record
// webm/opus; Safari (iOS + macOS) records mp4/AAC. Labelling a Safari
// recording "audio/webm" (as this hook used to) is simply wrong — the
// recorder's real type is used instead.
const PREFERRED_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return undefined;
  return PREFERRED_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

export type RecorderErrorKind = "unsupported" | "permission_denied" | "unavailable";

export type StartResult = { ok: true } | { ok: false; kind: RecorderErrorKind; message: string };

/**
 * Mic-recording hook. Records via the browser's MediaRecorder API and
 * exposes both a local playback URL and the recording itself (`blob`).
 *
 * The lesson "Speak" step only plays the recording back locally — nothing
 * leaves the browser there. The Tone Tuner uploads `blob` to the app's own
 * server route for analysis (see /api/tone/analyze); that's the only caller
 * that sends audio anywhere, and it says so on its page.
 */
export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<RecorderErrorKind | null>(null);

  const fail = (kind: RecorderErrorKind, message: string): StartResult => {
    setErrorKind(kind);
    setError(message);
    return { ok: false, kind, message };
  };

  /** Resolves once recording has actually started (or failed, with why). */
  const startRecording = useCallback(async (): Promise<StartResult> => {
    setError(null);
    setErrorKind(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      return fail("unsupported", "Microphone recording isn't supported in this browser.");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const recorded = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        setBlob(recorded);
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(recorded);
        });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        stopResolverRef.current?.(recorded);
        stopResolverRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      return { ok: true };
    } catch (err) {
      const denied =
        err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
      return denied
        ? fail("permission_denied", "Microphone access was blocked. Allow it in your browser settings, then try again.")
        : fail("unavailable", "Couldn't access the microphone — you can skip this step.");
    }
  }, []);

  /** Stops recording; resolves with the finished recording (null if none). */
  const stopRecording = useCallback((): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current;
    setIsRecording(false);
    if (!recorder || recorder.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      stopResolverRef.current = resolve;
      recorder.stop();
    });
  }, []);

  const reset = useCallback(() => {
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setBlob(null);
    setError(null);
    setErrorKind(null);
  }, []);

  return { isRecording, audioUrl, blob, error, errorKind, startRecording, stopRecording, reset };
}
