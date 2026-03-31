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

export async function loadNodes(urlCandidates) {
  let lastError = null;
  for (const url of urlCandidates) {
    try {
      const csv = await fetchCsv(url);
      const nodes = parseCSV(csv);
      if (!nodes.length) throw new Error(`CSV 파싱 결과가 비어 있습니다. @ ${url}`);
      return { nodes, resolvedUrl: url };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("CSV 로드에 실패했습니다.");
}

export function buildEdges(nodes) {
  const map = new Map(nodes.map(n => [n.id, n]));
  const edges = [];
  const invalidLinks = [];

  nodes.forEach(n => {
    if (!n.links) return;
    String(n.links)
      .split(",")
      .map(v => v.trim())
      .filter(Boolean)
      .forEach(target => {
        if (map.has(target)) {
          edges.push({ source: n.id, target });
        } else {
          invalidLinks.push({ source: n.id, target });
        }
      });
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
