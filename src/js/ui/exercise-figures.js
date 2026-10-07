import { prefersReducedMotion } from "../util/dom.js";

/**
 * Stick figures that show how an exercise is done, drawn as inline SVG so they
 * cost no downloads, work offline and take the theme's and block's colours.
 *
 * A figure is two poses — where the movement starts and where it ends — and
 * the drawing goes back and forth between them. A pose is a set of joints on a
 * 120×120 grid with the floor at y = 110. "1" limbs are the near side, drawn
 * solid; "2" limbs are the far side, drawn fainter for depth.
 *
 *   head · neck (shoulders) · hip
 *   k1/a1/t1, k2/a2/t2   knee, ankle, toe of each leg
 *   e1/h1, e2/h2         elbow and hand of each arm
 *   spine                optional mid-back, for a back that curves
 *
 * A figure can also say `front: true` (seen from the front, so neither side
 * is further away and nothing is faded), `floor: false` (seen from above),
 * `props` (chair, wall, sofa: static paths) and `duration` in seconds.
 */

const SVG_NS = "http://www.w3.org/2000/svg";
const FLOOR = "M6 110 H114";

/** Standing, side view, facing right — the starting point for most poses. */
const STANDING = {
  head: [60, 20], neck: [60, 30], hip: [60, 60],
  k1: [61, 83], a1: [60, 106], t1: [68, 108],
  k2: [59, 83], a2: [58, 106], t2: [66, 108],
  e1: [61, 45], h1: [62, 59],
  e2: [59, 45], h2: [60, 59]
};

/** Move a whole pose, for figures that are a standing pose somewhere else. */
function shifted(pose, dx, dy = 0) {
  return Object.fromEntries(
    Object.entries(pose).map(([joint, [x, y]]) => [joint, [x + dx, y + dy]])
  );
}

const FAR_LIMBS = { k2: "k1", a2: "a1", t2: "t1", e2: "e1", h2: "h1" };

/** A pose without its far limbs, so side() or sym() can work them out afresh. */
function near(pose) {
  return Object.fromEntries(Object.entries(pose).filter(([joint]) => !(joint in FAR_LIMBS)));
}

/** Side view: any far limb not given trails its near twin by a step, for depth. */
function side(pose) {
  const full = { ...pose };
  for (const [far, near] of Object.entries(FAR_LIMBS)) {
    full[far] ??= [pose[near][0] - 2, pose[near][1]];
  }
  return full;
}

/** Front view: any limb on the right not given mirrors the left one. */
function sym(pose) {
  const full = { ...pose };
  for (const [far, near] of Object.entries(FAR_LIMBS)) {
    full[far] ??= [120 - pose[near][0], pose[near][1]];
  }
  return full;
}

/** Standing, front view, arms down. */
const FRONT = sym({
  head: [60, 20], neck: [60, 30], hip: [60, 60],
  k1: [55, 83], a1: [54, 106], t1: [50, 108],
  e1: [52, 45], h1: [50, 59]
});

/** Sitting on a chair, side view, facing right, hands on the thighs. */
const CHAIR = ["M30 52 V110", "M30 84 H56", "M54 84 V110"];
const SEATED = side({
  head: [47, 40], neck: [46, 50], hip: [46, 80],
  k1: [68, 80], a1: [68, 106], t1: [76, 108],
  e1: [48, 65], h1: [58, 76]
});

/** Sitting on a chair, front view. */
const CHAIR_FRONT = ["M42 86 H78", "M44 86 V110", "M76 86 V110"];
const SEATED_FRONT = sym({
  head: [60, 44], neck: [60, 54], hip: [60, 84],
  k1: [55, 88], a1: [55, 106], t1: [52, 108],
  e1: [52, 68], h1: [50, 80]
});

/** On the back, knees bent and feet flat, head to the left. */
const LYING = {
  head: [22, 100], neck: [32, 102], hip: [62, 104],
  k1: [79, 84], a1: [86, 106], t1: [94, 108],
  k2: [77, 84], a2: [84, 106], t2: [92, 108],
  e1: [46, 105], h1: [60, 106],
  e2: [46, 105], h2: [60, 106]
};

/** Hips up off the floor, from LYING. */
const BRIDGE = {
  head: [26, 98], neck: [36, 100], hip: [64, 84],
  k1: [86, 82], a1: [86, 106], t1: [94, 108],
  k2: [84, 82], a2: [84, 106], t2: [92, 108],
  e1: [48, 104], h1: [62, 106],
  e2: [48, 104], h2: [62, 106]
};

/** On hands and knees, facing right. */
const ALL_FOURS = side({
  head: [90, 68], neck: [78, 76], hip: [46, 80],
  k1: [46, 104], a1: [24, 106], t1: [20, 103],
  e1: [78, 91], h1: [78, 106]
});

/** Plank on the forearms and toes, facing right. */
const FOREARM_PLANK = side({
  head: [92, 83], neck: [82, 88], hip: [52, 94],
  k1: [32, 99], a1: [12, 103], t1: [14, 108],
  e1: [82, 106], h1: [97, 106]
});

/** Lunge with the back knee near the floor; the front foot where STANDING's is. */
const LUNGE = side({
  head: [61, 42], neck: [60, 52], hip: [58, 82],
  k1: [78, 84], a1: [72, 106], t1: [80, 108],
  k2: [52, 101], a2: [32, 101], t2: [36, 108],
  e1: [61, 67], h1: [62, 80]
});

/** Bottom of a free squat: hips back, chest forward. */
const SQUAT = side({
  head: [62, 39], neck: [58, 48], hip: [46, 76],
  k1: [68, 82], a1: [64, 106], t1: [72, 108],
  e1: [62, 62], h1: [64, 75]
});

