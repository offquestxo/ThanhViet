"""
Step 1 — audio validation.

Checks format, sample rate, duration, channel count, clipping, and
overall signal presence (silence check) before anything downstream runs.
Returns the decoded mono float64 samples alongside the result so callers
don't have to re-read the file.
"""

from __future__ import annotations

import io

import numpy as np
import soundfile as sf

from . import config
from .schemas import ValidationIssue, ValidationResult


class UnreadableAudioError(Exception):
    """Raised when the file can't even be decoded (not a validation
    *result* — there's nothing to report structured issues about)."""


def _rms_dbfs(samples: np.ndarray) -> float:
    rms = np.sqrt(np.mean(np.square(samples))) if samples.size else 0.0
    if rms <= 0:
        return -np.inf
    return 20 * np.log10(rms)


def load_and_validate(file_bytes: bytes, filename: str) -> tuple[ValidationResult, np.ndarray, int]:
    """Returns (result, mono_samples_float64, sample_rate).

    mono_samples is always returned (downmixed if the source was
    multi-channel) so downstream stages have one consistent shape to
    work with, even when validation reports issues rather than hard
    failures.
    """
    try:
        with sf.SoundFile(io.BytesIO(file_bytes)) as f:
            fmt = f.format  # e.g. "WAV", "FLAC"
            sample_rate = f.samplerate
            channels = f.channels
            samples = f.read(dtype="float64", always_2d=True)  # (n_frames, n_channels)
    except Exception as exc:  # noqa: BLE001 - deliberately broad, re-raised as a domain error
        raise UnreadableAudioError(f"Could not decode '{filename}' as audio: {exc}") from exc

    mono = samples.mean(axis=1)
    duration_s = len(mono) / sample_rate if sample_rate else 0.0
    peak = float(np.max(np.abs(mono))) if mono.size else 0.0
    rms_dbfs = _rms_dbfs(mono)

    issues: list[ValidationIssue] = []

    if fmt not in config.SUPPORTED_FORMATS:
        issues.append(
            ValidationIssue(
                severity="error",
                code="unsupported_format",
                message=f"Format '{fmt}' is not in the supported set {sorted(config.SUPPORTED_FORMATS)}.",
            )
        )

    if sample_rate < config.MIN_SAMPLE_RATE_HZ:
        issues.append(
            ValidationIssue(
                severity="error",
                code="sample_rate_too_low",
                message=(
                    f"Sample rate {sample_rate} Hz is below the {config.MIN_SAMPLE_RATE_HZ} Hz "
                    "minimum needed for reliable F0/formant analysis."
                ),
            )
        )
    elif sample_rate < config.RECOMMENDED_SAMPLE_RATE_HZ:
        issues.append(
            ValidationIssue(
                severity="warning",
                code="sample_rate_below_recommended",
                message=(
                    f"Sample rate {sample_rate} Hz works but is below the recommended "
                    f"{config.RECOMMENDED_SAMPLE_RATE_HZ} Hz."
                ),
            )
        )

    if duration_s < config.MIN_DURATION_S:
        issues.append(
            ValidationIssue(
                severity="error",
                code="too_short",
                message=f"Duration {duration_s:.3f}s is below the {config.MIN_DURATION_S}s minimum.",
            )
        )
    elif duration_s > config.MAX_DURATION_S:
        issues.append(
            ValidationIssue(
                severity="error",
                code="too_long",
                message=f"Duration {duration_s:.3f}s exceeds the {config.MAX_DURATION_S}s maximum for a single syllable take.",
            )
        )

    if channels > 1:
        issues.append(
            ValidationIssue(
                severity="warning",
                code="downmixed_to_mono",
                message=f"Source had {channels} channels; downmixed to mono by averaging.",
            )
        )

    if peak >= config.CLIPPING_AMPLITUDE_THRESHOLD:
        clipped_fraction = float(
            np.mean(np.abs(mono) >= config.CLIPPING_AMPLITUDE_THRESHOLD)
        )
        if clipped_fraction > config.CLIPPING_SAMPLE_FRACTION_LIMIT:
            issues.append(
                ValidationIssue(
                    severity="error",
                    code="clipping",
                    message=f"{clipped_fraction * 100:.3f}% of samples are at/near full scale — likely clipped.",
                )
            )
        else:
            issues.append(
                ValidationIssue(
                    severity="warning",
                    code="peak_near_full_scale",
                    message="Peak amplitude is near full scale but clipped-sample fraction is small.",
                )
            )

    if rms_dbfs < config.SILENCE_RMS_DBFS_THRESHOLD:
        issues.append(
            ValidationIssue(
                severity="error",
                code="likely_silent",
                message=f"RMS level {rms_dbfs:.1f} dBFS is below {config.SILENCE_RMS_DBFS_THRESHOLD} dBFS — likely silence or no speech captured.",
            )
        )

    ok = not any(issue.severity == "error" for issue in issues)

    result = ValidationResult(
        ok=ok,
        format=fmt,
        sample_rate_hz=sample_rate,
        channels=channels,
        duration_s=duration_s,
        peak_amplitude=peak,
        rms_dbfs=rms_dbfs if np.isfinite(rms_dbfs) else -999.0,
        issues=issues,
    )
    return result, mono, sample_rate
