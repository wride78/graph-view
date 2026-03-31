import { URL_MAIN, URL_NODE, MAIN_COLOR_MAP } from "./config.js";
import { loadData } from "./data.js";
import { createGraph } from "./graph.js";
import { showInfo } from "./ui.js";

(async () => {
  const main = await loadData(URL_MAIN);
  const nodesRaw = await loadData(URL_NODE);

  const nodes = [];
  const links = [];

  // 메인 노드
  main.slice(1).forEach(r => {
    if (!r[0]) return;
    nodes.push({
      id: String(r[0]).trim(),
      label: r[1],
      isMain: true
    });
  });

  // 일반 노드
  nodesRaw.slice(1).forEach(r => {
    if (!r[0]) return;
    nodes.push({
      id: String(r[0]).trim(),
      label: r[1],
      links: r[2],
      main: r[3],
      isMain: false
    });
  });

  // 링크 생성
  nodes.forEach(n => {
    if (n.links) {
      n.links.split(",").forEach(t => {
        const target = t.trim();
        if (target) {
          links.push({ source: n.id, target });
        }
      });
    }

    if (n.main) {
      n.main.split(",").forEach(m => {
        const target = m.trim();
        if (target) {
          links.push({ source: n.id, target });
        }
      });
    }
  });

  console.log("nodes:", nodes);
  console.log("links:", links);

  const app = new PIXI.Application({
    resizeTo: window,
    backgroundAlpha: 0
  });

  document.getElementById("graph").appendChild(app.view);

  createGraph(app, nodes, links, MAIN_COLOR_MAP);

  // 클릭 이벤트
  app.view.addEventListener("click", e => {
    const rect = app.view.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found = null;

    nodes.forEach(n => {
      if (n.x && n.y) {
        const dist = Math.hypot(n.x - x, n.y - y);
        if (dist < (n.isMain ? 25 : 15)) {
          found = n;
        }
      }
    });

    showInfo(found);
  });

})();