/** Hinged forward from the hips, knees soft, arms hanging. */
const BENT_OVER = side({
  head: [85, 38], neck: [76, 44], hip: [52, 62],
  k1: [58, 84], a1: [56, 106], t1: [64, 108],
  e1: [77, 59], h1: [78, 73]
});

/** Guard: elbow down, fist by the chin. */
const GUARD = { e: [64, 42], h: [68, 30] };

export const FIGURES = {
  /* Sit back until the glutes touch the chair, arms forward to balance. */
  "chair-squat": {
    props: ["M24 50 V110", "M24 78 H50", "M48 78 V110"],
    poses: [
      shifted(STANDING, 2),
      {
        head: [62, 37], neck: [58, 46], hip: [44, 73],
        k1: [67, 81], a1: [66, 106], t1: [74, 108],
        k2: [65, 81], a2: [64, 106], t2: [72, 108],
        e1: [70, 48], h1: [83, 50],
        e2: [68, 48], h2: [81, 50]
      }
    ]
  },

  /* Up onto the toes and back down: everything rises but the toes. Hands on
     the hips keep the arms out of the way of the feet, which are the point. */
  "calf-raise": {
    poses: [
      {
        ...STANDING,
        e1: [70, 47], h1: [62, 58],
        e2: [68, 47], h2: [60, 58]
      },
      {
        head: [60, 10], neck: [60, 20], hip: [60, 50],
        k1: [61, 73], a1: [63, 96], t1: [69, 107],
        k2: [59, 73], a2: [61, 96], t2: [67, 107],
        e1: [70, 37], h1: [62, 48],
        e2: [68, 37], h2: [60, 48]
      }
    ]
  },

  /* One leg steps back and both knees bend, a hand on the wall for balance. */
  "reverse-lunge": {
    props: ["M93 16 V110"],
    poses: [
      {
        head: [70, 20], neck: [70, 30], hip: [70, 60],
        k1: [71, 83], a1: [70, 106], t1: [78, 108],
        k2: [69, 83], a2: [68, 106], t2: [76, 108],
        e1: [80, 38], h1: [90, 38],
        e2: [69, 45], h2: [70, 58]
      },
      {
        head: [61, 42], neck: [60, 52], hip: [58, 82],
        k1: [78, 84], a1: [72, 106], t1: [80, 108],
        k2: [52, 101], a2: [32, 101], t2: [36, 108],
        e1: [75, 56], h1: [90, 54],
        e2: [59, 67], h2: [60, 80]
      }
    ]
  },

  /* Front view: one straight leg lifts out to the side, hands on the hips. */
  "side-leg-raise": {
    poses: [
      {
        head: [60, 20], neck: [60, 30], hip: [60, 60],
        k1: [55, 83], a1: [54, 106], t1: [50, 108],
        k2: [65, 83], a2: [66, 106], t2: [70, 108],
        e1: [47, 45], h1: [55, 58],
        e2: [73, 45], h2: [65, 58]
      },
      {
        head: [56, 20], neck: [57, 30], hip: [60, 60],
        k1: [55, 83], a1: [54, 106], t1: [50, 108],
        k2: [78, 77], a2: [95, 91], t2: [99, 89],
        e1: [44, 45], h1: [53, 58],
        e2: [70, 44], h2: [64, 57]
      }
    ]
  },

  /* On the back, knees bent: the hips lift off the floor and come down. */
  "glute-bridge": {
    poses: [
      {
        head: [22, 100], neck: [32, 102], hip: [62, 104],
        k1: [79, 84], a1: [86, 106], t1: [94, 108],
        k2: [77, 84], a2: [84, 106], t2: [92, 108],
        e1: [46, 105], h1: [60, 106],
        e2: [46, 105], h2: [60, 106]
      },
      {
        head: [26, 98], neck: [36, 100], hip: [64, 84],
        k1: [86, 82], a1: [86, 106], t1: [94, 108],
        k2: [84, 82], a2: [84, 106], t2: [92, 108],
        e1: [48, 104], h1: [62, 106],
        e2: [48, 104], h2: [62, 106]
      }
    ]
  },

  /* On forearms and knees, body in one line; held, so it only breathes. */
  "kneeling-plank": {
    duration: 3,
    poses: [
      {
        head: [90, 81], neck: [80, 86], hip: [57, 96],
        k1: [34, 106], a1: [14, 96], t1: [10, 93],
        k2: [36, 106], a2: [16, 96], t2: [12, 93],
        e1: [80, 106], h1: [96, 106],
        e2: [82, 106], h2: [98, 106]
      },
      {
        head: [90, 80], neck: [80, 85], hip: [57, 94],
        k1: [34, 106], a1: [14, 96], t1: [10, 93],
        k2: [36, 106], a2: [16, 96], t2: [12, 93],
        e1: [80, 106], h1: [96, 106],
        e2: [82, 106], h2: [98, 106]
      }
    ]
  },
  /* ---- Day 2 ---- */

  /* Bent over, the weights travel from hanging to the hips, elbows high. */
  "bent-over-row": {
    poses: [BENT_OVER, side({ ...near(BENT_OVER), e1: [63, 47], h1: [69, 60] })]
  },

  /* Front view: from the shoulders straight up overhead. */
  "overhead-press": {
    front: true,
    poses: [
      sym({ ...near(FRONT), e1: [44, 40], h1: [44, 26] }),
      sym({ ...near(FRONT), e1: [52, 16], h1: [50, 4] })
    ]
  },

  /* On the back: the arms come down and apart, then close above the chest. */
  "floor-fly": {
    poses: [
      { ...LYING, e1: [34, 88], h1: [35, 74], e2: [32, 88], h2: [33, 74] },
      { ...LYING, e1: [38, 96], h1: [46, 106], e2: [26, 96], h2: [18, 106] }
    ]
  },

  /* Leaning on the wall, body straight: the elbows bend and straighten. */
  "wall-push-up": {
    props: ["M96 16 V110"],
    poses: [
      side({
        head: [82, 31], neck: [78, 40], hip: [70, 63],
        k1: [63, 84], a1: [56, 106], t1: [64, 108],
        e1: [86, 38], h1: [94, 38]
      }),
      side({
        head: [90, 34], neck: [86, 43], hip: [76, 64],
        k1: [66, 85], a1: [56, 106], t1: [64, 108],
        e1: [80, 53], h1: [94, 41]
      })
    ]
  },

  /* Hands on the chair's edge behind, the hips sink as the elbows bend back. */
  "chair-dip": {
    props: ["M20 50 V110", "M20 78 H48", "M46 78 V110"],
    poses: [
      side({
        head: [47, 40], neck: [46, 50], hip: [48, 80],
        k1: [72, 80], a1: [72, 106], t1: [80, 108],
        e1: [46, 64], h1: [46, 78]
      }),
      side({
        head: [49, 52], neck: [48, 62], hip: [50, 92],
        k1: [72, 86], a1: [72, 106], t1: [80, 108],
        e1: [34, 66], h1: [46, 78]
      })
    ]
  },

  /* Bent over, straight arms rise out to the sides — upwards, seen side on. */
  "reverse-fly": {
    poses: [BENT_OVER, side({ ...near(BENT_OVER), e1: [77, 30], h1: [78, 16] })]
  },

  /* ---- Day 3 ---- */

  /* Knees up in turn, arms swinging against the legs. */
  march: {
    poses: [
      {
        ...STANDING,
        k1: [82, 64], a1: [80, 86], t1: [88, 87],
        e1: [54, 44], h1: [50, 56], e2: [66, 44], h2: [72, 54]
      },
      {
        ...STANDING,
        k2: [80, 64], a2: [78, 86], t2: [86, 87],
        e1: [66, 44], h1: [72, 54], e2: [54, 44], h2: [50, 56]
      }
    ]
  },

  /* Front view: a step out to one side, the other foot taps in behind. */
  "step-touch": {
    front: true,
    poses: [
      {
        head: [55, 20], neck: [56, 30], hip: [56, 60],
        k1: [48, 83], a1: [42, 106], t1: [38, 108],
        k2: [60, 84], a2: [58, 104], t2: [60, 108],
        e1: [46, 42], h1: [40, 52], e2: [64, 45], h2: [64, 58]
      },
      {
        head: [65, 20], neck: [64, 30], hip: [64, 60],
        k1: [60, 84], a1: [62, 104], t1: [60, 108],
        k2: [72, 83], a2: [78, 106], t2: [82, 108],
        e1: [56, 45], h1: [56, 58], e2: [74, 42], h2: [80, 52]
      }
    ]
  },

  /* Front view: a knee comes up and the opposite hand reaches down to it. */
  "cross-knee-touch": {
    front: true,
    poses: [
      {
        ...FRONT,
        k1: [62, 72], a1: [58, 92], t1: [55, 94],
        e1: [46, 38], h1: [40, 26], e2: [68, 48], h2: [63, 66]
      },
      {
        ...FRONT,
        k2: [58, 72], a2: [62, 92], t2: [65, 94],
        e1: [52, 48], h1: [57, 66], e2: [74, 38], h2: [80, 26]
      }
    ]
  },

  /* Punches out in front, one arm then the other, the free fist on guard. */
  "air-punch": {
    poses: [
      {
        ...STANDING,
        k1: [64, 83], a1: [66, 106], t1: [74, 108],
        k2: [56, 83], a2: [54, 106], t2: [62, 108],
        e1: [74, 32], h1: [89, 32], e2: GUARD.e, h2: GUARD.h
      },
      {
        ...STANDING,
        k1: [64, 83], a1: [66, 106], t1: [74, 108],
        k2: [56, 83], a2: [54, 106], t2: [62, 108],
        e1: GUARD.e, h1: GUARD.h, e2: [74, 32], h2: [89, 32]
      }
    ]
  },

  /* Front view: the trunk tips to one side, a hand sliding down the leg. */
  "side-bend": {
    front: true,
    poses: [
      {
        ...FRONT,
        head: [47, 23], neck: [53, 31],
        k1: [54, 83], a1: [52, 106], t1: [48, 108],
        k2: [66, 83], a2: [68, 106], t2: [72, 108],
        e1: [48, 46], h1: [47, 62], e2: [66, 20], h2: [56, 12]
      },
      {
        ...FRONT,
        head: [73, 23], neck: [67, 31],
        k1: [54, 83], a1: [52, 106], t1: [48, 108],
        k2: [66, 83], a2: [68, 106], t2: [72, 108],
        e1: [54, 20], h1: [64, 12], e2: [72, 46], h2: [73, 62]
      }
    ]
  },

  /* Front view: arms held out in front swing from one side to the other. */
  "standing-twist": {
    front: true,
    poses: [
      { ...FRONT, e1: [47, 36], h1: [34, 38], e2: [50, 39], h2: [37, 41] },
      { ...FRONT, e1: [70, 39], h1: [83, 41], e2: [73, 36], h2: [86, 38] }
    ]
  },

  /* ---- Day 4 ---- */

  /* Front view, feet wide and toes out: straight down between the knees. */
  "sumo-squat": {
    front: true,
    poses: [
      sym({
        ...near(FRONT),
        k1: [50, 83], a1: [44, 106], t1: [38, 108],
        e1: [48, 44], h1: [58, 42]
      }),
      sym({
        head: [60, 40], neck: [60, 50], hip: [60, 80],
        k1: [40, 82], a1: [44, 106], t1: [38, 108],
        e1: [48, 64], h1: [58, 62]
      })
    ]
  },

  /* Hips back, back flat: the weights slide down the legs to the knees. */
  "romanian-deadlift": {
    poses: [
      { ...STANDING, e1: [61, 45], h1: [63, 60], e2: [59, 45], h2: [61, 60] },
      side({
        head: [83, 43], neck: [74, 48], hip: [48, 62],
        k1: [58, 84], a1: [60, 106], t1: [68, 108],
        e1: [75, 63], h1: [76, 77]
      })
    ]
  },

  /* Feet stay put in a long stride; the body goes straight down and up. */
  "static-lunge": {
    poses: [
      side({
        head: [58, 22], neck: [58, 32], hip: [58, 62],
        k1: [68, 84], a1: [76, 106], t1: [84, 108],
        k2: [45, 83], a2: [30, 104], t2: [34, 108],
        e1: [68, 46], h1: [60, 60]
      }),
      side({
        head: [56, 40], neck: [56, 50], hip: [56, 80],
        k1: [78, 84], a1: [76, 106], t1: [84, 108],
        k2: [46, 100], a2: [30, 104], t2: [34, 108],
        e1: [66, 64], h1: [58, 78]
      })
    ]
  },

  /* A straight leg lifts out in front, hands on the hips. */
  "front-leg-raise": {
    poses: [
      side({ ...near(STANDING), e1: [70, 47], h1: [62, 58] }),
      side({
        ...STANDING,
        head: [57, 20], neck: [58, 30],
        k1: [82, 68], a1: [104, 76], t1: [108, 71],
        k2: [59, 83], a2: [58, 106], t2: [66, 108],
        e1: [68, 47], h1: [61, 58]
      })
    ]
  },

  /* Lying on one side, knees bent and feet together: the top knee opens. */
  clamshell: {
    poses: [
      {
        head: [18, 92], neck: [28, 97], hip: [56, 99],
        k1: [72, 101], a1: [94, 104], t1: [98, 100],
        k2: [72, 106], a2: [94, 108], t2: [98, 104],
        e1: [40, 100], h1: [48, 106],
        e2: [18, 106], h2: [12, 96]
      },
      {
        head: [18, 92], neck: [28, 97], hip: [56, 99],
        k1: [70, 82], a1: [94, 104], t1: [98, 100],
        k2: [72, 106], a2: [94, 108], t2: [98, 104],
        e1: [40, 100], h1: [48, 106],
        e2: [18, 106], h2: [12, 96]
      }
    ]
  },

  /* ---- Day 5 ---- */

  /* Down into a squat, and a biceps curl on the way up. */
  "squat-curl": {
    poses: [SQUAT, side({ ...near(STANDING), e1: [61, 45], h1: [67, 33] })]
  },

  /* Step back into a lunge, then stand reaching both arms forward. */
  "reverse-lunge-reach": {
    poses: [LUNGE, side({ ...near(STANDING), a1: [72, 106], t1: [80, 108], e1: [74, 32], h1: [89, 32] })]
  },

  /* One hand on the chair, the other rows the weight up to the hip. */
  "one-arm-row": {
    props: ["M108 54 V110", "M84 80 H108", "M86 80 V110"],
    poses: [
      {
        head: [85, 46], neck: [76, 50], hip: [48, 62],
        k1: [54, 84], a1: [52, 106], t1: [60, 108],
        k2: [60, 84], a2: [66, 106], t2: [74, 108],
        e1: [77, 65], h1: [78, 79],
        e2: [84, 64], h2: [90, 80]
      },
      {
        head: [85, 46], neck: [76, 50], hip: [48, 62],
        k1: [54, 84], a1: [52, 106], t1: [60, 108],
        k2: [60, 84], a2: [66, 106], t2: [74, 108],
        e1: [63, 47], h1: [68, 61],
        e2: [84, 64], h2: [90, 80]
      }
    ]
  },

  /* A plank on hands and knees; a hand lifts to tap the other shoulder. */
  "plank-shoulder-tap": {
    poses: [
      side({
        head: [90, 72], neck: [80, 77], hip: [58, 91],
        k1: [36, 106], a1: [16, 96], t1: [12, 93],
        e1: [80, 91], h1: [80, 106]
      }),
      side({
        head: [90, 72], neck: [80, 77], hip: [58, 91],
        k1: [36, 106], a1: [16, 96], t1: [12, 93],
        e1: [92, 88], h1: [82, 79],
        e2: [78, 91], h2: [78, 106]
      })
    ]
  },

  /* On all fours: one arm reaches forward as the opposite leg reaches back. */
  "bird-dog": {
    poses: [
      ALL_FOURS,
      { ...ALL_FOURS, e1: [93, 74], h1: [107, 72], k2: [22, 80], a2: [2, 79], t2: [0, 75] }
    ]
  },

  /* Holding the bridge, one heel lifts off the floor and down again. */
  "bridge-heel-lift": {
    poses: [BRIDGE, { ...BRIDGE, k1: [87, 79], a1: [89, 99], t1: [95, 108] }]
  },

  /* ---- Day 6 ---- */

  /* Seated: the thighs lift quickly in turn. */
  "seated-march": {
    props: CHAIR,
    poses: [
      { ...SEATED, k2: [64, 66], a2: [66, 90], t2: [74, 91] },
      { ...SEATED, k1: [66, 66], a1: [68, 90], t1: [76, 91] }
    ]
  },

  /* Front view, seated: legs and arms open wide together, then close. */
  "seated-jack": {
    front: true,
    props: CHAIR_FRONT,
    poses: [
      SEATED_FRONT,
      sym({
        ...near(SEATED_FRONT),
        k1: [46, 88], a1: [40, 106], t1: [36, 108],
        e1: [48, 42], h1: [40, 30]
      })
    ]
  },

  /* Seated: one leg straightens out in front and holds. */
  "seated-leg-extension": {
    props: CHAIR,
    poses: [SEATED, { ...SEATED, k1: [68, 78], a1: [90, 74], t1: [94, 68] }]
  },

  /* Hands on the sofa's arm, body straight: the chest lowers towards it. */
  "incline-push-up": {
    props: ["M84 82 H114", "M86 82 V110", "M112 82 V110"],
    poses: [
      side({
        head: [89, 50], neck: [80, 56], hip: [58, 76],
        k1: [40, 91], a1: [24, 106], t1: [30, 108],
        e1: [84, 69], h1: [88, 82]
      }),
      side({
        head: [93, 64], neck: [84, 70], hip: [58, 85],
        k1: [39, 97], a1: [24, 106], t1: [30, 108],
        e1: [74, 76], h1: [88, 82]
      })
    ]
  },

  /* Seated, arms crossed: the ribs curl down towards the navel. */
  "seated-crunch": {
    props: CHAIR,
    poses: [
      side({ ...near(SEATED), e1: [54, 62], h1: [46, 56] }),
      side({ ...near(SEATED), head: [64, 47], neck: [57, 54], e1: [64, 66], h1: [56, 60] })
    ]
  },

  /* Leaning back, holding the seat: both knees draw in to the chest. */
  "seated-knee-tuck": {
    props: CHAIR,
    poses: [
      side({
        head: [39, 42], neck: [40, 52], hip: [46, 80],
        k1: [68, 82], a1: [86, 96], t1: [92, 93],
        e1: [42, 68], h1: [52, 82]
      }),
      side({
        head: [43, 42], neck: [44, 52], hip: [46, 80],
        k1: [60, 64], a1: [68, 86], t1: [76, 86],
        e1: [44, 68], h1: [52, 82]
      })
    ]
  },

  /* ---- Day 7 ---- */

  /* Front view, elbows pinned to the sides: the hands curl up to the shoulders. */
  "biceps-curl": {
    front: true,
    poses: [FRONT, sym({ ...near(FRONT), e1: [52, 45], h1: [49, 32] })]
  },

  /* Front view: straight arms rise out to the sides, up to eye level. */
  "lateral-raise": {
    front: true,
    poses: [FRONT, sym({ ...near(FRONT), e1: [46, 30], h1: [32, 26] })]
  },

  /* Front view, upper arms by the ears: the forearms drop behind the head. */
  "overhead-triceps": {
    front: true,
    poses: [
      sym({ ...near(FRONT), e1: [50, 16], h1: [53, 3] }),
      sym({ ...near(FRONT), e1: [50, 16], h1: [58, 27] })
    ]
  },

  /* Front view, seated: arms open from in front of the chest into a T. */
  "t-raise": {
    front: true,
    props: CHAIR_FRONT,
    poses: [
      sym({ ...near(SEATED_FRONT), e1: [55, 64], h1: [58, 62] }),
      sym({ ...near(SEATED_FRONT), e1: [46, 54], h1: [32, 54] })
    ]
  },

  /* On all fours: the back rounds up, head down, then dips, head up. */
  "cat-cow": {
    poses: [
      { ...ALL_FOURS, head: [86, 86], spine: [62, 66] },
      { ...ALL_FOURS, head: [90, 64], spine: [62, 86] }
    ]
  },

  /* ---- Day 8 ---- */

  /* On the back, limbs up: an arm reaches overhead as the opposite leg
     lowers out straight, the lower back pressed into the floor. */
  "dead-bug": {
    poses: [
      {
        ...LYING,
        k1: [62, 82], a1: [84, 82], t1: [86, 76],
        k2: [60, 82], a2: [82, 82], t2: [84, 76],
        e1: [34, 88], h1: [35, 74], e2: [32, 88], h2: [33, 74]
      },
      {
        ...LYING,
        k1: [84, 100], a1: [106, 97], t1: [108, 91],
        k2: [60, 82], a2: [82, 82], t2: [84, 76],
        e1: [34, 88], h1: [35, 74], e2: [18, 96], h2: [4, 100]
      }
    ]
  },

  /* On the back, shoulders just off the floor: one hand then the other
     slides down towards its heel. */
  "heel-taps": {
    poses: [
      {
        ...LYING, head: [27, 87], neck: [36, 93],
        e1: [50, 95], h1: [64, 97], e2: [44, 102], h2: [54, 106]
      },
      {
        ...LYING, head: [27, 87], neck: [36, 93],
        e1: [44, 102], h1: [54, 106], e2: [50, 95], h2: [64, 97]
      }
    ]
  },

  /* A bridge on the heels, toes pulled up off the floor. */
  "heel-bridge": {
    poses: [
      { ...LYING, a1: [88, 106], t1: [92, 99], a2: [86, 106], t2: [90, 99] },
      { ...BRIDGE, a1: [88, 106], t1: [92, 99], a2: [86, 106], t2: [90, 99] }
    ]
  },

  /* On all fours: one bent leg drives the sole up towards the ceiling. */
  "donkey-kick": {
    poses: [ALL_FOURS, { ...ALL_FOURS, k1: [23, 76], a1: [22, 54], t1: [28, 50] }]
  },

  /* On the back, straight legs low over the floor, crossing up and down. */
  "scissor-kicks": {
    duration: 1.4,
    poses: [
      { ...LYING, k1: [83, 92], a1: [104, 80], t1: [108, 74], k2: [84, 101], a2: [106, 98], t2: [110, 92] },
      { ...LYING, k1: [84, 101], a1: [106, 98], t1: [110, 92], k2: [83, 92], a2: [104, 80], t2: [108, 74] }
    ]
  },

  /* Front view: on one forearm and the knees, the hips lift into a line. */
  "side-plank-knees": {
    front: true,
    poses: [
      {
        head: [20, 80], neck: [28, 87], hip: [52, 102],
        k1: [76, 104], a1: [92, 96], t1: [98, 94],
        k2: [78, 106], a2: [94, 98], t2: [100, 96],
        e1: [28, 72], h1: [28, 58],
        e2: [28, 106], h2: [38, 106]
      },
      {
        head: [20, 80], neck: [28, 87], hip: [52, 94],
        k1: [76, 104], a1: [92, 96], t1: [98, 94],
        k2: [78, 106], a2: [94, 98], t2: [100, 96],
        e1: [28, 72], h1: [28, 58],
        e2: [28, 106], h2: [38, 106]
      }
    ]
  },

  /* ---- Day 9 ---- */

  /* Legs and arms swing forward and back in opposition, without a jump. */
  "ski-swing": {
    duration: 1.6,
    poses: [
      {
        ...STANDING, hip: [60, 62],
        k1: [70, 84], a1: [78, 106], t1: [86, 108],
        k2: [50, 84], a2: [42, 104], t2: [48, 108],
        e1: [52, 42], h1: [44, 52], e2: [70, 40], h2: [80, 48]
      },
      {
        ...STANDING, hip: [60, 62],
        k1: [50, 84], a1: [42, 104], t1: [48, 108],
        k2: [70, 84], a2: [78, 106], t2: [86, 108],
        e1: [70, 40], h1: [80, 48], e2: [52, 42], h2: [44, 52]
      }
    ]
  },

  /* Front view: a wide step to the side, sinking to reach for the floor. */
  "side-step-touch-floor": {
    front: true,
    poses: [
      FRONT,
      {
        head: [57, 48], neck: [60, 58], hip: [64, 86],
        k1: [50, 90], a1: [52, 106], t1: [48, 108],
        k2: [80, 90], a2: [86, 106], t2: [90, 108],
        e1: [50, 70], h1: [46, 82], e2: [70, 72], h2: [78, 86]
      }
    ]
  },

  /* Quick little steps on the balls of the feet, arms bent to run. */
  "low-skip": {
    duration: 0.8,
    poses: [
      {
        ...STANDING,
        k1: [68, 80], a1: [66, 100], t1: [74, 102],
        e1: [54, 42], h1: [60, 32], e2: [66, 44], h2: [72, 34]
      },
      {
        ...STANDING,
        k2: [66, 80], a2: [64, 100], t2: [72, 102],
        e1: [66, 44], h1: [72, 34], e2: [54, 42], h2: [60, 32]
      }
    ]
  },

  /* Front view: punches to either side, turning on the back foot. */
  "side-boxing": {
    front: true,
    poses: [
      {
        ...FRONT, head: [55, 20], neck: [56, 30],
        k1: [50, 83], a1: [46, 106], t1: [42, 108],
        k2: [70, 83], a2: [74, 106], t2: [78, 108],
        e1: [44, 32], h1: [29, 32], e2: [66, 42], h2: [64, 30]
      },
      {
        ...FRONT, head: [65, 20], neck: [64, 30],
        k1: [50, 83], a1: [46, 106], t1: [42, 108],
        k2: [70, 83], a2: [74, 106], t2: [78, 108],
        e1: [54, 42], h1: [56, 30], e2: [76, 32], h2: [91, 32]
      }
    ]
  },

  /* Front view: a knee lifts slowly to meet the opposite elbow. */
  "knee-to-elbow": {
    front: true,
    poses: [
      {
        ...FRONT, neck: [62, 31], head: [63, 21],
        k1: [58, 70], a1: [56, 90], t1: [52, 92],
        e1: [44, 26], h1: [53, 16], e2: [61, 52], h2: [68, 37]
      },
      {
        ...FRONT, neck: [58, 31], head: [57, 21],
        k2: [62, 70], a2: [64, 90], t2: [68, 92],
        e1: [59, 52], h1: [52, 37], e2: [76, 26], h2: [67, 16]
      }
    ]
  },

  /* Front view: arms out to the sides, drawing big circles. */
  "arm-circles": {
    front: true,
    duration: 1.4,
    poses: [
      sym({ ...near(FRONT), e1: [46, 26], h1: [33, 18] }),
      sym({ ...near(FRONT), e1: [46, 36], h1: [32, 42] })
    ]
  },

  /* ---- Day 10 ---- */

  /* Tipping forward on one leg, the other sliding back along the floor. */
  "single-leg-deadlift": {
    poses: [
      { ...STANDING, k2: [56, 83], a2: [50, 104], t2: [53, 108] },
      {
        head: [95, 54], neck: [86, 57], hip: [58, 62],
        k1: [62, 84], a1: [60, 106], t1: [68, 108],
        k2: [40, 84], a2: [22, 104], t2: [25, 108],
        e1: [86, 71], h1: [86, 85],
        e2: [84, 71], h2: [84, 85]
      }
    ]
  },

  /* Sitting to the chair and standing on one leg, the other held out. */
  "single-leg-chair-squat": {
    props: ["M24 50 V110", "M24 78 H50", "M48 78 V110"],
    poses: [
      { ...shifted(STANDING, 2), k2: [74, 80], a2: [86, 98], t2: [92, 96] },
      {
        head: [62, 37], neck: [58, 46], hip: [44, 73],
        k1: [67, 81], a1: [66, 106], t1: [74, 108],
        k2: [66, 71], a2: [88, 72], t2: [92, 66],
        e1: [70, 48], h1: [83, 50],
        e2: [68, 48], h2: [81, 50]
      }
    ]
  },

  /* Front view: a wide step out, bending that knee, the other leg straight. */
  "side-lunge": {
    front: true,
    poses: [
      FRONT,
      {
        head: [63, 36], neck: [64, 46], hip: [68, 76],
        k1: [56, 91], a1: [44, 106], t1: [40, 108],
        k2: [82, 86], a2: [88, 106], t2: [94, 108],
        e1: [62, 60], h1: [66, 70], e2: [72, 60], h2: [70, 70]
      }
    ]
  },

  /* A bridge with one leg pointing straight up at the ceiling. */
  "single-leg-bridge": {
    poses: [
      { ...LYING, k1: [64, 81], a1: [66, 58], t1: [72, 56] },
      { ...BRIDGE, k1: [68, 61], a1: [72, 38], t1: [78, 37] }
    ]
  },

  /* Forearm plank; now and then one arm reaches out in front. */
  "plank-arm-reach": {
    poses: [FOREARM_PLANK, { ...FOREARM_PLANK, e1: [96, 86], h1: [110, 84] }]
  },

  /* Front view, sitting and leaning back: the hands sweep side to side. */
  "russian-twist": {
    front: true,
    poses: [
      {
        head: [57, 60], neck: [58, 70], hip: [60, 98],
        k1: [48, 82], a1: [48, 106], t1: [44, 108],
        k2: [72, 82], a2: [72, 106], t2: [76, 108],
        e1: [48, 78], h1: [42, 88], e2: [52, 82], h2: [44, 90]
      },
      {
        head: [63, 60], neck: [62, 70], hip: [60, 98],
        k1: [48, 82], a1: [48, 106], t1: [44, 108],
        k2: [72, 82], a2: [72, 106], t2: [76, 108],
        e1: [68, 82], h1: [76, 90], e2: [72, 78], h2: [78, 88]
      }
    ]
  },

  /* ---- Day 11 ---- */

  /* Standing, the weights push out from the chest and come back. */
  "standing-chest-press": {
    poses: [
      side({ ...near(STANDING), e1: [52, 42], h1: [66, 38] }),
      side({ ...near(STANDING), e1: [74, 32], h1: [89, 32] })
    ]
  },

  /* Front view: the weights rise from the hips to the chin, elbows high. */
  "upright-row": {
    front: true,
    poses: [
      sym({ ...near(FRONT), e1: [53, 45], h1: [55, 60] }),
      sym({ ...near(FRONT), e1: [44, 30], h1: [56, 34] })
    ]
  },

  /* Bent over, upper arm still: the forearm straightens out behind. */
  "triceps-kickback": {
    poses: [
      side({ ...near(BENT_OVER), e1: [63, 49], h1: [64, 63] }),
      side({ ...near(BENT_OVER), e1: [63, 49], h1: [50, 54] })
    ]
  },

  /* On the forearms and toes, body in one line; held, so it only breathes. */
  "forearm-plank": {
    duration: 3,
    poses: [FOREARM_PLANK, side({ ...FOREARM_PLANK, head: [92, 82], neck: [82, 87], hip: [52, 92] })]
  },

  /* Face down: straightening the arms lifts the chest, hips on the floor. */
  cobra: {
    poses: [
      side({
        head: [94, 100], neck: [82, 104], hip: [50, 105],
        k1: [28, 106], a1: [6, 106], t1: [2, 103],
        e1: [72, 95], h1: [84, 106]
      }),
      side({
        head: [82, 74], neck: [74, 82], hip: [50, 102],
        k1: [28, 106], a1: [6, 106], t1: [2, 103],
        e1: [78, 94], h1: [82, 106]
      })
    ]
  },

  /* ---- Day 12 ---- */

  /* A squat with the weights at the shoulders, driving up into a press. */
  thruster: {
    poses: [
      side({ ...near(SQUAT), e1: [68, 56], h1: [66, 43] }),
      side({ ...near(STANDING), e1: [62, 15], h1: [64, 2] })
    ]
  },

  /* Step back into a lunge; stand and punch forward on the way back up. */
  "reverse-lunge-punch": {
    poses: [
      { ...LUNGE, e1: GUARD.e, h1: GUARD.h, e2: [62, 64], h2: [66, 52] },
      {
        ...STANDING, a1: [72, 106], t1: [80, 108],
        e1: [74, 32], h1: [89, 32], e2: GUARD.e, h2: GUARD.h
      }
    ]
  },

  /* Hands on the chair seat, body inclined: knees drive in to the chest in turn. */
  "chair-climber": {
    duration: 1.2,
    props: ["M84 80 H108", "M86 80 V110", "M106 80 V110", "M108 54 V110"],
    poses: [
      {
        head: [88, 49], neck: [80, 56], hip: [57, 76],
        k1: [78, 82], a1: [66, 102], t1: [72, 104],
        k2: [40, 91], a2: [24, 106], t2: [30, 108],
        e1: [84, 68], h1: [88, 80], e2: [82, 68], h2: [86, 80]
      },
      {
        head: [88, 49], neck: [80, 56], hip: [57, 76],
        k1: [40, 91], a1: [24, 106], t1: [30, 108],
        k2: [76, 82], a2: [64, 102], t2: [70, 104],
        e1: [84, 68], h1: [88, 80], e2: [82, 68], h2: [86, 80]
      }
    ]
  }

};

