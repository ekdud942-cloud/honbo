const API_URL = 'https://api.exchangerate-api.com/v4/latest/';

const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const convertBtn = document.getElementById('convert-btn');
const resultEl = document.getElementById('result');

function showResult(message, isError = false) {
  resultEl.textContent = message;
  resultEl.classList.toggle('error', isError);
}

async function convert() {
  const amount = parseFloat(amountInput.value);

  if (!Number.isFinite(amount) || amount < 0) {
    showResult('올바른 금액을 입력하세요', true);
    return;
  }

  const from = fromSelect.value;
  const to = toSelect.value;

  convertBtn.disabled = true;
  showResult('변환 중...');

  try {
    const response = await fetch(API_URL + from);
    if (!response.ok) throw new Error('HTTP ' + response.status);

    const data = await response.json();
    const rate = data.rates && data.rates[to];
    if (typeof rate !== 'number') throw new Error('환율 정보 없음');

    const converted = amount * rate;
    const fmt = (n) => n.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
    showResult(`${fmt(amount)} ${from} = ${fmt(converted)} ${to}`);
  } catch (err) {
    showResult('환율 정보를 가져오지 못했습니다. 잠시 후 다시 시도하세요', true);
  } finally {
    convertBtn.disabled = false;
  }
}

function swapCurrencies() {
  const from = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = from;

  // 금액이 입력되어 있으면 교환 후 자동 변환
  if (amountInput.value.trim() !== '') {
    convert();
  } else {
    showResult('');
  }
}

convertBtn.addEventListener('click', convert);
document.getElementById('swap-btn').addEventListener('click', swapCurrencies);
