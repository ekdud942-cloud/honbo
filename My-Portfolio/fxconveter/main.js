// 환율 API 주소 (뒤에 기준 통화 코드를 붙여서 호출)
const API_BASE = "https://api.exchangerate-api.com/v4/latest/";

const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const swapBtn = document.getElementById("swap-btn");
const convertBtn = document.getElementById("convert");
const resultBox = document.getElementById("result");

// 변환 결과를 결과 영역에 표시
function showResult(amount, from, converted, to) {
  resultBox.classList.remove("is-error");
  resultBox.textContent =
    `${formatNumber(amount)} ${from} = ${formatNumber(converted)} ${to}`;
}

// 안내/오류 메시지를 결과 영역에 표시
function showMessage(message) {
  resultBox.classList.add("is-error");
  resultBox.textContent = message;
}

// 천 단위 구분 기호를 넣고 소수점은 최대 2자리까지
function formatNumber(value) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

async function convert() {
  const amount = Number(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  // 입력값 검증
  if (amountInput.value.trim() === "" || Number.isNaN(amount)) {
    showMessage("금액을 숫자로 입력해 주세요.");
    return;
  }

  if (amount < 0) {
    showMessage("0 이상의 금액을 입력해 주세요.");
    return;
  }

  // 같은 통화끼리는 네트워크 요청 없이 처리
  if (from === to) {
    showResult(amount, from, amount, to);
    return;
  }

  convertBtn.disabled = true;
  swapBtn.disabled = true;
  resultBox.classList.remove("is-error");
  resultBox.textContent = "변환 중...";

  try {
    const res = await fetch(API_BASE + from);
    if (!res.ok) {
      throw new Error(`요청이 실패했습니다 (HTTP ${res.status})`);
    }

    const data = await res.json();
    const rate = data.rates && data.rates[to];

    if (typeof rate !== "number") {
      showMessage(`${to} 환율 정보를 가져올 수 없습니다.`);
      return;
    }

    showResult(amount, from, amount * rate, to);
  } catch (error) {
    showMessage(error.message || "환율 정보를 가져오지 못했습니다.");
  } finally {
    convertBtn.disabled = false;
    swapBtn.disabled = false;
  }
}

// From / To 통화를 서로 바꾸고, 금액이 있으면 바로 다시 변환
function swapCurrencies() {
  const previousFrom = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = previousFrom;

  if (amountInput.value.trim() !== "") convert();
}

convertBtn.addEventListener("click", convert);
swapBtn.addEventListener("click", swapCurrencies);

// 입력창에서 Enter 를 눌러도 변환되도록 처리
amountInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") convert();
});
