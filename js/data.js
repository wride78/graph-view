import { parseCSV } from "./utils.js";

export async function loadNodes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV 요청 실패: HTTP ${res.status}`);
  const csv = await res.text();
  const nodes = parseCSV(csv);
  if (!nodes.length) throw new Error("nodes 시트가 비어 있거나 CSV 파싱에 실패했습니다.");
  return nodes;
}

export function buildEdges(nodes) {
  const map = new Map(nodes.map(n => [n.id, n]));
  const edges = [];

  nodes.forEach(n => {
    if (!n.links) return;
    String(n.links).split(",").map(v => v.trim()).filter(Boolean).forEach(target => {
      if (map.has(target)) edges.push({ source: n.id, target });
    });
  });

  return edges;
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
