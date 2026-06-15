import raw from "./autoEnvBenchFull.json";

export type RunPoint = [number, number];
export type ModelSeries = {
  name: string;
  label: string;
  color: string;
  runs: RunPoint[][];
  highlight_xs: number[];
  highlight_mean: number[];
  highlight_lower: number[];
  highlight_upper: number[];
  raw_scatter: RunPoint[];
};
export type ScalingSeries = {
  name: string;
  key: string;
  color: string;
  points: RunPoint[];
};
export type FullData = {
  pushtModel: ModelSeries[];
  pinModel: ModelSeries[];
  pushtScaling: ScalingSeries[];
  pinScaling: ScalingSeries[];
};

export const fullData: FullData = raw as FullData;
