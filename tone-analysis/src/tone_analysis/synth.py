"""
Synthetic placeholder audio generator.

NOT real speech, NOT a substitute for the native-speaker recordings the
parallel recruiting effort will produce. This exists purely so the
extraction pipeline (validation -> segmentation -> pitch -> duration ->
phonation) has something mechanically realistic to run against before
real recordings exist: a source-filter (impulse-train-through-formant-
resonators) synthesis of a generic /a/-like vowel, carrying an F0 contour
shaped like each of the six pilot tones.

For ngaa and nang specifically, a "creaky region" is simulated by sharply
increasing glottal-pulse-timing jitter and randomly dropping pulses
within a sub-interval — a crude but real approximation of the irregular,
often partially-aperiodic glottal behavior of genuine glottalized tones.
This is what lets this pass demonstrate, mechanically, that the pipeline
preserves that irregularity (visible as pitch gaps / voice breaks /
elevated jitter) instead of smoothing it away — see pitch.py and
phonation.py docstrings.

Every filename and every WAV's metadata-adjacent naming makes clear
these are synthetic. Swap in real recordings once the parallel effort
produces them; nothing downstream should need to change to accept them
(same validation/format contract).
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from scipy.signal import lfilter

SAMPLE_RATE = 44_100

# Roughly cardinal-/a/-ish formants (Hz, bandwidth Hz) — not tuned to any
# particular speaker, just enough to give the impulse train real spectral
# shape instead of sounding like a buzzer.
FORMANTS = ((730.0, 80.0), (1090.0, 90.0), (2440.0, 120.0))


def _contour_fn(points: list[tuple[float, float]]):
    """points: [(t_fraction 0..1, f0_hz), ...] sorted by t_fraction."""

    def f(t_frac: float) -> float:
        t_frac = min(max(t_frac, 0.0), 1.0)
        for (t0, f0v), (t1, f1v) in zip(points, points[1:]):
            if t0 <= t_frac <= t1:
                if t1 == t0:
                    return f1v
                alpha = (t_frac - t0) / (t1 - t0)
                return f0v + alpha * (f1v - f0v)
        return points[-1][1]

    return f


@dataclass
class ToneSpec:
    name: str  # tone diacritic name, e.g. "ngang"
    label: str  # short description
    duration_s: float
    contour: list[tuple[float, float]]  # (t_fraction, f0_hz)
    creaky_regions: list[tuple[float, float]] = field(default_factory=list)  # (t_frac_start, t_frac_end)
    amplitude_envelope: list[tuple[float, float]] = field(
        default_factory=lambda: [(0.0, 0.0), (0.08, 1.0), (0.85, 1.0), (1.0, 0.0)]
    )


# Six pilot tones, per the standing brief (ngang/huyen/sac/hoi/nga/nang),
# one per Vietnamese tone. Contour shapes follow the standard Northern
# Vietnamese descriptions; nga and nang are the two deliberately
# glottalized ones.
TONE_SPECS: dict[str, ToneSpec] = {
    "ngang": ToneSpec(
        name="ngang",
        label="level (A1) - modal, roughly flat",
        duration_s=0.45,
        contour=[(0.0, 195.0), (1.0, 180.0)],
    ),
    "huyen": ToneSpec(
        name="huyen",
        label="low falling (A2) - modal",
        duration_s=0.50,
        contour=[(0.0, 185.0), (1.0, 105.0)],
    ),
    "sac": ToneSpec(
        name="sac",
        label="rising (B1) - modal, tense toward the end",
        duration_s=0.40,
        contour=[(0.0, 155.0), (1.0, 245.0)],
    ),
    "hoi": ToneSpec(
        name="hoi",
        label="dipping-rising curve (B2) - modal, no glottalization",
        duration_s=0.55,
        contour=[(0.0, 170.0), (0.45, 105.0), (1.0, 185.0)],
    ),
    "nga": ToneSpec(
        name="nga",
        label="rising, glottalized (C1) - creaky break mid-syllable",
        duration_s=0.55,
        contour=[(0.0, 175.0), (0.4, 150.0), (0.6, 210.0), (1.0, 260.0)],
        creaky_regions=[(0.38, 0.58)],
    ),
    "nang": ToneSpec(
        name="nang",
        label="low falling, glottalized, short (D1) - constricted toward the end",
        duration_s=0.30,
        contour=[(0.0, 160.0), (1.0, 90.0)],
        creaky_regions=[(0.55, 1.0)],
        # Real nang holds audible (if quieter, irregular/creaky) voicing
        # through most of the syllable, ending in a short final glottal
        # stop — not a smooth fade to nothing. A continuous ramp-to-zero
        # across the whole creaky region is indistinguishable from
        # trailing silence to an intensity-based segmenter, which isn't a
        # segmentation bug so much as an inaccurate synthetic model;
        # fixed here by holding a real (reduced) plateau and only
        # dropping to silence in the last ~8%, where the actual glottal
        # closure belongs.
        amplitude_envelope=[(0.0, 0.0), (0.1, 1.0), (0.5, 0.85), (0.85, 0.5), (0.92, 0.5), (1.0, 0.0)],
    ),
}


def _resonator_ba(freq: float, bandwidth: float, sr: int) -> tuple[np.ndarray, np.ndarray]:
    r = np.exp(-np.pi * bandwidth / sr)
    theta = 2 * np.pi * freq / sr
    a1 = 2 * r * np.cos(theta)
    a2 = -(r**2)
    b0 = 1.0 - a1 - a2  # unity DC gain; good enough for a placeholder source
    b = np.array([b0])
    a = np.array([1.0, -a1, -a2])
    return b, a


def synthesize_tone(spec: ToneSpec, sr: int = SAMPLE_RATE, seed: int | None = None) -> np.ndarray:
    rng = np.random.default_rng(seed)
    contour = _contour_fn(spec.contour)
    envelope = _contour_fn(spec.amplitude_envelope)

    n_samples = int(spec.duration_s * sr)
    excitation = np.zeros(n_samples)

    t = 0.0
    base_jitter = 0.006
    creaky_jitter = 0.05
    base_amplitude = 0.85

    while t < spec.duration_s:
        t_frac = t / spec.duration_s
        f0 = contour(t_frac)
        is_creaky = any(r0 <= t_frac <= r1 for r0, r1 in spec.creaky_regions)

        jitter_sd = creaky_jitter if is_creaky else base_jitter
        period = (1.0 / f0) * (1.0 + rng.normal(0.0, jitter_sd))
        if is_creaky:
            # Real creaky voice isn't just "noisy periodic" — it's
            # characterized by irregular period-doubling/halving
            # (diplophonia) that specifically defeats autocorrelation-
            # based pitch trackers, which need several consistent periods
            # in a window to lock onto a candidate. A uniform jitter bump
            # alone is still trackable; this bimodal multiplier is what
            # actually produces real voice breaks downstream.
            period *= rng.choice([0.5, 1.0, 1.0, 1.9, 2.4])
        period = max(period, 1.0 / 500.0)  # never exceed pitch ceiling
        t += period

        if t >= spec.duration_s:
            break

        # Creaky/glottalized regions: real irregular glottal pulsing
        # includes both perturbed timing AND occasional missed/doubled
        # closures. Simulated here as a random pulse drop.
        if is_creaky and rng.random() < 0.35:
            continue

        shimmer_db = rng.normal(0.0, 0.9 if is_creaky else 0.5)
        amp = base_amplitude * (10 ** (shimmer_db / 20.0)) * envelope(t_frac)
        if is_creaky:
            amp *= rng.uniform(0.15, 0.55)  # creak is typically quieter/irregular in amplitude too

        idx = int(t * sr)
        if 0 <= idx < n_samples:
            excitation[idx] += amp

    signal = excitation.copy()
    for freq, bw in FORMANTS:
        b, a = _resonator_ba(freq, bw, sr)
        signal = lfilter(b, a, signal)

    # Breath noise floor for a non-infinite, non-zero HNR — real voice
    # is never perfectly harmonic.
    noise = rng.normal(0.0, 1.0, n_samples) * 0.01 * base_amplitude
    times = np.arange(n_samples) / sr
    env = np.array([envelope(t_i / spec.duration_s) for t_i in times])
    signal = signal + noise * env

    peak = np.max(np.abs(signal)) if signal.size else 0.0
    if peak > 0:
        signal = signal * (0.7 / peak)

    return signal.astype(np.float64)
