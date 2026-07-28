// ============================================================
//  날씨 앱  —  Open-Meteo API (무료 / API 키 불필요)
// ============================================================

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const STORAGE_KEY = "weather-app:last-place";

// ---------- WMO 날씨 코드 → 설명 / 아이콘 / 배경 테마 ----------
// https://open-meteo.com/en/docs  (WMO Weather interpretation codes)
const WEATHER_CODES = {
  0:  { text: "맑음",           day: "☀️", night: "🌙", theme: "clear" },
  1:  { text: "대체로 맑음",     day: "🌤️", night: "🌙", theme: "clear" },
  2:  { text: "구름 조금",       day: "⛅", night: "☁️", theme: "cloudy" },
  3:  { text: "흐림",           day: "☁️", night: "☁️", theme: "cloudy" },
  45: { text: "안개",           day: "🌫️", night: "🌫️", theme: "fog" },
  48: { text: "서리 안개",       day: "🌫️", night: "🌫️", theme: "fog" },
  51: { text: "약한 이슬비",     day: "🌦️", night: "🌧️", theme: "rain" },
  53: { text: "이슬비",         day: "🌦️", night: "🌧️", theme: "rain" },
  55: { text: "강한 이슬비",     day: "🌧️", night: "🌧️", theme: "rain" },
  56: { text: "어는 이슬비",     day: "🌧️", night: "🌧️", theme: "rain" },
  57: { text: "강한 어는 이슬비", day: "🌧️", night: "🌧️", theme: "rain" },
  61: { text: "약한 비",        day: "🌦️", night: "🌧️", theme: "rain" },
  63: { text: "비",            day: "🌧️", night: "🌧️", theme: "rain" },
  65: { text: "강한 비",        day: "🌧️", night: "🌧️", theme: "rain" },
  66: { text: "어는 비",        day: "🌧️", night: "🌧️", theme: "rain" },
  67: { text: "강한 어는 비",    day: "🌧️", night: "🌧️", theme: "rain" },
  71: { text: "약한 눈",        day: "🌨️", night: "🌨️", theme: "snow" },
  73: { text: "눈",            day: "❄️", night: "❄️", theme: "snow" },
  75: { text: "강한 눈",        day: "❄️", night: "❄️", theme: "snow" },
  77: { text: "싸락눈",         day: "🌨️", night: "🌨️", theme: "snow" },
  80: { text: "약한 소나기",     day: "🌦️", night: "🌧️", theme: "rain" },
  81: { text: "소나기",         day: "🌧️", night: "🌧️", theme: "rain" },
  82: { text: "강한 소나기",     day: "⛈️", night: "⛈️", theme: "rain" },
  85: { text: "약한 소낙눈",     day: "🌨️", night: "🌨️", theme: "snow" },
  86: { text: "강한 소낙눈",     day: "❄️", night: "❄️", theme: "snow" },
  95: { text: "천둥번개",       day: "⛈️", night: "⛈️", theme: "storm" },
  96: { text: "천둥번개, 우박",  day: "⛈️", night: "⛈️", theme: "storm" },
  99: { text: "천둥번개, 강한 우박", day: "⛈️", night: "⛈️", theme: "storm" },
};

const UNKNOWN = { text: "정보 없음", day: "❓", night: "❓", theme: "cloudy" };

function describe(code) {
  return WEATHER_CODES[code] || UNKNOWN;
}

function iconFor(code, isDay) {
  const w = describe(code);
  return isDay ? w.day : w.night;
}

function themeFor(code, isDay) {
  const t = describe(code).theme;
  // 맑음만 낮/밤 배경을 구분한다
  return t === "clear" ? (isDay ? "clear-day" : "clear-night") : t;
}

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

const els = {
  input: $("search-input"),
  locateBtn: $("locate-btn"),
  suggestions: $("suggestions"),
  status: $("status"),
  content: $("content"),
  place: $("place"),
  updated: $("updated"),
  currentIcon: $("current-icon"),
  currentTemp: $("current-temp"),
  condition: $("condition"),
  todayMax: $("today-max"),
  todayMin: $("today-min"),
  feelsLike: $("feels-like"),
  humidity: $("humidity"),
  wind: $("wind"),
  precip: $("precip"),
  sunrise: $("sunrise"),
  sunset: $("sunset"),
  uv: $("uv"),
  hourly: $("hourly"),
  daily: $("daily"),
};

// ---------- 상태 표시 ----------
function showLoading(message = "날씨를 불러오는 중…") {
  els.content.hidden = true;
  els.status.hidden = false;
  els.status.className = "status";
  els.status.innerHTML = `<div class="spinner"></div>${escapeHtml(message)}`;
}

