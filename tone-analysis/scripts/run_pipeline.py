#!/usr/bin/env python
"""
Runs the extraction pipeline directly (no HTTP server) against one or
more audio files and prints a clear, human-readable summary of each
step's output: validation, segmentation, pitch contour, duration, and
phonation features. Also saves a waveform + pitch-contour + intensity
plot per file to output/.

Usage (from tone-analysis/, with the venv active):
    python scripts/run_pipeline.py                       # all files in sample_audio/
    python scripts/run_pipeline.py path/to/one_file.wav   # a specific file
"""

from __future__ import annotations

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")  # no display needed, just PNG output
import matplotlib.pyplot as plt
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from tone_analysis.pipeline import run_pipeline  # noqa: E402
from tone_analysis.schemas import AnalysisResult  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SAMPLE_DIR = ROOT / "sample_audio"
OUT_DIR = ROOT / "output"


def print_report(result: AnalysisResult) -> None:
    print("=" * 72)
    print(f"FILE: {result.source_filename}")
    print("=" * 72)

    v = result.validation
    status = "OK" if v.ok else "FAILED"
    print(f"[1] Validation: {status}")
    print(
        f"    format={v.format} sr={v.sample_rate_hz}Hz channels={v.channels} "
        f"duration={v.duration_s:.3f}s peak={v.peak_amplitude:.3f} rms={v.rms_dbfs:.1f}dBFS"
    )
    for issue in v.issues:
        print(f"    [{issue.severity.upper()}] {issue.code}: {issue.message}")

    if not v.ok:
        print("    -> stopped here; downstream steps did not run.\n")
        return

    s = result.segmentation
    print(f"\n[2] Segmentation ({s.method}):")
    print(f"    trimmed region:  {s.trimmed_start_s:.3f}s - {s.trimmed_end_s:.3f}s")
    print(f"    nucleus region:  {s.nucleus_start_s:.3f}s - {s.nucleus_end_s:.3f}s")

    p = result.pitch
    print("\n[3] Pitch (F0):")
    print(
        f"    voiced frames={p.voiced_frame_count} unvoiced frames={p.unvoiced_frame_count} "
        f"median={p.median_voiced_f0_hz and round(p.median_voiced_f0_hz, 1)}Hz "
        f"range=[{p.min_voiced_f0_hz and round(p.min_voiced_f0_hz, 1)}, "
        f"{p.max_voiced_f0_hz and round(p.max_voiced_f0_hz, 1)}]Hz"
    )
    contour_str = " ".join(
        "--" if f.f0_hz is None else f"{f.f0_hz:.0f}" for f in p.frames
    )
    print(f"    contour (Hz, '--'=no pitch candidate): {contour_str}")

    d = result.duration
    print("\n[4] Duration:")
    print(
        f"    segment={d.segment_duration_s:.3f}s voiced={d.voiced_duration_s:.3f}s "
        f"voiced_fraction={d.voiced_fraction:.2f}"
    )

    ph = result.phonation
    print("\n[5] Phonation:")
    print(
        f"    jitter_local={ph.jitter_local and round(ph.jitter_local, 4)} "
        f"jitter_rap={ph.jitter_rap and round(ph.jitter_rap, 4)}"
    )
    print(
        f"    shimmer_local={ph.shimmer_local and round(ph.shimmer_local, 4)} "
        f"shimmer_apq11={ph.shimmer_apq11 and round(ph.shimmer_apq11, 4)}"
    )
    print(f"    HNR={ph.hnr_db and round(ph.hnr_db, 2)} dB")
    if ph.voice_breaks:
        print(f"    voice_breaks ({len(ph.voice_breaks)}, longest={ph.longest_voice_break_s:.3f}s):")
        for b in ph.voice_breaks:
            print(f"      {b.start_s:.3f}s - {b.end_s:.3f}s ({b.duration_s:.3f}s)")
    else:
        print("    voice_breaks: none")
    print()


def save_plot(result: AnalysisResult, wav_path: Path) -> None:
    import soundfile as sf

    samples, sr = sf.read(wav_path, dtype="float64", always_2d=False)
    times = np.arange(len(samples)) / sr

    fig, (ax_wave, ax_pitch) = plt.subplots(2, 1, figsize=(10, 6), sharex=True)

    ax_wave.plot(times, samples, linewidth=0.5, color="steelblue")
    ax_wave.set_ylabel("Amplitude")
    ax_wave.set_title(f"{result.source_filename}")
    if result.segmentation:
        for label, t in [
            ("trim", result.segmentation.trimmed_start_s),
            ("trim", result.segmentation.trimmed_end_s),
        ]:
            ax_wave.axvline(t, color="gray", linestyle=":", linewidth=1)
        ax_wave.axvspan(
            result.segmentation.nucleus_start_s,
            result.segmentation.nucleus_end_s,
            color="orange",
            alpha=0.15,
            label="nucleus",
        )
        ax_wave.legend(loc="upper right", fontsize=8)

    if result.pitch:
        nucleus_start = result.segmentation.nucleus_start_s
        pitch_times = [nucleus_start + f.time_s for f in result.pitch.frames]
        pitch_vals = [f.f0_hz for f in result.pitch.frames]
        ax_pitch.plot(pitch_times, pitch_vals, "o-", markersize=3, color="crimson", linewidth=1)
        ax_pitch.set_ylabel("F0 (Hz)")
        ax_pitch.set_xlabel("Time (s)")
        ax_pitch.set_title("Pitch contour (gaps = no pitch candidate, preserved not interpolated)")
        if result.phonation:
            for b in result.phonation.voice_breaks:
                ax_pitch.axvspan(
                    nucleus_start + b.start_s, nucleus_start + b.end_s, color="purple", alpha=0.2
                )

    fig.tight_layout()
    OUT_DIR.mkdir(exist_ok=True)
    out_path = OUT_DIR / f"{wav_path.stem}.png"
    fig.savefig(out_path, dpi=120)
    plt.close(fig)
    print(f"    plot saved: {out_path.relative_to(ROOT)}")


def main() -> None:
    args = sys.argv[1:]
    if args:
        files = [Path(a) for a in args]
    else:
        files = sorted(SAMPLE_DIR.glob("*.wav"))
        if not files:
            print(f"No .wav files found in {SAMPLE_DIR}/. Run generate_test_audio.py first.")
            return

    for wav_path in files:
        file_bytes = wav_path.read_bytes()
        result = run_pipeline(file_bytes, wav_path.name)
        print_report(result)
        if result.validation.ok:
            save_plot(result, wav_path)
        print()


if __name__ == "__main__":
    main()
