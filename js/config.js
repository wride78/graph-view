export const SHEET_ID = "10Mxi3ZwBz2b7AgF-zDroRZhahTfsGdMDmbOvWXiv2Q8";
export const SHEET_NAME = "nodes";
export const SHEET_GID = "0";

export const NODES_URL_CANDIDATES = [
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`
];

export const LOCAL_DEPTH = 1;
export const SCALE_MIN = 0.35;
export const SCALE_MAX = 3.5;
export const LABEL_FONT_SIZE = 12;
export const LABEL_COLLISION_PADDING = 6;
