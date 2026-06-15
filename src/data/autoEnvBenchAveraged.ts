import raw from "./autoEnvBenchAveraged.json";

export type RunPoint = [number, number];
export type AveragedSeries = {
  name: string;
  label: string;
  color: string;
  runs: RunPoint[][];
  grid: number[];
  mean: number[];
  sem: number[];
};

export type AveragedData = {
  pusht: AveragedSeries[];
  pin: AveragedSeries[];
};

export const averagedData: AveragedData = raw as AveragedData;