function showError(message) {
  els.content.hidden = true;
  els.status.hidden = false;
  els.status.className = "status error";
  els.status.textContent = message;
}

function showContent() {
  els.status.hidden = true;
  els.content.hidden = false;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// ---------- 포맷 ----------
const round = (n) => (n === null || n === undefined ? "--" : Math.round(n));

// "2026-07-27T15:00" → 15
function hourOf(isoLocal) {
  return Number(isoLocal.slice(11, 13));
}

// "2026-07-27T06:32" → "06:32"
function timeOf(isoLocal) {
  return isoLocal.slice(11, 16);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-07-27" → 요일 인덱스. Date 파싱의 시간대 문제를 피하려고 직접 계산한다.
function weekdayOf(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// ---------- API ----------
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`요청이 실패했습니다 (HTTP ${res.status})`);
  }
  return res.json();
}

async function searchPlaces(query) {
  const url = `${GEO_URL}?name=${encodeURIComponent(query)}&count=6&language=ko&format=json`;
  const data = await fetchJson(url);
  return data.results || [];
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max",
    timezone: "auto",
    wind_speed_unit: "ms",
    forecast_days: "7",
  });
  return fetchJson(`${FORECAST_URL}?${params}`);
}

// ---------- 렌더링 ----------
function render(data, placeName) {
  const { current, hourly, daily } = data;
  const isDay = current.is_day === 1;

  document.body.dataset.theme = themeFor(current.weather_code, isDay);

  // 현재 날씨
  els.place.textContent = placeName;
  els.updated.textContent = `${timeOf(current.time)} 기준 · ${data.timezone}`;
  els.currentIcon.textContent = iconFor(current.weather_code, isDay);
  els.currentTemp.textContent = round(current.temperature_2m);
  els.condition.textContent = describe(current.weather_code).text;
  els.feelsLike.textContent = `${round(current.apparent_temperature)}°`;

  // 상세 지표
  els.todayMax.textContent = `${round(daily.temperature_2m_max[0])}°`;
  els.todayMin.textContent = `${round(daily.temperature_2m_min[0])}°`;
  els.humidity.textContent = `${round(current.relative_humidity_2m)}%`;
  els.wind.textContent = `${current.wind_speed_10m.toFixed(1)} m/s`;
  els.precip.textContent = `${round(daily.precipitation_probability_max[0])}%`;
  els.sunrise.textContent = timeOf(daily.sunrise[0]);
  els.sunset.textContent = timeOf(daily.sunset[0]);
  els.uv.textContent = round(daily.uv_index_max[0]);

  renderHourly(hourly, current.time);
  renderDaily(daily);

  showContent();
}

function renderHourly(hourly, currentTime) {
  // 현재 시각 이후 24시간만 보여준다 (ISO 문자열은 사전순 비교가 곧 시간순 비교)
  const currentHourIso = currentTime.slice(0, 13);
  let start = hourly.time.findIndex((t) => t.slice(0, 13) >= currentHourIso);
  if (start < 0) start = 0;

  const end = Math.min(start + 24, hourly.time.length);
  const items = [];

  for (let i = start; i < end; i++) {
    const isNow = i === start;
    const pop = hourly.precipitation_probability[i];
    items.push(`
      <li class="${isNow ? "now" : ""}">
        <span class="hour-time">${isNow ? "지금" : `${hourOf(hourly.time[i])}시`}</span>
        <span class="hour-icon">${iconFor(hourly.weather_code[i], hourly.is_day[i] === 1)}</span>
        <span class="hour-temp">${round(hourly.temperature_2m[i])}°</span>
        <span class="hour-pop">${pop >= 20 ? `${pop}%` : ""}</span>
      </li>
    `);
  }

  els.hourly.innerHTML = items.join("");
}

function renderDaily(daily) {
  // 주간 전체의 최저/최고를 기준으로 막대 위치를 잡는다
  const weekMin = Math.min(...daily.temperature_2m_min);
  const weekMax = Math.max(...daily.temperature_2m_max);
  const span = weekMax - weekMin || 1;

  const items = daily.time.map((date, i) => {
    const min = daily.temperature_2m_min[i];
    const max = daily.temperature_2m_max[i];
    const left = ((min - weekMin) / span) * 100;
    const width = Math.max(((max - min) / span) * 100, 4);

    const wd = weekdayOf(date);
    const weekendClass =
      wd === 6 ? "weekend-sat" : wd === 0 ? "weekend-sun" : "";
    const label = i === 0 ? "오늘" : WEEKDAYS[wd];

    return `
      <li>
        <span class="day-name ${weekendClass}">${label}</span>
        <span class="day-icon">${iconFor(daily.weather_code[i], true)}</span>
        <span class="day-bar"><span style="left:${left}%;width:${width}%"></span></span>
        <span class="day-temps">
          <span class="min">${round(min)}°</span><span class="max">${round(max)}°</span>
        </span>
      </li>
    `;
  });

  els.daily.innerHTML = items.join("");
}

