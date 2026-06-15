// Per-frame verification verdicts for the Case 3 zip-tie reward panel.
// Aligned 1:1 with the 167 frames of ziptie-reward-bbox.mp4 / -seg.mp4 (15 fps).
// A portion of the REWARD=0 frames in the final 2/5 are dropped to trim dead time,
// and the first 26 static frames are trimmed from the head.
// 1 = pass / success, 0 = fail. Derived from final_result/judgment.mp4.

const decode = (bits: string): number[] => bits.split("").map((bit) => Number(bit));

export const ziptieRewardFrameRate = 15;

export const ziptieTopVerdicts = decode("00000000000000000000000000000000000000000000000000000000010000000000000000000000000000001000000000000000000000000000000000000000111111111111111111111011011100000000000");
export const ziptieRightVerdicts = decode("00000000000000000000000000000000000000000000000000000000000000000000000000000001111111100000000000000000000000000000000000000111111111111111111111000000000000000000000");
const rawFinalReward = decode("00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000111111111111111111111011011000000000000");

// Smooth out single-frame blips: the overall reward only reads 1 when the raw
// verdict holds for at least two consecutive frames.
export const ziptieFinalReward = rawFinalReward.map((value, index) =>
  value === 1 && (rawFinalReward[index - 1] === 1 || rawFinalReward[index + 1] === 1) ? 1 : 0,
);

export const ziptieRewardFrameCount = 167;
