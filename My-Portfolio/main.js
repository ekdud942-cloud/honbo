// 프로젝트 카드 전체를 가져온다
const cards = document.querySelectorAll(".card");

cards.forEach((card, index) => {
  // 카드가 순서대로 나타나도록 지연 시간을 준다
  card.classList.add("card--reveal");
  card.style.animationDelay = `${index * 0.1}s`;

  // 카드 어디를 클릭해도 해당 프로젝트로 이동
  card.addEventListener("click", () => {
    goToProject(card);
  });

  // 키보드 사용자를 위해 Enter / Space 도 지원
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToProject(card);
    }
  });
});

// data-link 값으로 페이지 이동
function goToProject(card) {
  const link = card.dataset.link;
  if (link) {
    window.location.href = link;
  }
}
