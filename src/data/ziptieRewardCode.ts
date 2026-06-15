// Simplified from the autoresearch-derived ziptie/reward/_compute_rew_rgb_trt.py:
// SAM3 segments the zip-tie parts in both camera views, simple mask geometry
// decides each camera's verdict, and the final binary reward is their AND.
export const ziptieRewardCodeFile = "ziptie/reward/compute_reward.py";

export const ziptieRewardCode = `"""Zip-tie reward: did the strap pass through the head?

SAM3 segments the zip-tie strap and head in the top and right camera
views; per-camera mask geometry yields two verdicts, fused by AND.
"""
import numpy as np
from scipy import ndimage
from detection import sam3_segment_multi_image, sam3_select_top1


def reward_from_top_cam(strap_dets, head_dets,
                        inter_frac=0.8, protrude_mult=3.0):
    """Top cam: strap overlaps the head AND sticks out past its left edge."""
    head = sam3_select_top1(head_dets, "score", "max")
    straps = sorted(strap_dets, key=lambda d: -d["score"])[:2]
    if head is None or not straps:
        return 0
    strap = np.logical_or.reduce([d["mask"] for d in straps])

    head_area = head["mask"].sum()
    inter = (strap & head["mask"]).sum()          # strap ∩ head overlap
    left_edge = np.nonzero(head["mask"])[1].min()
    protruding = strap[:, :left_edge].sum()       # strap pixels left of head

    return int(inter >= inter_frac * head_area
               and protruding > protrude_mult * head_area)


def reward_from_right_cam(head_dets, strap_dets, shrunk_frac=2 / 3):
    """Right cam: the strap must reach the central region of the head."""
    head = sam3_select_top1(head_dets, "score", "max")
    strap = sam3_select_top1(strap_dets, "score", "max")
    if head is None or strap is None:
        return 0

    # Test region: the head's bbox shrunk to 2/3 around its mask centroid.
    ys, xs = np.nonzero(head["mask"])
    cx, cy = xs.mean(), ys.mean()
    _, _, bw, bh = head["bbox_xywh"]
    sw, sh = bw * shrunk_frac / 2, bh * shrunk_frac / 2
    region = np.zeros_like(head["mask"])
    region[int(cy - sh):int(cy + sh), int(cx - sw):int(cx + sw)] = True

    # The gripper can occlude the strap mid-air and split its mask in two;
    # bridge the two fragments with a straight line before the reach test.
    test = strap["mask"]
    parts, n = ndimage.label(ndimage.binary_dilation(test, iterations=2))
    if n == 2:
        (y0, x0), (y1, x1) = [np.argwhere(parts == i).mean(0) for i in (1, 2)]
        for t in np.linspace(0, 1, 200):
            test[int(y0 + t * (y1 - y0)), int(x0 + t * (x1 - x0))] = True

    return int((test & region).any())


def get_reward(rgb_top, rgb_right):
    """One fused SAM3 call, two per-camera verdicts, one binary reward."""
    strap_t, head_t, dets_r = sam3_segment_multi_image([
        {"rgb": rgb_top,   "texts": ["zip-tie strap"], "crop": TOP_STRAP_CROP},
        {"rgb": rgb_top,   "texts": ["zip-tie head"],  "crop": TOP_HEAD_CROP},
        {"rgb": rgb_right, "texts": ["zip-tie head", "zip-tie strap"],
         "crop": RIGHT_CAM_CROP},
    ])
    top_pass = reward_from_top_cam(strap_t[0], head_t[0])
    right_pass = reward_from_right_cam(dets_r[0], dets_r[1])
    return top_pass and right_pass        # REWARD = top ∧ right
`;
