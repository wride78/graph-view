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
  container.addChild(labelLayer);
  container.addChild(nodeLayer);
  app.stage.addChild(container);
  app.ticker.add(renderScene);

  window.addEventListener("resize", () => {
    app.renderer.resize(wrap.clientWidth, wrap.clientHeight);
  });

  return { app, container, edgeLayer, labelLayer, nodeLayer };
}

export function createSimulation(nodes, edges, isMainNode) {
  return d3.forceSimulation(nodes)
    .alpha(0.9)
    .alphaDecay(0.025)
    .velocityDecay(0.36)
    .force("link", d3.forceLink(edges).id(d => d.id).distance(110).strength(0.14))
    .force("charge", d3.forceManyBody().strength(-260))
    .force("center", d3.forceCenter(420, window.innerHeight * 0.5))
    .force("collision", d3.forceCollide().radius(d => isMainNode(d) ? 18 : 11));
}

export function createSprites(nodes, nodeLayer, labelLayer, onSelect) {
  const nodeSprites = [];
  nodeLayer.removeChildren();
  labelLayer.removeChildren();

  nodes.forEach(node => {
    const g = new PIXI.Graphics();
    g.eventMode = "static";
    g.cursor = "pointer";
    g.on("pointerdown", (event) => {
      event.stopPropagation();
      onSelect(node.id, true);
    });

    const label = new PIXI.Text(node.label || node.id, {
      fill: 0xdbeafe,
      fontSize: 12,
      fontFamily: "Arial"
    });
    label.anchor.set(0.5, 1.8);
    label.visible = false;

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
