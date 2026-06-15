import json
import os
import yaml
import numpy as np
from pathlib import Path

DATA_DIR = Path(os.environ.get("ENPIRE_DATA_DIR", "data_source"))

def run_xy(run, mode):
    points = []
    for point in run["points"]:
        if mode == "elapsed":
            points.append((float(point["elapsed_hours"]), float(point["score"])))
        else:
            points.append((
                float(point["wall_time_minutes"]) / 60.0,
                float(point["success_rate_percent"]) / 100.0,
            ))
    return sorted(points)

def run_values_on_grid(points, grid):
    xs = np.array([p[0] for p in points], dtype=float)
    ys = np.array([p[1] for p in points], dtype=float)
    return np.interp(grid, xs, ys, left=ys[0], right=ys[-1])

def averaged_series(path, mode, x_max, samples=241):
    data = yaml.safe_load(open(path))
    grid = np.linspace(0.0, x_max, samples)
    result = []
    for method in data["methods"]:
        runs = [run_xy(run, mode) for run in method["runs"] if run.get("points")]
        if not runs:
            continue
        values = np.vstack([run_values_on_grid(run, grid) for run in runs])
        mean = values.mean(axis=0)
        if values.shape[0] > 1:
            sem = values.std(axis=0, ddof=1) / np.sqrt(values.shape[0])
        else:
            sem = np.zeros_like(mean)
        result.append({
            "name": method["name"],
            "runs": runs,
            "grid": grid.tolist(),
            "mean": mean.tolist(),
            "sem": sem.tolist(),
        })
    return result

LABELS = {
    "codex": "Codex",
    "claude code": "Claude",
    "claude": "Claude",
    "kimi": "Kimi",
}

COLORS = {
    "codex": "#6b73ff",
    "claude code": "#d97759",
    "claude": "#d97759",
    "kimi": "#a0a0a0",
}

pusht = averaged_series(DATA_DIR / "pusht_codex_claude_kimi.yaml", "elapsed", 8.0)
pin = averaged_series(DATA_DIR / "pin_codex_claude_kimi.yaml", "wall", 4.0)

output = {
    "pusht": [
        {
            "name": s["name"],
            "label": LABELS.get(s["name"], s["name"]),
            "color": COLORS.get(s["name"], "#999"),
            "runs": s["runs"],
            "grid": s["grid"],
            "mean": s["mean"],
            "sem": s["sem"],
        }
        for s in pusht
    ],
    "pin": [
        {
            "name": s["name"],
            "label": LABELS.get(s["name"], s["name"]),
            "color": COLORS.get(s["name"], "#999"),
            "runs": s["runs"],
            "grid": s["grid"],
            "mean": s["mean"],
            "sem": s["sem"],
        }
        for s in pin
    ],
}

json.dump(output, open("src/data/autoEnvBenchAveraged.json", "w"), indent=2)
print("Written src/data/autoEnvBenchAveraged.json")
