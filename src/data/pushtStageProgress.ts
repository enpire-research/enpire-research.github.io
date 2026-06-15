export type PushTStageKey = "first_move" | "range_ok" | "orientation_ok" | "first_success";

export type PushTStage = {
  key: PushTStageKey;
  label: string;
  saturation: number;
};

export type PushTStageMilestone = {
  key: PushTStageKey;
  elapsedMinutes: number;
  elapsedLabel: string;
};

export type PushTStageRun = {
  key: "codex" | "nmmm" | "nmmm_blind";
  label: string;
  sublabel?: string;
  color: string;
  firstSuccessStdMinutes: number;
  milestones: PushTStageMilestone[];
};

export const pushTStageProgress = {
  stageOrder: ["first_move", "range_ok", "orientation_ok", "first_success"] as PushTStageKey[],
  stages: [
    { key: "first_move", label: "First move", saturation: 0.35 },
    { key: "range_ok", label: "Range ok", saturation: 0.55 },
    { key: "orientation_ok", label: "Orientation ok", saturation: 0.75 },
    { key: "first_success", label: "First success", saturation: 1 },
  ] satisfies PushTStage[],
  runs: [
    {
      key: "codex",
      label: "Codex",
      sublabel: "w/ native vision",
      color: "#6b73ff",
      firstSuccessStdMinutes: 10,
      milestones: [
        { key: "first_move", elapsedMinutes: 25.2333, elapsedLabel: "25:14" },
        { key: "range_ok", elapsedMinutes: 37.7833, elapsedLabel: "37:47" },
        { key: "orientation_ok", elapsedMinutes: 54.6667, elapsedLabel: "54:40" },
        { key: "first_success", elapsedMinutes: 54.6667, elapsedLabel: "54:40" },
      ],
    },
    {
      key: "nmmm",
      label: "Codex",
      sublabel: "w/ VLM as vision tool",
      color: "#f2c84b",
      firstSuccessStdMinutes: 21,
      milestones: [
        { key: "first_move", elapsedMinutes: 13.3167, elapsedLabel: "13:19" },
        { key: "range_ok", elapsedMinutes: 20.0333, elapsedLabel: "20:02" },
        { key: "orientation_ok", elapsedMinutes: 78.1167, elapsedLabel: "78:07" },
        { key: "first_success", elapsedMinutes: 99.1833, elapsedLabel: "99:11" },
      ],
    },
    {
      key: "nmmm_blind",
      label: "Codex",
      sublabel: "w/ GoFE vision",
      color: "#486600",
      firstSuccessStdMinutes: 15,
      milestones: [
        { key: "first_move", elapsedMinutes: 13.2333, elapsedLabel: "13:14" },
        { key: "range_ok", elapsedMinutes: 13.2333, elapsedLabel: "13:14" },
        { key: "orientation_ok", elapsedMinutes: 72.3167, elapsedLabel: "72:19" },
        { key: "first_success", elapsedMinutes: 72.3167, elapsedLabel: "72:19" },
      ],
    },
  ] satisfies PushTStageRun[],
};
