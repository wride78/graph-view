export const SHEET_ID = atob("MTBNeGkzWndCejJiN0FnRi16RHJvUlpocWhUZnNHZE1EbWJPdldYaXYyUTg=");
export const SHEET_NAME = "nodes";
export const SHEET_GID = "0";

// 먼저 gid로 시도하고, 실패하면 sheet 이름으로 fallback
export const NODES_URL_CANDIDATES = [
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`
];

export const LOCAL_DEPTH = 1;
export const SCALE_MIN = 0.35;
export const SCALE_MAX = 3.5;
