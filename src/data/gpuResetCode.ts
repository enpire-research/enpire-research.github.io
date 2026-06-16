// Basic outline of the GPU reset (cap/saved_scripts/gpu/gpu_reset.py). The real
// script is large; this keeps only the gist: grasp the GPU on the table, hand it
// over to the other arm, then that arm visually locates the slot and hovers above.
export const gpuResetCodeFile = "gpu/gpu_reset.py";

export const gpuResetCode = `"""GPU auto-reset: re-stage the GPU above its slot for the next trial.

One arm grasps the GPU from anywhere on the table, hands it over to the other
arm, and the receiving arm visually locates the motherboard metal-bar socket
and hovers above it — ready for the insertion policy.
"""
from skill_library.namespace import (close_gripper, freespace_move, handover,
    open_gripper, sample_grasp_pose_3d_bb, segment_object)
from cap.constants import TOP_DOWN_RPY

GRASP_ARM, HOLD_ARM = "left", "right"


# 1. Grasp the GPU from anywhere on the table with a 3D bounding-box grasp.
open_gripper(GRASP_ARM)
gpu = segment_object("GPU graphics card", camera="top")
grasp_pos, grasp_rpy = sample_grasp_pose_3d_bb(gpu.bbox_3d)   # pose from the card's 3D box
freespace_move(**{f"{GRASP_ARM}_target_pos": grasp_pos, f"{GRASP_ARM}_target_rpy": grasp_rpy})
close_gripper(GRASP_ARM)

# 2. Bimanual handover: pass the GPU from the grasping arm to the holding arm.
handover(from_arm=GRASP_ARM, to_arm=HOLD_ARM)

# 3. Holding arm visually locates the metal-bar socket and hovers above it.
socket = segment_object("motherboard metal bar socket", camera=HOLD_ARM)
hover_xyz = [socket.centroid_world_xyz[0], socket.centroid_world_xyz[1],
             socket.centroid_world_xyz[2] + 0.06]
freespace_move(**{f"{HOLD_ARM}_target_pos": hover_xyz, f"{HOLD_ARM}_target_rpy": TOP_DOWN_RPY})
`;
