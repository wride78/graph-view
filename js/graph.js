import { SCALE_MIN, SCALE_MAX, LABEL_FONT_SIZE, LABEL_COLLISION_PADDING, LABEL_SHOW_SCALE } from "./config.js";

export function setupPixi(wrap, renderScene) {
  const app = new PIXI.Application({
    width: wrap.clientWidth, height: wrap.clientHeight, backgroundAlpha: 0,
    antialias: true, resolution: window.devicePixelRatio || 1, autoDensity: true
  });
  wrap.appendChild(app.view);
  app.view.style.position = "absolute";
  app.view.style.left = "0";
  app.view.style.top = "0";
  app.view.style.width = "100%";
  app.view.style.height = "100%";

  const container = new PIXI.Container();
  const edgeLayer = new PIXI.Graphics();
  const labelLayer = new PIXI.Container();
  const nodeLayer = new PIXI.Container();
  container.addChild(edgeLayer);
  container.addChild(labelLayer);
  container.addChild(nodeLayer);
  app.stage.addChild(container);
  app.ticker.add(renderScene);

  window.addEventListener("resize", () => {
    app.renderer.resize(wrap.clientWidth, wrap.clientHeight);
  });
  return { app, container, edgeLayer, labelLayer, nodeLayer };
}

export function createSimulation(nodes, edges, wrapWidth, wrapHeight, isMainNode) {
  const sim = d3.forceSimulation(nodes)
    .alpha(1).alphaDecay(0.03).velocityDecay(0.35)
    .force("link", d3.forceLink(edges).id(d => String(d.id).trim()).distance(140).strength(0.22))
    .force("charge", d3.forceManyBody().strength(-420))
    .force("center", d3.forceCenter(wrapWidth / 2, wrapHeight / 2))
    .force("collision", d3.forceCollide().radius(d => isMainNode(d) ? 28 : 18));
  sim.on("tick", () => { if (sim.alpha() < 0.01) sim.alpha(0.012); });
  return sim;
}

function buildLabelBoxMetrics(label) {
  const paddingX = 10, paddingY = 6;
  const width = label.width + paddingX * 2;
  const height = label.height + paddingY * 2;
  return { width, height, paddingX, paddingY };
}

export function createSprites(nodes, nodeLayer, labelLayer, onSelect) {
  const nodeSprites = [];
  nodeLayer.removeChildren();
  labelLayer.removeChildren();
  nodes.forEach(node => {
    const g = new PIXI.Graphics();
    g.eventMode = "static";
    g.cursor = "pointer";
    g.on("pointerdown", (event) => { event.stopPropagation(); onSelect(node.id, true); });

    const labelGroup = new PIXI.Container();
    const labelBg = new PIXI.Graphics();
    const label = new PIXI.Text(node.label || node.id, {
      fill: 0xe5eefc, fontSize: LABEL_FONT_SIZE, fontFamily: "Arial", fontWeight: "600"
    });
    label.anchor.set(0.5, 0.5);

    const m = buildLabelBoxMetrics(label);
    label.x = 0;
    label.y = m.height / 2;

    labelGroup.addChild(labelBg);
    labelGroup.addChild(label);
    labelGroup.visible = true;

    nodeLayer.addChild(g);
    labelLayer.addChild(labelGroup);
    nodeSprites.push({ node, g, labelGroup, label, labelBg, labelBox: m });
  });
  return nodeSprites;
}

export function applyZoom(state, factor, pivotX, pivotY) {
  const nextScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, state.currentScale * factor));
  const actual = nextScale / state.currentScale;
  if (actual === 1) return;
  state.container.x = pivotX - (pivotX - state.container.x) * actual;
  state.container.y = pivotY - (pivotY - state.container.y) * actual;
  state.currentScale = nextScale;
  state.container.scale.set(state.currentScale);
}

export function fitGraphToView(state, wrapWidth, wrapHeight, nodes, padding = 80) {
  if (!nodes.length) return;
  const xs = nodes.map(n => n.x ?? 0), ys = nodes.map(n => n.y ?? 0);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const graphWidth = Math.max(1, maxX - minX), graphHeight = Math.max(1, maxY - minY);
  const scaleX = (wrapWidth - padding * 2) / graphWidth;
  const scaleY = (wrapHeight - padding * 2) / graphHeight;
  const scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, Math.min(scaleX, scaleY, 1.2)));
  state.currentScale = scale;
  state.container.scale.set(scale);
  const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
  state.container.x = wrapWidth / 2 - centerX * scale;
  state.container.y = wrapHeight / 2 - centerY * scale;
}

export function resolveLabelVisibility(nodeSprites, selectedNode, neighbors, currentScale) {
  const visibleCandidates = [];
  for (const item of nodeSprites) {
    const node = item.node;
    if (!item.g.visible) { item.labelGroup.visible = false; continue; }
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isNeighbor = selectedNode && neighbors.has(node.id);
    const alwaysShow = isSelected || isNeighbor;
    const scaleShow = !selectedNode && currentScale >= LABEL_SHOW_SCALE;
    const shouldShow = alwaysShow || scaleShow || !node.links;
    item.labelGroup.visible = shouldShow;
    if (!shouldShow) continue;
    const width = item.labelBox.width, height = item.labelBox.height + LABEL_COLLISION_PADDING;
    visibleCandidates.push({
      item,
      priority: isSelected ? 4 : isNeighbor ? 3 : !node.links ? 2 : 1,
      x: item.labelGroup.x - width / 2,
      y: item.labelGroup.y,
      w: width,
      h: height
    });
  }
  visibleCandidates.sort((a, b) => b.priority - a.priority);
  const accepted = [];
  for (const cand of visibleCandidates) {
    const overlap = accepted.some(a =>
      cand.x < a.x + a.w && cand.x + cand.w > a.x && cand.y < a.y + a.h && cand.y + cand.h > a.y
    );
    cand.item.labelGroup.visible = !overlap;
    if (!overlap) accepted.push(cand);
  }
}
