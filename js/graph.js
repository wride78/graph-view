import { SCALE_MIN, SCALE_MAX } from "./config.js";

export function setupPixi(wrap, renderScene) {
  const app = new PIXI.Application({
    width: wrap.clientWidth,
    height: wrap.clientHeight,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
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
  container.addChild(nodeLayer);
  container.addChild(labelLayer);
  app.stage.addChild(container);
  app.ticker.add(renderScene);

  window.addEventListener("resize", () => {
    app.renderer.resize(wrap.clientWidth, wrap.clientHeight);
  });
  return { app, container, edgeLayer, labelLayer, nodeLayer };
}

export function createSimulation(nodes, edges, wrapWidth, wrapHeight, isMainNode) {
  const sim = d3.forceSimulation(nodes)
    .alpha(1)
    .alphaDecay(0.03)
    .velocityDecay(0.35)
    .force("link", d3.forceLink(edges).id(d => String(d.id).trim()).distance(140).strength(0.22))
    .force("charge", d3.forceManyBody().strength(-420))
    .force("center", d3.forceCenter(wrapWidth / 2, wrapHeight / 2))
    .force("collision", d3.forceCollide().radius(d => isMainNode(d) ? 32 : 24));
  sim.on("tick", () => { if (sim.alpha() < 0.01) sim.alpha(0.012); });
  return sim;
}

function getWrappedStyle(radius) {
  return new PIXI.TextStyle({
    fill: 0xffffff,
    fontSize: Math.max(10, Math.min(14, radius * 0.42)),
    fontFamily: "Arial",
    fontWeight: "700",
    align: "center",
    wordWrap: true,
    wordWrapWidth: Math.max(48, radius * 1.65),
    breakWords: true,
    lineHeight: Math.max(12, radius * 0.46)
  });
}

export function createSprites(nodes, nodeLayer, labelLayer, handlers) {
  const nodeSprites = [];
  nodeLayer.removeChildren();
  labelLayer.removeChildren();

  nodes.forEach(node => {
    const g = new PIXI.Graphics();
    g.eventMode = "static";
    g.cursor = "pointer";
    let dragging = false;

    g.on("pointerdown", (event) => {
      event.stopPropagation();
      dragging = true;
      g.cursor = "grabbing";
      handlers.onDragStart?.(node, event);
    });
    g.on("pointermove", (event) => {
      if (!dragging) return;
      handlers.onDragMove?.(node, event);
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      g.cursor = "pointer";
      handlers.onDragEnd?.(node);
    };
    g.on("pointerup", endDrag);
    g.on("pointerupoutside", endDrag);
    g.on("pointertap", (event) => {
      event.stopPropagation();
      handlers.onSelect?.(node.id, false);
    });

    const label = new PIXI.Text(node.label || node.id, getWrappedStyle(20));
    label.anchor.set(0.5, 0.5);
    label.visible = true;

    nodeLayer.addChild(g);
    labelLayer.addChild(label);
    nodeSprites.push({ node, g, label });
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
  const scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, Math.min(scaleX, scaleY, 1.15)));
  state.currentScale = scale;
  state.container.scale.set(scale);
  const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
  state.container.x = wrapWidth / 2 - centerX * scale;
  state.container.y = wrapHeight / 2 - centerY * scale;
}
