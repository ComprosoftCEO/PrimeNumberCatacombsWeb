/// How many units should one wall texture take up?
export const WALL_SCALE = 8;

//           Height
//    |    |        |    |
//    |    |/======\|    |
//    |    ||      ||    |
//    [Side][Center][Side]
//
export const WALL_HEIGHT = 18;
export const WALL_DEPTH = 1;
export const INSIDE_DEPTH = 30;

/// How wide is a single wall collection in WALL_SCALE units (Left + Center Arch + Right)
export const UNITS_WIDE = 3; /* Whole Number */

/// Total width of a single wall collection
export const TOTAL_WIDTH = UNITS_WIDE * WALL_SCALE;

/// How far out is the camera from the wall
export const CAMERA_DIST_OUT = 15;
