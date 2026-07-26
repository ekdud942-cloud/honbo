const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const convertButton = document.getElementById("convert");
const swapButton = document.getElementById("swap-btn");
const resultBox = document.getElementById("result");

const API_BASE = "https://api.exchangerate-api.com/v4/latest/";

function formatMoney(value) {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function showResult(amount, from, converted, to, rate) {
  resultBox.classList.remove("error");
  resultBox.innerHTML =
    `${formatMoney(amount)} ${from} = ${formatMoney(converted)} ${to}` +
    `<span class="rate">1 ${from} = ${rate.toLocaleString("ko-KR", { maximumFractionDigits: 4 })} ${to}</span>`;
}

function showMessage(message) {
  resultBox.classList.add("error");
  resultBox.textContent = message;
}

async function convert() {
  const amount = Number.parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (!Number.isFinite(amount)) {
    showMessage("금액을 숫자로 입력해 주세요.");
    return;
  }
  if (amount < 0) {
    showMessage("0 이상의 금액을 입력해 주세요.");
    return;
  }

  if (from === to) {
    showResult(amount, from, amount, to, 1);
    return;
  }

  convertButton.disabled = true;
  resultBox.classList.remove("error");
  resultBox.textContent = "변환 중...";

  try {
    const response = await fetch(API_BASE + from);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates && data.rates[to];
    if (typeof rate !== "number") {
      showMessage(`${to} 환율 정보를 가져올 수 없습니다.`);
      return;
    }

    showResult(amount, from, amount * rate, to, rate);
  } catch (error) {
    showMessage("환율 정보를 불러오지 못했습니다. 네트워크를 확인해 주세요.");
  } finally {
    convertButton.disabled = false;
  }
}

function swapCurrencies() {
  const previousFrom = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = previousFrom;

  if (amountInput.value.trim() !== "") {
    convert();
  }
}

convertButton.addEventListener("click", convert);
swapButton.addEventListener("click", swapCurrencies);