/**
 * Which figure goes with which exercise of the programme, by position:
 * [day][block][exercise]. Positions are the same in every language file, so
 * one table serves them all. A day added to the programme without a row here
 * simply shows no figures.
 */
export const PROGRAMME_FIGURES = [
  [["chair-squat", "calf-raise"], ["reverse-lunge", "side-leg-raise"], ["glute-bridge", "kneeling-plank"]],
  [["bent-over-row", "overhead-press"], ["floor-fly", "wall-push-up"], ["chair-dip", "reverse-fly"]],
  [["march", "step-touch"], ["cross-knee-touch", "air-punch"], ["side-bend", "standing-twist"]],
  [["sumo-squat", "romanian-deadlift"], ["static-lunge", "front-leg-raise"], ["glute-bridge", "clamshell"]],
  [["squat-curl", "reverse-lunge-reach"], ["one-arm-row", "plank-shoulder-tap"], ["bird-dog", "bridge-heel-lift"]],
  [["seated-march", "seated-jack"], ["seated-leg-extension", "incline-push-up"], ["seated-crunch", "seated-knee-tuck"]],
  [["biceps-curl", "lateral-raise"], ["overhead-triceps", "wall-push-up"], ["t-raise", "cat-cow"]],
  [["dead-bug", "heel-taps"], ["heel-bridge", "donkey-kick"], ["scissor-kicks", "side-plank-knees"]],
  [["ski-swing", "side-step-touch-floor"], ["low-skip", "side-boxing"], ["knee-to-elbow", "arm-circles"]],
  [["single-leg-deadlift", "single-leg-chair-squat"], ["side-lunge", "single-leg-bridge"], ["plank-arm-reach", "russian-twist"]],
  [["standing-chest-press", "upright-row"], ["biceps-curl", "triceps-kickback"], ["forearm-plank", "cobra"]],
  [["thruster", "reverse-lunge-punch"], ["bent-over-row", "glute-bridge"], ["chair-climber", "forearm-plank"]]
];

