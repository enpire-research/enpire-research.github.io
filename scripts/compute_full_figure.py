import json
import os
import yaml
import numpy as np
from pathlib import Path

DATA_DIR = Path(os.environ.get("ENPIRE_DATA_DIR", "data_source"))

def load_yaml(path):
    return yaml.safe_load(open(path))

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
    data = load_yaml(path)
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

def highlight_indices(grid, x_max, count=4):
    anchors = np.linspace(0.0, x_max, count)
    return [int(np.abs(np.array(grid) - anchor).argmin()) for anchor in anchors]

def point_key(point):
    x, y = point
    return (round(float(x), 8), round(float(y), 8))

def split_overlapping_points(xs, ys, occupied):
    kept = []
    for x, y in zip(xs, ys):
        if point_key((x, y)) in occupied:
            continue
        kept.append((x, y))
    return kept

def process_model_compare(path, mode, x_max):
    series = averaged_series(path, mode, x_max)
    result = []
    for item in series:
        grid = item["grid"]
        mean = item["mean"]
        sem = item["sem"]
        lower = np.clip(np.array(mean) - np.array(sem), 0, 1).tolist()
        upper = np.clip(np.array(mean) + np.array(sem), 0, 1).tolist()
        idx = highlight_indices(grid, x_max, 4)
        
        highlight_xs = [grid[i] for i in idx]
        mean_sample = [mean[i] for i in idx]
        lower_sample = [lower[i] for i in idx]
        upper_sample = [upper[i] for i in idx]
        highlight_keys = {point_key(point) for point in zip(highlight_xs, mean_sample)}
        
        # Split raw scatter to avoid overlapping with highlight points
        raw_scatter = []
        for run in item["runs"]:
            run_xs = [p[0] for p in run if p[0] <= x_max]
            run_ys = [p[1] for p in run if p[0] <= x_max]
            if not run_xs:
                continue
            # raw run line points
            raw_scatter.extend(list(zip(run_xs, run_ys)))
        
        result.append({
            "name": item["name"],
            "runs": item["runs"],
            "grid": grid,
            "mean": mean,
            "sem": sem,
            "lower": lower,
            "upper": upper,
            "highlight_xs": highlight_xs,
            "highlight_mean": mean_sample,
            "highlight_lower": lower_sample,
            "highlight_upper": upper_sample,
            "raw_scatter": raw_scatter,
        })
    return result

def progressive_best(points, include_zero=True):
    by_time = {}
    for elapsed, score in points:
        by_time[elapsed] = max(by_time.get(elapsed, float("-inf")), score)
    if include_zero:
        by_time[0.0] = max(by_time.get(0.0, float("-inf")), 0.0)
    best = None
    kept = []
    for elapsed in sorted(by_time):
        score = by_time[elapsed]
        if best is None or score > best:
            kept.append((elapsed, score))
            best = score
    return kept

def setup_points(setup):
    points = []
    for run in setup["runs"]:
        for point in run["points"]:
            points.append((float(point["elapsed_hours"]), float(point["score"])))
    return points

def method_points(methods, names):
    points = []
    for method in methods:
        if method["name"] not in names:
            continue
        for run in method["runs"]:
            for point in run["points"]:
                points.append((
                    float(point["wall_time_minutes"]) / 60.0,
                    float(point["success_rate_percent"]) / 100.0,
                ))
    return points

def shifted_points(points, hours):
    return [(x + hours, y) for x, y in points]

def process_pusht_scaling():
    model_data = load_yaml(DATA_DIR / "pusht_codex_claude_kimi.yaml")
    four = load_yaml(DATA_DIR / "pusht_4agent.yaml")["setups"][0]
    eight = load_yaml(DATA_DIR / "pusht_8agent.yaml")["setups"][0]
    codex = next(m for m in model_data["methods"] if m["name"] == "codex")
    codex_run3 = next(r for r in codex["runs"] if r["name"] == "run 3")
    
    return [
        {
            "name": "1-agent best",
            "key": "agent1",
            "points": [(float(p["elapsed_hours"]), float(p["score"])) for p in codex_run3["points"]],
        },
        {
            "name": "4-agent team best",
            "key": "agent4",
            "points": progressive_best(setup_points(four), include_zero=True),
        },
        {
            "name": "8-agent team best",
            "key": "agent8",
            "points": progressive_best(setup_points(eight), include_zero=True),
        },
    ]

