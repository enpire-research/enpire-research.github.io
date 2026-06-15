// Simplified from the autoresearch ziptie/reset/flat.py. The original hardcoded
// every freespace waypoint; here the OTHER arm instead localizes the strap tail
// by vision (wrist-camera mask deprojected to world) so the grasp isn't baked in.
export const ziptieResetCodeFile = "ziptie/reset/flat.py";

export const ziptieResetCode = `"""Zip-tie auto-reset: two arms re-stage the strap for the next trial.

The HOLDING arm picks the zip-tie head and moves to a fixed handover pose;
the OTHER arm uses its wrist camera to localize the strap tail and grasps it,
so the tail position is perceived, not hardcoded.
"""
import numpy as np
from skill_library.namespace import (close_gripper, freespace_move,
    get_camera_extrinsics, get_camera_intrinsics, render_depth, segment_all_objects)
from skill_library.pick import pick_object
from ziptie.reward import move_to_rew_pose_left, move_to_rew_pose_right

TAIL_OFFSET_M = 0.055   # grasp this far up the strap from its tip


def vision_tail_xyz(cam):
    """Deproject the strap mask from cam's wrist view; return a grasp point
    5.5 cm up the strap from its lowest (tip) point, in world coordinates."""
    det = max(segment_all_objects(query="zip-tie strap", camera=cam), key=lambda d: d.score)
    ys, xs = np.nonzero(det.mask)
    fx, fy, cx, cy = get_camera_intrinsics(cam)
    R, t = get_camera_extrinsics(cam)
    z = render_depth(cam)[ys, xs]
    world = np.c_[(xs - cx) * z / fx, (ys - cy) * z / fy, z] @ R.T + t
    tip = world[world[:, 2].argmin()]                       # lowest point = tail tip
    return world[np.abs(np.linalg.norm(world - tip, axis=1) - TAIL_OFFSET_M).argmin()]


# 1. Holding arm picks the zip-tie head, then moves to the fixed handover pose.
holding = pick_object("zip-tie head", grasp_mode="2d")
freespace_move(left_target_pos=[0.452, 0.161, 1.166], left_target_rpy=[27, 56, 55])

# 2. Other arm localizes the tail by vision and grasps it (no hardcoded xyz).
other = "right" if holding == "left" else "left"
freespace_move(**{f"{other}_target_pos": list(vision_tail_xyz(other)),
                  f"{other}_target_rpy": [60, -85, -179]})
close_gripper(other)

# 3. Both arms settle at the reward/observation pose for the next trial.
move_to_rew_pose_left()
move_to_rew_pose_right()
`;
