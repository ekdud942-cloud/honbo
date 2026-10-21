// 현재 카운트 값 (초기값 0)
let count = 0;

// 화면 요소 가져오기
const countEl = document.getElementById('count');
const increaseBtn = document.getElementById('increase');
const decreaseBtn = document.getElementById('decrease');
const resetBtn = document.getElementById('reset');

// 화면에 현재 숫자 반영
function render() {
  countEl.textContent = count;

  // 값에 따라 색상 클래스 적용 (0이면 둘 다 제거 → 기본색)
  countEl.classList.toggle('positive', count > 0);
  countEl.classList.toggle('negative', count < 0);
}

// 증가 버튼: 1 증가
increaseBtn.addEventListener('click', () => {
  count += 1;
  render();
});

// 감소 버튼: 1 감소
decreaseBtn.addEventListener('click', () => {
  count -= 1;
  render();
});

// 리셋 버튼: 0으로 초기화
resetBtn.addEventListener('click', () => {
  count = 0;
  render();
});
