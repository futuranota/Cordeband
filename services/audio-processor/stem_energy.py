import wave
from pathlib import Path

import numpy as np

from config import RMS_THRESHOLD


def wav_rms(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        frames = wf.readframes(wf.getnframes())
        sample_width = wf.getsampwidth()
        if sample_width == 2:
            pcm = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
        else:
            pcm = np.frombuffer(frames, dtype=np.int8).astype(np.float32) / 128.0
    if pcm.size == 0:
        return 0.0
    return float(np.sqrt(np.mean(pcm ** 2)))


def filter_instruments_by_energy(
    energies: dict[str, float],
    threshold: float = RMS_THRESHOLD,
) -> list[str]:
    return [
        inst
        for inst, rms in sorted(energies.items(), key=lambda item: item[1], reverse=True)
        if rms >= threshold
    ]
