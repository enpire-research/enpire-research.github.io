import raw from "./agentResourceUtilization.json";

export type UtilizationRow = {
  agentCount: number;
  robotMean: number;
  robotStd: number;
  gpuMean: number;
  gpuStd: number;
};

export type TokenRateRow = {
  agentCount: number;
  mean: number;
  std: number;
};

export type TokensToSuccessRow = {
  agentCount: number;
  meanTokens: number;
  stdTokens: number;
  successHours: number;
};

export type AgentResourceData = {
  utilization: UtilizationRow[];
  tokenRate: TokenRateRow[];
  tokensToSuccess: TokensToSuccessRow[];
};

export const agentResourceData: AgentResourceData = raw as AgentResourceData;
