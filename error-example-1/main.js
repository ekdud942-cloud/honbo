// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// 앱 초기화 함수
function initApp() {
    // 상태 (데이터)
    let count = 0;

    // DOM 요소 찾기
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
}
