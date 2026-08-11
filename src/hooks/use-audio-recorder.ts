"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Minimal mic-recording hook for Section 5.4's "Speak" step — records via
 * the browser's MediaRecorder API, exposes a local blob URL for playback,
 * and nothing else. No upload, no persistence, no scoring: the recording
 * is discarded (URL revoked) once the component unmounts or resets. This
 * is deliberately NOT the Tone Tuner pipeline — no audio leaves the
 * browser, no backend/FastAPI service involved. See AGENTS.md/spec 8.4:
 * that engine is Phase 1b, gated on reference data that doesn't exist yet.
 *
 * Not persisting the recording is a scope choice, not a spec requirement —
 * the spec doesn't say either way. Flagging it here rather than silently
 * deciding: revisit if "Speak" ever needs a history, not just in-the-moment
 * self-comparison.
 */
export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("Microphone recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setError("Couldn't access the microphone — you can skip this step.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }, []);

  return { isRecording, audioUrl, error, startRecording, stopRecording, reset };
}
