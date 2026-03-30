import { NODES_URL, LOCAL_DEPTH } from "./config.js";
import { loadNodes, buildEdges, buildAdjacency } from "./data.js";
import { setupPixi, createSimulation, createSprites, applyZoom } from "./graph.js";
import { setStatus, updateSummary, renderFilters, updateInfoPanel } from "./ui.js";

const state = {
  allNodes: [],
  allEdges: [],
  adjacency: new Map(),
  selectedNode: null,
  localMode: false,
  localDepth: LOCAL_DEPTH,
  currentScale: 1,
  activeGroup: "전체",
  activeStatus: "전체",
  app: null,
  container: null,
  edgeLayer: null,
  nodeLayer: null,
  labelLayer: null,
  simulation: null,
  nodeSprites: [],
  isPanning: false,
  panStart: { x: 0, y: 0 }
};

function isMainNode(node) {
  return String(node.group || "").toLowerCase().includes("main") || String(node.id || "").toLowerCase() === "main";
}

function getNodeById(id) {
  return state.allNodes.find(n => n.id === id) || null;
}

function getNeighbors(id) {
  return Array.from(state.adjacency.get(id) || []).map(getNodeById).filter(Boolean);
}

function getFilteredNodes() {
  return state.allNodes.filter(n => {
    const groupPass = state.activeGroup === "전체" || (n.group || "미분류") === state.activeGroup;
    const statusPass = state.activeStatus === "전체" || (n["진행현황"] || "미정") === state.activeStatus;
    return groupPass && statusPass;
  });
}

function getLocalIds(centerId, edges, depth = 1) {
  const visited = new Set([centerId]);
  const queue = [{ id: centerId, level: 0 }];

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
  const ids = new Set(filteredNodes.map(n => n.id));
  let filteredEdges = state.allEdges.filter(e => ids.has(e.source) && ids.has(e.target));

  if (state.localMode && state.selectedNode && ids.has(state.selectedNode.id)) {
    const localIds = getLocalIds(state.selectedNode.id, filteredEdges, state.localDepth);
    return {
      ids: localIds,
      edges: filteredEdges.filter(e => localIds.has(e.source) && localIds.has(e.target))
    };
  }

  return { ids, edges: filteredEdges };
}

function focusOnNode(node) {
  const wrap = document.getElementById("graph-wrap");
  state.container.x = wrap.clientWidth * 0.5 - node.x * state.currentScale;
  state.container.y = wrap.clientHeight * 0.5 - node.y * state.currentScale;
}

function resetView() {
  state.currentScale = 1;
  state.container.scale.set(1);
  const wrap = document.getElementById("graph-wrap");
  state.container.x = wrap.clientWidth * 0.08;
  state.container.y = wrap.clientHeight * 0.08;
  if (state.selectedNode) focusOnNode(state.selectedNode);
}

function selectNode(id, focus = false) {
  const node = getNodeById(id);
  if (!node) return;
  state.selectedNode = node;
  updateInfoPanel(state.selectedNode, getNodeById, getNeighbors, selectNode);
  if (focus) focusOnNode(node);
}

function renderScene() {
  if (!state.edgeLayer) return;

  const graph = getFilteredGraph();
  const visibleIds = graph.ids;
  const visibleEdges = graph.edges;
  const neighbors = state.selectedNode ? new Set(getNeighbors(state.selectedNode.id).map(n => n.id)) : new Set();

  state.edgeLayer.clear();

  visibleEdges.forEach(e => {
    const s = getNodeById(e.source);
    const t = getNodeById(e.target);
    if (!s || !t) return;

    const strong = state.selectedNode && (e.source === state.selectedNode.id || e.target === state.selectedNode.id);
    state.edgeLayer.lineStyle(strong ? 2 : 1, strong ? 0x93c5fd : 0xcbd5e1, strong ? 0.62 : 0.16);
    state.edgeLayer.moveTo(s.x, s.y);
    state.edgeLayer.lineTo(t.x, t.y);
  });

  state.nodeSprites.forEach(item => {
    const n = item.node;
    const visible = visibleIds.has(n.id);
    item.g.visible = visible;
    item.label.visible = false;
    if (!visible) return;

    const selected = state.selectedNode && state.selectedNode.id === n.id;
    const neighbor = state.selectedNode && neighbors.has(n.id);
    const main = isMainNode(n);

    let radius = main ? 9 : 5;
    let color = main ? 0xfbbf24 : 0x7dd3fc;
    let alpha = 0.92;

    if (selected) {
      radius = 14;
      color = 0xffffff;
      alpha = 1;
    } else if (neighbor) {
      radius = Math.max(radius, 8);
      color = 0xa78bfa;
      alpha = 1;
    } else if (state.selectedNode) {
      alpha = 0.18;
      color = main ? 0xfbbf24 : 0x64748b;
    }

    item.g.clear();
    item.g.beginFill(color, alpha);
    item.g.drawCircle(0, 0, radius);
    item.g.endFill();
    item.g.x = n.x;
    item.g.y = n.y;
    item.label.x = n.x;
    item.label.y = n.y;

    if (selected || neighbor || (!state.selectedNode && state.currentScale > 1.25)) {
      item.label.visible = true;
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
      String(n.description || "").toLowerCase().includes(q)
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
    state.isPanning = true;
    state.panStart = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener("mousemove", (e) => {
    if (!state.isPanning) return;
    state.container.x += e.clientX - state.panStart.x;
    state.container.y += e.clientY - state.panStart.y;
    state.panStart = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener("mouseup", () => {
    state.isPanning = false;
  });
}

async function init() {
  setStatus("CSV 데이터를 불러오는 중...");

  const wrap = document.getElementById("graph-wrap");
  const pixi = setupPixi(wrap, renderScene);
  state.app = pixi.app;
  state.container = pixi.container;
  state.edgeLayer = pixi.edgeLayer;
  state.labelLayer = pixi.labelLayer;
  state.nodeLayer = pixi.nodeLayer;

  bindUi();

  state.allNodes = await loadNodes(NODES_URL);
  setStatus(`노드 ${state.allNodes.length}개 로드 완료. edges 생성 중...`);

  state.allEdges = buildEdges(state.allNodes);
  state.adjacency = buildAdjacency(state.allEdges);

  state.nodeSprites = createSprites(state.allNodes, state.nodeLayer, state.labelLayer, selectNode);
  state.simulation = createSimulation(state.allNodes, state.allEdges, isMainNode);

  renderFilters(state.allNodes, state.activeGroup, state.activeStatus, onFilter);
  updateSummary(getFilteredNodes());

  const mainNode = state.allNodes.find(isMainNode) || state.allNodes[0];
  if (mainNode) selectNode(mainNode.id, false);
  resetView();

  setStatus(`정상 로드 완료: nodes ${state.allNodes.length}, edges ${state.allEdges.length}`);
}

init().catch(err => {
  console.error(err);
  setStatus(`그래프 로드 실패\n${err.message}`, true);
  document.getElementById("info").innerHTML = `<div class="empty">데이터를 불러오지 못했습니다.</div>`;
});
