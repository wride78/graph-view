export const SHEET_ID = atob("MTBNeGkzWndCejJiN0FnRi16RHJvUlpocWhUZnNHZE1EbWJPdldYaXYyUTg=");

// 탭 이름 대신 gid 사용
export const SHEET_GID = "0";

export const NODES_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;

export const LOCAL_DEPTH = 1;
export const SCALE_MIN = 0.35;
export const SCALE_MAX = 3.5;
