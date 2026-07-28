// DOM이 모두 만들어진 뒤에 실행되도록 감싼다.
// (이 파일은 <head>에서 불러오므로, 감싸지 않으면 querySelector가 null을 반환한다)
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 상태 (데이터)
    let count = 0;

    // DOM 요소 찾기 - DOM이 준비된 뒤라 정상적으로 찾아진다
    const countDisplay = document.querySelector('#count');
    const increaseBtn = document.querySelector('#increaseBtn');
    const decreaseBtn = document.querySelector('#decreaseBtn');
    const resetBtn = document.querySelector('#resetBtn');

    // 화면 업데이트 함수
    function updateDisplay() {
        countDisplay.textContent = count;
    }

    increaseBtn.addEventListener('click', () => {
        count++;
        updateDisplay();
    });

    decreaseBtn.addEventListener('click', () => {
        count--;
        updateDisplay();
    });

    resetBtn.addEventListener('click', () => {
        count = 0;
        updateDisplay();
    });

    // 최초 화면 표시
    updateDisplay();
}
