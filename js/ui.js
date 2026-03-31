import { escapeHtml } from "./utils.js";

export function setStatus(message, isError = false) {
  const box = document.getElementById("statusBox");
  box.textContent = message;
  box.classList.toggle("error", isError);
}
export function updateSummary(nodes) {
  document.getElementById("totalCount").textContent = nodes.length;
  document.getElementById("inProgressCount").textContent = nodes.filter(n => String(n.state || "").includes("진행")).length;
  document.getElementById("doneCount").textContent = nodes.filter(n => String(n.state || "").includes("완료")).length;
  document.getElementById("plannedCount").textContent = nodes.filter(n => String(n.state || "").includes("계획")).length;
}
export function renderFilters(allNodes, activeGroup, activeStatus, onFilter) {
  const groups = ["전체", ...new Set(allNodes.map(n => n.group || "미분류"))];
  const statuses = ["전체", ...new Set(allNodes.map(n => n.state || "미정"))];
  document.getElementById("groupFilters").innerHTML = groups.map(v =>
    `<button class="chip ${v === activeGroup ? "active" : ""}" data-type="group" data-value="${escapeHtml(v)}">${escapeHtml(v)}</button>`
  ).join("");
  document.getElementById("statusFilters").innerHTML = statuses.map(v =>
    `<button class="chip ${v === activeStatus ? "active" : ""}" data-type="status" data-value="${escapeHtml(v)}">${escapeHtml(v)}</button>`
  ).join("");
  document.querySelectorAll(".chip").forEach(el => {
    el.addEventListener("click", () => onFilter(el.getAttribute("data-type"), el.getAttribute("data-value")));
  });
}
export function updateInfoPanel(selectedNode, getNodeById, getNeighbors, onSelect) {
  const info = document.getElementById("info");
  if (!selectedNode) {
    info.innerHTML = `<div class="empty">그래프에서 노드를 선택하면 상세 정보와 관련 links 노드가 표시됩니다.</div>`;
    return;
  }
  const node = getNodeById(selectedNode.id);
  const neighbors = getNeighbors(node.id);
  info.innerHTML = `
    <div class="info-card">
      <div class="info-title">${escapeHtml(node.label || node.id)}</div>
      <div class="meta"><b>ID:</b> ${escapeHtml(node.id || "-")}</div>
      <div class="meta"><b>Group:</b> ${escapeHtml(node.group || "-")}</div>
      <div class="meta"><b>Manager:</b> ${escapeHtml(node.manager || "-")}</div>
      <div class="meta"><b>State:</b> ${escapeHtml(node.state || "-")}</div>
      ${node.url ? `<div class="meta"><a href="${escapeHtml(node.url)}" target="_blank" rel="noopener noreferrer">관련 링크 열기</a></div>` : ""}
      <div class="description">${escapeHtml(node.description || "")}</div>
      ${node.remarks ? `<div class="meta"><b>Remarks:</b> ${escapeHtml(node.remarks)}</div>` : ""}
    </div>
    <div class="section-title">Related Links Nodes</div>
    <div class="related-list">
      ${neighbors.length ? neighbors.map(n => `
        <div class="related-item" data-node-id="${escapeHtml(n.id)}">
          ${escapeHtml(n.label || n.id)}
          <small>${escapeHtml(n.group || "-")} · ${escapeHtml(n.state || "-")}</small>
        </div>`).join("") : `<div class="empty">연결된 노드가 없습니다.</div>`}
    </div>`;
  info.querySelectorAll(".related-item").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-node-id");
      if (id) onSelect(id, true);
    });
  });
}
