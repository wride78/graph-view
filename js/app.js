import { MAIN_URL_CANDIDATES, NODE_URL_CANDIDATES, LOCAL_DEPTH } from "./config.js";
import { loadSheet, normalizeMainNodes, normalizeNodeRows, mergeNodes, buildEdges, buildAdjacency } from "./data.js";
import { setupPixi, createSimulation, createSprites, applyZoom, fitGraphToView } from "./graph.js";
import { setStatus, updateSummary, renderFilters, updateInfoPanel } from "./ui.js";

const state = {
  mainNodes: [], subNodes: [], allNodes: [], allEdges: [], invalidLinks: [], adjacency: new Map(),
  selectedNode: null, localMode: false, localDepth: LOCAL_DEPTH, currentScale: 1,
  activeGroup: "전체", activeStatus: "전체",
  app: null, container: null, edgeLayer: null, nodeLayer: null, labelLayer: null, simulation: null, nodeSprites: [],
  isPanning: false, panStart: { x: 0, y: 0 }, resolvedMainUrl: "", resolvedNodeUrl: "", draggedNode: null
};

function isMainNode(node) {
  return !!node.isMain || String(node.group || "").toLowerCase().includes("main") || String(node.id || "").toLowerCase() === "main";
}
function getNodeById(id) {
  return state.allNodes.find(n => String(n.id).trim() === String(id).trim()) || null;
}
function getNeighbors(id) {
  return Array.from(state.adjacency.get(String(id).trim()) || []).map(getNodeById).filter(Boolean);
}
function getFilteredNodes() {
  return state.allNodes.filter(n => {
    const groupPass = state.activeGroup === "전체" || (n.group || "미분류") === state.activeGroup;
    const statusPass = state.activeStatus === "전체" || (n.state || "미정") === state.activeStatus;
    return groupPass && statusPass;
  });
}
function getLocalIds(centerId, edges, depth = 1) {
  const cid = String(centerId).trim();
  const visited = new Set([cid]);
  const queue = [{ id: cid, level: 0 }];
  while (queue.length) {
    const { id, level } = queue.shift();
    if (level >= depth) continue;
    edges.forEach(e => {
      const next = e.source === id ? e.target : e.target === id ? e.source : null;
      if (next && !visited.has(next)) {
        visited.add(next);
        queue.push({ id: next, level: level + 1 });
      }
    });
  }
  return visited;
}
function getFilteredGraph() {
  const filteredNodes = getFilteredNodes();
  const ids = new Set(filteredNodes.map(n => String(n.id).trim()));
  let filteredEdges = state.allEdges.filter(e => ids.has(e.source) && ids.has(e.target));
  if (state.localMode && state.selectedNode && ids.has(String(state.selectedNode.id).trim())) {
    const localIds = getLocalIds(state.selectedNode.id, filteredEdges, state.localDepth);
    return { ids: localIds, edges: filteredEdges.filter(e => localIds.has(e.source) && localIds.has(e.target)) };
  }
  return { ids, edges: filteredEdges };
}
function focusOnNode(node) {
  const wrap = document.getElementById("graph-wrap");
  state.container.x = wrap.clientWidth * 0.5 - node.x * state.currentScale;
  state.container.y = wrap.clientHeight * 0.5 - node.y * state.currentScale;
}
function resetView() {
  const wrap = document.getElementById("graph-wrap");
  fitGraphToView(state, wrap.clientWidth, wrap.clientHeight, state.allNodes, 90);
}
function selectNode(id, focus = false) {
  const node = getNodeById(id);
  if (!node) return;
  state.selectedNode = node;
  updateInfoPanel(state.selectedNode, getNodeById, getNeighbors, selectNode);
  if (focus) focusOnNode(node);
}
function screenToWorld(clientX, clientY) {
  const rect = state.app.view.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  return { x: (localX - state.container.x) / state.currentScale, y: (localY - state.container.y) / state.currentScale };
}
function onNodeDragStart(node, event) {
  state.draggedNode = node;
  const p = event.data.global;
  const world = screenToWorld(p.x, p.y);
  node.fx = world.x;
  node.fy = world.y;
  selectNode(node.id, false);
  if (state.simulation) state.simulation.alphaTarget(0.18).restart();
}
function onNodeDragMove(node, event) {
  const p = event.data.global;
  const world = screenToWorld(p.x, p.y);
  node.fx = world.x;
  node.fy = world.y;
}
function onNodeDragEnd(node) {
  node.x = node.fx ?? node.x;
  node.y = node.fy ?? node.y;
  node.fx = null;
  node.fy = null;
  state.draggedNode = null;
  if (state.simulation) state.simulation.alphaTarget(0.03);
}
function renderScene() {
  if (!state.edgeLayer) return;
  const graph = getFilteredGraph();
  const visibleIds = graph.ids;
  const visibleEdges = graph.edges;
  const neighbors = state.selectedNode ? new Set(getNeighbors(state.selectedNode.id).map(n => String(n.id).trim())) : new Set();

  state.edgeLayer.clear();
  visibleEdges.forEach(e => {
    const s = getNodeById(e.source), t = getNodeById(e.target);
    if (!s || !t) return;
    const strong = state.selectedNode && (e.source === String(state.selectedNode.id).trim() || e.target === String(state.selectedNode.id).trim());
    const isMainLink = e.type === "main_link";
    state.edgeLayer.lineStyle(strong ? 3.2 : isMainLink ? 2.4 : 2.0, strong ? 0x93c5fd : isMainLink ? 0x8dd3c7 : 0x9fb5d6, strong ? 0.92 : isMainLink ? 0.72 : 0.62);
    state.edgeLayer.moveTo(s.x, s.y);
    state.edgeLayer.lineTo(t.x, t.y);
  });

  state.nodeSprites.forEach(item => {
    const n = item.node;
    const nid = String(n.id).trim();
    const visible = visibleIds.has(nid);
    item.g.visible = visible;
    item.label.visible = visible;
    if (!visible) return;

    const selected = state.selectedNode && String(state.selectedNode.id).trim() === nid;
    const neighbor = state.selectedNode && neighbors.has(nid);
    const main = isMainNode(n);

    let radius = main ? 42 : 32;
    let color = main ? 0x2f855a : 0x234a84;
    let alpha = 0.98;
    let textAlpha = 1;

    if (selected) { radius = Math.max(radius, 46); color = main ? 0x2f855a : 0x325ea8; alpha = 1; }
    else if (neighbor) { radius = Math.max(radius, 36); color = main ? 0x2b6f4b : 0x3b5fa4; alpha = 1; }
    else if (state.selectedNode) { alpha = 0.42; textAlpha = 0.55; }

    item.g.clear();
    item.g.lineStyle(3, 0xe2e8f0, 0.85);
    item.g.beginFill(color, alpha);
    item.g.drawCircle(0, 0, radius);
    item.g.endFill();
    item.g.x = n.x;
    item.g.y = n.y;

    item.label.x = n.x;
    item.label.y = n.y;
    item.label.alpha = textAlpha;
    item.label.style.fontSize = Math.max(10, Math.min(15, radius * 0.38));
    item.label.style.wordWrapWidth = Math.max(50, radius * 1.55);
    item.label.style.lineHeight = Math.max(12, radius * 0.44);
    if (!n.links && !state.selectedNode) {
      item.label.visible = true;
      item.label.alpha = 0.95;
    }
  });
}
function onFilter(type, value) {
  if (type === "group") state.activeGroup = value;
  if (type === "status") state.activeStatus = value;
  renderFilters(state.allNodes, state.activeGroup, state.activeStatus, onFilter);
  updateSummary(getFilteredNodes());
  updateInfoPanel(state.selectedNode, getNodeById, getNeighbors, selectNode);
}
function bindUi() {
  document.getElementById("zoomInBtn").addEventListener("click", () => {
    const wrap = document.getElementById("graph-wrap");
    applyZoom(state, 1.15, wrap.clientWidth / 2, wrap.clientHeight / 2);
  });
  document.getElementById("zoomOutBtn").addEventListener("click", () => {
    const wrap = document.getElementById("graph-wrap");
    applyZoom(state, 0.87, wrap.clientWidth / 2, wrap.clientHeight / 2);
  });
  document.getElementById("resetBtn").addEventListener("click", resetView);
  document.getElementById("searchInput").addEventListener("input", (e) => {
    const q = String(e.target.value || "").trim().toLowerCase();
    if (!q) return;
    const found = state.allNodes.find(n =>
      String(n.label || "").toLowerCase().includes(q) ||
      String(n.id || "").toLowerCase().includes(q) ||
      String(n.description || "").toLowerCase().includes(q) ||
      String(n.remarks || "").toLowerCase().includes(q)
    );
    if (found) selectNode(found.id, true);
  });
  document.getElementById("localBtn").addEventListener("click", () => {
    state.localMode = !state.localMode;
    document.getElementById("localBtn").classList.toggle("active", state.localMode);
  });
  state.app.view.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = state.app.view.getBoundingClientRect();
    applyZoom(state, e.deltaY > 0 ? 0.9 : 1.1, e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });
  state.app.view.addEventListener("mousedown", (e) => {
    if (e.target !== state.app.view) return;
    if (state.draggedNode) return;
    state.isPanning = True