/** The figure ids of one programme day, as [block][exercise], or null. */
export function figuresForDay(dayIndex) {
  return PROGRAMME_FIGURES[dayIndex] ?? null;
}

const LIMBS = {
  torso: ["neck", "hip"],
  curvedTorso: ["neck", "spine", "hip"],
  leg1: ["hip", "k1", "a1", "t1"],
  leg2: ["hip", "k2", "a2", "t2"],
  arm1: ["neck", "e1", "h1"],
  arm2: ["neck", "e2", "h2"]
};

function pathThrough(pose, joints) {
  return joints.map((joint, i) => `${i ? "L" : "M"}${pose[joint][0]} ${pose[joint][1]}`).join(" ");
}

function svgElement(name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

/**
 * Out, a beat at the far end, and back — eased, so it reads as a movement
 * rather than a metronome.
 */
function animation(attributeName, from, to, seconds) {
  return svgElement("animate", {
    attributeName,
    values: `${from};${to};${to};${from}`,
    keyTimes: "0;0.4;0.6;1",
    calcMode: "spline",
    keySplines: "0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1",
    dur: `${seconds}s`,
    repeatCount: "indefinite"
  });
}

/**
 * The figure as an <svg>, or null for an unknown id. With motion reduced it
 * stands still in the end pose, which is the one that shows the exercise.
 */
export function createFigure(id) {
  const figure = FIGURES[id];
  if (!figure) return null;
  const [start, end] = figure.poses;
  const animated = !prefersReducedMotion();
  const seconds = figure.duration ?? 2.4;
  const shown = animated ? start : end;

  const svg = svgElement("svg", {
    viewBox: "0 0 120 120",
    class: "figure",
    "aria-hidden": "true",
    focusable: "false"
  });

  if (figure.floor !== false) svg.appendChild(svgElement("path", { d: FLOOR, class: "figure-prop" }));
  for (const d of figure.props ?? []) {
    svg.appendChild(svgElement("path", { d, class: "figure-prop" }));
  }

  // Far limbs first, so the near ones are drawn over them.
  const torso = start.spine ? "curvedTorso" : "torso";
  for (const limb of ["leg2", "arm2", torso, "leg1", "arm1"]) {
    const joints = LIMBS[limb];
    const faded = limb.endsWith("2") && !figure.front;
    const path = svgElement("path", {
      d: pathThrough(shown, joints),
      class: faded ? "figure-limb far" : "figure-limb"
    });
    if (animated) {
      path.appendChild(animation("d", pathThrough(start, joints), pathThrough(end, joints), seconds));
    }
    svg.appendChild(path);
  }

  const head = svgElement("circle", { cx: shown.head[0], cy: shown.head[1], r: 7, class: "figure-head" });
  if (animated) {
    head.appendChild(animation("cx", start.head[0], end.head[0], seconds));
    head.appendChild(animation("cy", start.head[1], end.head[1], seconds));
  }
  svg.appendChild(head);

  return svg;
}
