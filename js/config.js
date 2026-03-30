export const SHEET_ID = atob("MTBNeGkzWndCejJiN0FnRi16RHJvUlpocWhUZnNHZE1EbWJPdldYaXYyUTg=");
export const SHEET_NAME = "nodes";

export const NODES_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

export const LOCAL_DEPTH = 1;
export const SCALE_MIN = 0.35;
export const SCALE_MAX = 3.5;