// ---------- 동작 ----------
async function loadPlace(place) {
  hideSuggestions();
  els.input.blur();
  showLoading(`${place.name}의 날씨를 불러오는 중…`);

  try {
    const data = await fetchWeather(place.latitude, place.longitude);
    render(data, place.name);
    savePlace(place);
  } catch (err) {
    showError(`날씨를 불러오지 못했습니다. ${err.message}`);
  }
}

function savePlace(place) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(place));
  } catch {
    // 사생활 보호 모드 등에서 저장이 막혀도 앱 동작에는 지장이 없다
  }
}

function loadSavedPlace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const place = JSON.parse(raw);
    return typeof place?.latitude === "number" ? place : null;
  } catch {
    return null;
  }
}

// ---------- 자동완성 ----------
let suggestionItems = [];
let activeIndex = -1;

function hideSuggestions() {
  els.suggestions.hidden = true;
  els.suggestions.innerHTML = "";
  suggestionItems = [];
  activeIndex = -1;
}

function showSuggestions(places) {
  if (!places.length) {
    hideSuggestions();
    return;
  }

  suggestionItems = places;
  activeIndex = -1;

  els.suggestions.innerHTML = places
    .map((p, i) => {
      const region = [p.admin1, p.country].filter(Boolean).join(", ");
      return `<li data-index="${i}">${escapeHtml(p.name)}<span class="sug-region">${escapeHtml(region)}</span></li>`;
    })
    .join("");
  els.suggestions.hidden = false;
}

function highlight(index) {
  const lis = [...els.suggestions.children];
  lis.forEach((li, i) => li.classList.toggle("active", i === index));
  activeIndex = index;
}

// 입력이 멈춘 뒤에만 검색해서 불필요한 요청을 줄인다
let debounceTimer;
els.input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = els.input.value.trim();

  if (query.length < 1) {
    hideSuggestions();
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      showSuggestions(await searchPlaces(query));
    } catch {
      hideSuggestions();
    }
  }, 300);
});

els.input.addEventListener("keydown", (e) => {
  if (els.suggestions.hidden) {
    if (e.key === "Enter") searchAndLoadFirst();
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    highlight((activeIndex + 1) % suggestionItems.length);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    highlight((activeIndex - 1 + suggestionItems.length) % suggestionItems.length);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (activeIndex >= 0) loadPlace(suggestionItems[activeIndex]);
    else searchAndLoadFirst();
  } else if (e.key === "Escape") {
    hideSuggestions();
  }
});

async function searchAndLoadFirst() {
  const query = els.input.value.trim();
  if (!query) return;

  hideSuggestions();
  showLoading();

  try {
    const places = await searchPlaces(query);
    if (!places.length) {
      showError(`"${query}"에 해당하는 도시를 찾지 못했습니다.\n다른 이름으로 검색해 보세요.`);
      return;
    }
    loadPlace(places[0]);
  } catch (err) {
    showError(`검색에 실패했습니다. ${err.message}`);
  }
}

els.suggestions.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (li) loadPlace(suggestionItems[Number(li.dataset.index)]);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-bar")) hideSuggestions();
});

// ---------- 현재 위치 ----------
els.locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("이 브라우저에서는 위치 기능을 사용할 수 없습니다.");
    return;
  }

  hideSuggestions();
  showLoading("현재 위치를 확인하는 중…");
  els.locateBtn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      els.locateBtn.disabled = false;
      const place = {
        name: "현재 위치",
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      loadPlace(place);
    },
    (err) => {
      els.locateBtn.disabled = false;
      const reason =
        err.code === err.PERMISSION_DENIED
          ? "위치 권한이 거부되었습니다."
          : "현재 위치를 가져오지 못했습니다.";
      showError(`${reason}\n도시 이름으로 검색해 보세요.`);
    },
    { timeout: 10000, maximumAge: 300000 }
  );
});

// ---------- 시작 ----------
(function init() {
  const saved = loadSavedPlace();
  if (saved) {
    loadPlace(saved);
  } else {
    loadPlace({ name: "서울", latitude: 37.5665, longitude: 126.978 });
  }
})();
