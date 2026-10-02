const cards = document.querySelectorAll(".card");

cards.forEach((card) => {
  const delay = card.dataset.floatDelay || "0";
  card.style.setProperty("--delay", delay);
});

function getCenter(el, sceneRect) {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - sceneRect.left,
    y: rect.top + rect.height / 2 - sceneRect.top,
  };
}

function curvePath(p1, p2) {
  const midX = (p1.x + p2.x) / 2;
  const liftY = Math.min(p1.y, p2.y) - 50;
  return `M ${p1.x} ${p1.y} Q ${midX} ${liftY} ${p2.x} ${p2.y}`;
}

function updateConnectors() {
  const scene = document.querySelector(".scene");
  const svg = document.getElementById("connectorLines");
  const pathA = document.getElementById("pathA");
  const pathB = document.getElementById("pathB");

  if (!scene || cards.length < 3) return;

  const sceneRect = scene.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${sceneRect.width} ${sceneRect.height}`);

  const centers = Array.from(cards).map((card) => getCenter(card, sceneRect));

  pathA.setAttribute("d", curvePath(centers[0], centers[1]));
  pathB.setAttribute("d", curvePath(centers[1], centers[2]));
}

window.addEventListener("load", updateConnectors);
window.addEventListener("resize", updateConnectors);
