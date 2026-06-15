// Basic outline of the single-arm GPU unplug reset (cap/saved_scripts/gpu/gpu_reset.py).
// The real script is large; this keeps only the gist: localize the slot, loosen
// the card by vision, pull it free, and set it down on a vision-found clear spot.
export const gpuResetCodeFile = "gpu/gpu_reset.py";

export const gpuResetCode = `"""GPU auto-reset: unplug the inserted GPU so the slot is empty for the next trial.

Localize the target slot relative to the motherboard, hover the left arm above
it, use the top camera to find the card's metal bar to loosen it, then grasp,
pull the GPU fully free, and set it down on a vision-found clear table spot.
"""
from skill_library.namespace import (close_gripper, find_clear_table_spot,
    freespace_move, open_gripper, segment_object)
from gpu.slot_hover import build_slot_scene, hover_world  # motherboard-relative slot geometry

TARGET_SLOT = 1


# 1. Localize the target slot from the motherboard and hover the left arm above it.
open_gripper("left")
scene = build_slot_scene(camera="top", slot=TARGET_SLOT)
freespace_move(left_target_pos=hover_world(scene), left_target_rpy=[0, 90, 0])

# 2. Find the card's metal bar by vision and pull there first to loosen it.
bar = segment_object("GPU metal bar", camera="top").centroid_world_xyz
freespace_move(left_target_pos=bar, left_target_rpy=[0, 90, 0])
close_gripper("left"); freespace_move(left_target_pos=[bar[0] + 0.04, bar[1], bar[2] + 0.02])
open_gripper("left")

# 3. Re-hover to the slot center, grasp the loosened card, and pull it fully free.
freespace_move(left_target_pos=hover_world(scene), left_target_rpy=[0, 90, 0])
close_gripper("left")
freespace_move(left_target_pos=[hover_world(scene)[0] + 0.10, *hover_world(scene)[1:]])

# 4. Derive the park pose from the GPU itself: find a clear table spot whose
#    footprint fits the grasped card, then set it down there (no hardcoded pose).
gpu = segment_object("GPU graphics card", camera="top")
park_xyz = find_clear_table_spot(camera="top", footprint=gpu.size_xy)
freespace_move(left_target_pos=park_xyz, left_target_rpy=[0, 90, gpu.yaw_deg])
open_gripper("left")
`;
