// Basic outline of the single-arm GPU unplug reset (cap/saved_scripts/gpu/gpu_reset.py).
// The real script is large; this keeps only the gist: localize the slot, loosen
// the card by vision, pull it free, park it, and go home.
export const gpuResetCodeFile = "gpu/gpu_reset.py";

export const gpuResetCode = `"""GPU auto-reset: unplug the inserted GPU so the slot is empty for the next trial.

Localize the target slot relative to the motherboard, hover the left arm above
it, use the top camera to find the card's metal bar to loosen it, then grasp,
pull the GPU fully free, carry it to a fixed parking pose, and go home.
"""
from skill_library.namespace import (close_gripper, freespace_move, go_home,
    open_gripper, segment_object)
from gpu.slot_hover import build_slot_scene, hover_world  # motherboard-relative slot geometry

TARGET_SLOT = 1
PARK_POSE = ([0.55, -0.30, 1.05], [0, 75, 0])   # fixed right-side table parking pose


# 1. Localize the target slot from the motherboard and hover the left arm above it.
go_home(); open_gripper("left")
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

# 4. Carry the GPU to the parking pose, set it down, and go home.
freespace_move(left_target_pos=PARK_POSE[0], left_target_rpy=PARK_POSE[1])
open_gripper("left"); go_home()
`;
