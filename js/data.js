import { parseCSV, stripBom } from "./utils.js";

function decodeCsvBuffer(buffer) {
  let text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  text = stripBom(text);

  const looksBroken =
    text.includes("�") ||
    text.includes("ì") ||
    text.includes("ìž‘") ||
    text.includes("ì§„í–‰") ||
    text.includes("ì„¤ëª…");

  if (looksBroken) {
    try {
      const fallback = new TextDecoder("euc-kr", { fatal: false }).decode(buffer);
      const cleaned = stripBom(fallback);
      const fallbackBroken =
        cleaned.includes("�") ||
        cleaned.includes("ì") ||
        cleaned.includes("ìž‘") ||
        cleaned.includes("ì§„í–‰") ||
        cleaned.includes("ì„¤ëª…");

      if (!fallbackBroken) return cleaned;
    } catch (_) {}
  }
  return text;
}

async function fetchCsv(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CSV 요청 실패: HTTP ${res.status} @ ${url}`);
  const buffer = await res.arrayBuffer();
  return decodeCsvBuffer(buffer);
}

export async function loadSheet(urlCandidates) {
  let lastError = null;
  for (const url of urlCandidates) {
    try {
      const csv = await fetchCsv(url);
      const rows = parseCSV(csv);
      return { rows, resolvedUrl: url };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("시트 로드에 실패했습니다.");
}

export function normalizeMainNodes(rows) {
  return rows
    .filter(r => String(r["main-id"] || "").trim())
    .map(r => ({
      id: String(r["main-id"]).trim(),
      label: String(r["main-label"] || r["main-id"]).trim(),
      group: "main",
      description: r.description || "",
      remarks: r.remarks || "",
      state: "",
      manager: "",
      url: "",
      links: "",
      main_links: "",
      isMain: true
    }));
}

export function normalizeNodeRows(rows) {
  return rows
    .filter(r => String(r.id || "").trim())
    .map(r => ({
      id: String(r.id).trim(),
      label: String(r.label || r.id).trim(),
      links: r.links || "",
      main_links: r["main-links"] || "",
      group: r.group || "",
      description: r.description || "",
      url: r.url || "",
      manager: r.manager || "",
      state: r.state || "",
      remarks: r.remarks || "",
      isMain: false
    }));
}

export function mergeNodes(mainNodes, nodes) {
  return [...mainNodes, ...nodes];
}

export function buildEdges(allNodes, mainNodes, nodes) {
  const map = new Map(allNodes.map(n => [String(n.id).trim(), n]));
  const edges = [];
  const invalidLinks = [];

  const pushEdge = (source, target, type = "link") => {
    const s = String(source || "").trim();
    const t = String(target || "").trim();
    if (!s || !t) return;
    if (map.has(s) && map.has(t)) {
      edges.push({ source: s, target: t, type });
    } else {
      invalidLinks.push({ source: s, target: t, type });
    }
  };

  allNodes.forEach(n => {
    if (!n.links) return;
    String(n.links).split(",").map(v => String(v).trim()).filter(Boolean)
      .forEach(target => pushEdge(n.id, target, "link"));
  });

  nodes.forEach(n => {
    if (!n.main_links) return;
    String(n.main_links).split(",").map(v => String(v).trim()).filter(Boolean)
      .forEach(mainId => pushEdge(n.id, mainId, "main_link"));
  });

  return { edges, invalidLinks };
}

export function buildAdjacency(edges) {
  const map = new Map();
  edges.forEach(e => {
    if (!map.has(e.source)) map.set(e.source, new Set());
    if (!map.has(e.target)) map.set(e.target, new Set());
    map.get(e.source).add(e.target);
    map.get(e.target).add(e.source);
  });
  return map;
}
