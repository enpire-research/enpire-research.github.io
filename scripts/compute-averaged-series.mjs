import { readFileSync, writeFileSync } from "fs";
import { load } from "js-yaml";

const DATA_DIR = process.env.ENPIRE_DATA_DIR ?? "data_source";

function runXY(run, mode) {
  const points = [];
  for (const point of run.points) {
    if (mode === "elapsed") {
      points.push([parseFloat(point.elapsed_hours), parseFloat(point.score)]);
    } else {
      points.push([
        parseFloat(point.wall_time_minutes) / 60.0,
        parseFloat(point.success_rate_percent) / 100.0,
      ]);
    }
  }
  return points.sort((a, b) => a[0] - b[0]);
}

function runValuesOnGrid(points, grid) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return grid.map((g) => {
    if (g <= xs[0]) return ys[0];
    if (g >= xs[xs.length - 1]) return ys[ys.length - 1];
    for (let i = 0; i < xs.length - 1; i++) {
      if (g >= xs[i] && g <= xs[i + 1]) {
        const t = (g - xs[i]) / (xs[i + 1] - xs[i]);
        return ys[i] + t * (ys[i + 1] - ys[i]);
      }
    }
    return ys[ys.length - 1];
  });
}

function averagedSeries(path, mode, xMax, samples = 241) {
  const data = load(readFileSync(path, "utf8"));
  const grid = Array.from({ length: samples }, (_, i) => (i / (samples - 1)) * xMax);
  const result = [];
  for (const method of data.methods) {
    const runs = method.runs
      .filter((run) => run.points && run.points.length > 0)
      .map((run) => runXY(run, mode));
    if (runs.length === 0) continue;
    const values = runs.map((run) => runValuesOnGrid(run, grid));
    const mean = grid.map((_, i) => values.reduce((sum, v) => sum + v[i], 0) / values.length);
    const sem = values.length > 1
      ? grid.map((_, i) => {
          const vals = values.map((v) => v[i]);
          const m = mean[i];
          const variance = vals.reduce((sum, v) => sum + (v - m) ** 2, 0) / (vals.length - 1);
          return Math.sqrt(variance / vals.length);
        })
      : grid.map(() => 0);
    result.push({ name: method.name, runs, grid, mean, sem });
  }
  return result;
}

const LABELS = {
  codex: "Codex",
  "claude code": "Claude",
  claude: "Claude",
  kimi: "Kimi",
};

const COLORS = {
  codex: "#6b73ff",
  "claude code": "#d97759",
  claude: "#d97759",
  kimi: "#a0a0a0",
};

const pusht = averagedSeries(`${DATA_DIR}/pusht_codex_claude_kimi.yaml`, "elapsed", 8.0);
const pin = averagedSeries(`${DATA_DIR}/pin_codex_claude_kimi.yaml`, "wall", 4.0);

const output = {
  pusht: pusht.map((s) => ({
    name: s.name,
    label: LABELS[s.name] || s.name,
    color: COLORS[s.name] || "#999",
    runs: s.runs,
    grid: s.grid,
    mean: s.mean,
    sem: s.sem,
  })),
  pin: pin.map((s) => ({
    name: s.name,
    label: LABELS[s.name] || s.name,
    color: COLORS[s.name] || "#999",
    runs: s.runs,
    grid: s.grid,
    mean: s.mean,
    sem: s.sem,
  })),
};

writeFileSync("src/data/autoEnvBenchAveraged.json", JSON.stringify(output, null, 2));
console.log("Written src/data/autoEnvBenchAveraged.json");
