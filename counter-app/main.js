// 카운터 현재 값 (초기값 0)
let count = 0;

// DOM 요소 가져오기
const display = document.getElementById("display");
const increaseBtn = document.getElementById("increase");
const decreaseBtn = document.getElementById("decrease");
const resetBtn = document.getElementById("reset");

// 화면에 현재 값을 다시 그리는 함수
function render() {
  display.textContent = count;

  // 값의 부호에 따라 색상 클래스 적용 (0이면 둘 다 제거해 기본색 유지)
  display.classList.toggle("is-positive", count > 0);
  display.classList.toggle("is-negative", count < 0);
}

// 증가 버튼: 1 증가
increaseBtn.addEventListener("click", () => {
  count += 1;
  render();
});

// 감소 버튼: 1 감소
decreaseBtn.addEventListener("click", () => {
  count -= 1;
  render();
});

// 리셋 버튼: 0으로 초기화
resetBtn.addEventListener("click", () => {
  count = 0;
  render();
});

// 최초 화면 표시
render();
