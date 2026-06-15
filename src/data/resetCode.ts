// High-level distillations of the two physical auto-reset routines, shown as
// code cards inside the reset-case panels. These are audience-facing: real
// tool/vision calls (SAM3 segmentation, grasp sampling, IK ranking, cv2 T
// contour, RRT-connect motion plan) with internal plumbing removed.
export type ResetCode = {
  filename: string;
  code: string;
  label: string;
  caseLabel: string;
  method: string;
};

const pusht = `RED_LO,  RED_HI  = (0, 120, 70),   (10, 255, 255)    # low-hue red band (HSV)
RED_WLO, RED_WHI = (170, 120, 70), (180, 255, 255)   # red wraps the hue circle
CONTOUR_EPS_FRAC = 0.02      # approxPolyDP tolerance, as a fraction of the perimeter
T_CORNERS        = 8         # a clean T silhouette has 8 corners
DETECT_RETRIES   = 100       # frames to wait out motion blur / occlusion
RETRY_DELAY_S    = 0.1

# Segment the red T from an RGB frame. Red straddles the 0/180 hue seam, so we
# OR two HSV ranges into one binary mask of the T's pixels.
def red_mask(rgb):
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    return cv2.inRange(hsv, RED_LO, RED_HI) | cv2.inRange(hsv, RED_WLO, RED_WHI)

# Take the largest blob in the mask, simplify it to a polygon, and verify it
# really is the T: exactly 8 corners arranged in the expected T topology.
def find_t_contour(mask):
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    t = max(cnts, key=cv2.contourArea)
    corners = cv2.approxPolyDP(t, CONTOUR_EPS_FRAC * cv2.arcLength(t, True), True)
    assert len(corners) == T_CORNERS and is_t_topology(corners), "not a clean T"
    return corners

# Recover the T's planar pose from its corners: the centroid gives (x, y) and
# the longest edge (the T's stem) gives the heading yaw.
def solve_t_pose(corners):
    stem = max(t_edges(corners), key=edge_length)
    return polygon_centroid(corners), edge_angle(stem)    # (x, y, yaw)

# Grab a top-camera frame and return (mask, pose); on a blurred or occluded
# view the contour check fails, so retry until a clean T is found or we time out.
def detect_t():
    for _ in range(DETECT_RETRIES):
        mask = red_mask(get_camera_image("top"))
        try:
            return mask, solve_t_pose(find_t_contour(mask))
        except AssertionError:
            time.sleep(RETRY_DELAY_S)

# Drive the T back to its start pose: home the arm, exit early if it is already
# on the goal, un-flip an upside-down T, then grasp it and place it at the start.
def reset_pusht(side):
    go_home()
    mask, pose = detect_t()
    # goal_mask: stored reset reference, compared in image space
    if goal_match(mask, goal_mask):                       # already at the goal pose
        return
    if t_is_upside_down(pose):                            # normalize a flipped T first
        regrasp_and_flip(side, pose)                      # grasp, lift, rotate, set down
        mask, pose = detect_t()
    freespace_move(side, hover_pose(pose))                # locate -> hover (RRT-connect)
    descend(); close_gripper(side, RESET_HOLD_WIDTH)      # descend -> grasp
    freespace_move(side, hover_pose(start_pose))          # carry to the recorded start
    descend(); open_gripper(side)                         # descend -> release
    go_home()`;

const pin = `NAIL_QUERIES = ["small black nail", "dark nail", "nail"]   # SAM3 prompts, tried in order
SCORE_MIN, MAX_ROUNDS = 0.15, 50
HANDOVER_XY  = {"left": (0.61, 0.19), "right": (0.61, -0.19)}   # fixed staging spot
HANDOVER_RPY = (0.0, 180.0, 0.0)        # top-down so the receiving arm meets the tip
PARTIAL_OPEN = 0.30                      # loosen, don't drop, before the re-grip

# Locate pins in a camera view with SAM3. Blank out the gripper regions so the
# arms are never picked, then try each text prompt until one returns confident
# masks; return the kept detections (or none).
def segment(camera):
    rgb = mask_out(get_camera_image(camera), GRIPPER_REGIONS)
    for query in NAIL_QUERIES:
        dets = [d for d in SAM3.segment(rgb, text=query) if d.score > SCORE_MIN]
        if dets:
            return dets                                    # [{mask, score}, ...]
    return []

# Fine-tune the grasp from the wrist camera: estimate the pin's long axis by PCA
# and slide the open gripper along that axis until it is centered over the pin.
def align_pregrasp(side):
    mask = segment("wrist")[0].mask
    axis = pca_major_axis(mask)                            # pin orientation in the image
    err  = center(mask) - gripper_tip_px(side)             # open gripper vs. pin center
    nudge(side, project(err, onto=axis))                   # move only along the pin axis

# Plan and execute the best reachable grasp for one detected pin: sample top-down
# grasps from the mask, drop off-table candidates, rank by IK cost, then approach,
# descend, refine with the wrist camera, and close. Returns True if the pin is held.
def pick_pin(side, det):
    grasps = sample_grasp_pose_2d(det.mask, camera="top")
    grasps = [g for g in grasps if in_workspace(g)]        # drop off-table false positives
    grasp  = rank_grasps_by_ik(grasps, side)[0]            # closest IK-feasible grasp
    move_to_target(side, grasp)
    descend_to_grasp(side, grasp)
    align_pregrasp(side)                                   # refine, then close on the pin
    return close_gripper(side)                             # True once the pin is held

# Present the held pin for the next insertion: carry it to a fixed top-down
# staging pose, loosen the grip, re-center on the pin with SAM3, and let the
# receiving arm take it upright.
def hand_over(side):
    move_to_target(side, pose(HANDOVER_XY[side], HANDOVER_RPY))
    set_gripper(side, PARTIAL_OPEN)                        # loosen without dropping
    align_pregrasp(side)                                   # SAM3 re-center at the handoff
    regrip_to_receiver(side)                               # receiving arm takes the pin

# Stage a fresh pin in the gripper: detect pins, pick the best reachable grasp,
# and present it; retry until one pin is successfully held and handed off.
def reset_pin(side):
    go_home()
    for _ in range(MAX_ROUNDS):                            # retry until one pin is staged
        dets = segment("top")                              # locate pins on the table
        if not dets:
            continue
        if not pick_pin(side, dets[0]):                    # grasp failed -> try again
            go_home(); continue
        hand_over(side)
        return                                             # stays home holding the pin`;

export const resetCode: { pusht: ResetCode; pin: ResetCode } = {
  pusht: {
    filename: "reset_pusht.py",
    code: pusht,
    label: "Automatic reset routine",
    caseLabel: "Case 1: Push T",
    method: "OpenCV T-pose + grasp & place",
  },
  pin: {
    filename: "reset_pin.py",
    code: pin,
    label: "Automatic reset routine",
    caseLabel: "Case 2: Pin Insertion",
    method: "SAM3 + grasp & handover",
  },
};
