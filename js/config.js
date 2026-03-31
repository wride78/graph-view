export const SHEET_ID = "10Mxi3ZwBz2b7AgF-zDroRZhahTfsGdMDmbOvWXiv2Q8";
export const MAIN_SHEET_NAME = "main_nodes";
export const NODE_SHEET_NAME = "nodes";
export const MAIN_URL_CANDIDATES = [
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(MAIN_SHEET_NAME)}`
];
export const NODE_URL_CANDIDATES = [
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=1`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(NODE_SHEET_NAME)}`
];
export const LOCAL_DEPTH = 1;
export const SCALE_MIN = 0.35;
export const SCALE_MAX = 3.5;
