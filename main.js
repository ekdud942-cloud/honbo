const cards = document.querySelectorAll(".card");

function openProject(card) {
  const link = card.dataset.link;
  if (link) {
    // 폴더명에 공백이 있어 경로를 인코딩해서 이동
    window.location.href = encodeURI(link);
  }
}

cards.forEach((card) => {
  card.addEventListener("click", () => openProject(card));

  // 키보드 접근성: Enter / Space 로도 이동
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openProject(card);
    }
  });
});