def process_pin_scaling():
    four = load_yaml(DATA_DIR / "pin_4agent.yaml")
    eight = load_yaml(DATA_DIR / "pin_8agent.yaml")
    
    # 1-agent best
    single_points = method_points(four["methods"], {"claude"}) + method_points(eight["methods"], {"codex"})
    single_best = shifted_points(progressive_best(single_points, include_zero=False), 0.5)
    single_best.insert(0, (0.0, 0.0))
    
    four_run_names_env = os.environ.get("ENPIRE_PIN_4AGENT_METHODS", "")
    if four_run_names_env:
        four_run_names = {name.strip() for name in four_run_names_env.split(",") if name.strip()}
    else:
        four_run_names = {
            method["name"]
            for method in four["methods"]
            if method["name"] not in {"codex", "claude", "claude code", "codex agent team 4"}
        }
    eight_run_names = {m["name"] for m in eight["methods"] if m["name"] not in {"codex", "codex agent team 8"}}
    
    return [
        {
            "name": "1-agent best",
            "key": "agent1",
            "points": single_best,
        },
        {
            "name": "4-agent team best",
            "key": "agent4",
            "points": progressive_best(method_points(four["methods"], four_run_names), include_zero=True),
        },
        {
            "name": "8-agent team best",
            "key": "agent8",
            "points": progressive_best(method_points(eight["methods"], eight_run_names), include_zero=True),
        },
    ]

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
    "agent1": "#A1DF00",
    "agent4": "#82B500",
    "agent8": "#486600",
}

pusht_mc = process_model_compare(DATA_DIR / "pusht_codex_claude_kimi.yaml", "elapsed", 8.0)
pin_mc = process_model_compare(DATA_DIR / "pin_codex_claude_kimi.yaml", "wall", 4.0)
pusht_scale = process_pusht_scaling()
pin_scale = process_pin_scaling()

output = {
    "pushtModel": [
        {
            "name": s["name"],
            "label": LABELS.get(s["name"], s["name"]),
            "color": COLORS.get(s["name"], "#999"),
            "runs": s["runs"],
            "highlight_xs": s["highlight_xs"],
            "highlight_mean": s["highlight_mean"],
            "highlight_lower": s["highlight_lower"],
            "highlight_upper": s["highlight_upper"],
            "raw_scatter": s["raw_scatter"],
        }
        for s in pusht_mc
    ],
    "pinModel": [
        {
            "name": s["name"],
            "label": LABELS.get(s["name"], s["name"]),
            "color": COLORS.get(s["name"], "#999"),
            "runs": s["runs"],
            "highlight_xs": s["highlight_xs"],
            "highlight_mean": s["highlight_mean"],
            "highlight_lower": s["highlight_lower"],
            "highlight_upper": s["highlight_upper"],
            "raw_scatter": s["raw_scatter"],
        }
        for s in pin_mc
    ],
    "pushtScaling": [
        {
            "name": s["name"],
            "key": s["key"],
            "color": COLORS.get(s["key"], "#999"),
            "points": s["points"],
        }
        for s in pusht_scale
    ],
    "pinScaling": [
        {
            "name": s["name"],
            "key": s["key"],
            "color": COLORS.get(s["key"], "#999"),
            "points": s["points"],
        }
        for s in pin_scale
    ],
}

json.dump(output, open("src/data/autoEnvBenchFull.json", "w"), indent=2)
print("Written src/data/autoEnvBenchFull.json")
