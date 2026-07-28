// LocalStorage에 저장할 때 사용할 key
const STORAGE_KEY = "my-todos";

// 할 일 데이터 (LocalStorage에서 불러온 뒤 이 배열로 화면을 그림)
let todos = [];

// 항목마다 고유 ID를 부여하기 위한 카운터
let nextId = 1;

// 현재 선택된 필터: "all" | "active" | "done" (화면 상태이므로 저장하지 않음)
let currentFilter = "all";

// 필터별로 목록이 비었을 때 보여줄 안내 문구
const EMPTY_MESSAGES = {
  all: "할 일이 없습니다. 위에 입력해 보세요!",
  active: "진행중인 할 일이 없습니다.",
  done: "완료된 할 일이 없습니다.",
};

// DOM 요소 가져오기
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const empty = document.getElementById("todo-empty");
const countTotal = document.getElementById("count-total");
const countDone = document.getElementById("count-done");
const filters = document.getElementById("todo-filters");
const clearBtn = document.getElementById("clear-done");

// 현재 배열을 LocalStorage에 저장
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// LocalStorage에서 할 일 목록을 불러옴
function load() {
  const saved = localStorage.getItem(STORAGE_KEY);

  // 저장된 게 없으면 (첫 방문) 빈 목록으로 시작
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);

    // 저장된 값이 배열이 아니면 신뢰할 수 없으니 버림
    if (!Array.isArray(parsed)) {
      return [];
    }

    // 형태가 올바른 항목만 남김 (예전 버전 데이터나 손상된 항목 방어)
    return parsed
      .filter((item) => item && typeof item.text === "string")
      .map((item) => ({
        id: Number(item.id),
        text: item.text,
        done: Boolean(item.done),
      }));
  } catch (error) {
    // JSON이 깨져 있으면 빈 목록으로 시작
    console.warn("저장된 할 일을 불러오지 못했습니다:", error);
    return [];
  }
}

// 중복 비교용으로 문자열을 다듬음
// (앞뒤 공백 제거 + 소문자 변환 + 중간 여러 칸 공백을 한 칸으로)
function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

// 같은 할 일이 이미 있는지 확인 (완료된 항목도 중복으로 봄)
function isDuplicate(text) {
  const target = normalize(text);
  return todos.some((todo) => normalize(todo.text) === target);
}

// 현재 필터에 해당하는 항목만 골라냄
function getVisibleTodos() {
  if (currentFilter === "active") {
    return todos.filter((todo) => !todo.done);
  }

  if (currentFilter === "done") {
    return todos.filter((todo) => todo.done);
  }

  return todos;
}

// 할 일 하나를 <li> 요소로 만드는 함수
function createItem(todo) {
  const li = document.createElement("li");
  li.className = "todo__item";
  li.dataset.id = todo.id;

  // 완료 상태면 취소선 클래스 추가
  if (todo.done) {
    li.classList.add("todo__item--done");
  }

  // 완료 체크박스
  const check = document.createElement("input");
  check.type = "checkbox";
  check.className = "todo__check";
  check.checked = todo.done;
  check.dataset.action = "toggle";

  // 할 일 텍스트 (textContent로 넣어 HTML이 그대로 삽입되지 않게 함)
  const text = document.createElement("span");
  text.className = "todo__text";
  text.textContent = todo.text;

  // 삭제 버튼
  const del = document.createElement("button");
  del.type = "button";
  del.className = "todo__delete";
  del.textContent = "삭제";
  del.dataset.action = "delete";

  li.append(check, text, del);
  return li;
}

// 전체 / 완료 개수를 갱신 (개수는 필터와 무관하게 항상 전체 기준)
function renderCount() {
  const done = todos.filter((todo) => todo.done).length;

  countTotal.textContent = `전체 ${todos.length}개`;
  countDone.textContent = `완료 ${done}개`;

  // 완료된 항목이 없으면 일괄 삭제 버튼을 비활성화
  clearBtn.disabled = done === 0;
}

// 필터 버튼 중 현재 선택된 것만 강조
function renderFilters() {
  const buttons = filters.querySelectorAll(".todo__filter");

  buttons.forEach((button) => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

// 배열 내용을 화면에 다시 그리는 함수
function render() {
  const visible = getVisibleTodos();

  list.innerHTML = "";

  visible.forEach((todo) => {
    list.appendChild(createItem(todo));
  });

  // 현재 필터에 보여줄 항목이 없을 때만 안내 문구 표시
  empty.textContent = EMPTY_MESSAGES[currentFilter];
  empty.hidden = visible.length > 0;

  renderFilters();
  renderCount();
}

// 배열이 바뀔 때마다 저장 + 다시 그리기를 한 번에
function update() {
  save();
  render();
}

// 할 일 추가
function addTodo(text) {
  todos.push({ id: nextId, text: text, done: false });
  nextId += 1;
  update();
}

// 완료/미완료 토글
function toggleTodo(id) {
  const todo = todos.find((item) => item.id === id);

  if (todo) {
    todo.done = !todo.done;
    update();
  }
}

// 항목 삭제
function deleteTodo(id) {
  todos = todos.filter((item) => item.id !== id);
  update();
}

// 완료된 항목 일괄 삭제
function clearDone() {
  const doneCount = todos.filter((todo) => todo.done).length;

  // 버튼이 비활성화되어 있어 보통 여기까지 오지 않지만 한 번 더 확인
  if (doneCount === 0) {
    return;
  }

  // 여러 개가 한 번에 사라지므로 되돌릴 수 없다는 점을 감안해 확인을 받음
  if (!confirm(`완료된 항목 ${doneCount}개를 삭제할까요?`)) {
    return;
  }

  todos = todos.filter((todo) => !todo.done);
  update();
}

function initApp() {
  // 저장된 할 일 불러오기
  todos = load();

  // 불러온 항목들과 ID가 겹치지 않도록 가장 큰 ID 다음 번호부터 시작
  todos.forEach((todo) => {
    if (todo.id >= nextId) {
      nextId = todo.id + 1;
    }
  });

  // 추가 버튼 클릭 + Enter 키 모두 form의 submit으로 처리됨
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = input.value.trim();

    // 빈 값(공백만 입력한 경우 포함)이면 알림 후 중단
    if (text === "") {
      alert("할 일을 입력하세요");
      input.focus();
      return;
    }

    // 이미 같은 할 일이 있으면 추가하지 않음 (입력값은 지우지 않고 남겨둠)
    if (isDuplicate(text)) {
      alert("이미 등록된 할 일입니다");
      input.select();
      return;
    }

    addTodo(text);

    // 입력창을 비우고 다시 포커스를 줘서 연속 입력이 편하게
    input.value = "";
    input.focus();
  });

  // 목록은 항목이 계속 바뀌므로 <ul>에서 이벤트 위임으로 한 번만 처리
  list.addEventListener("click", (event) => {
    const action = event.target.dataset.action;

    if (!action) {
      return;
    }

    const id = Number(event.target.closest(".todo__item").dataset.id);

    if (action === "toggle") {
      toggleTodo(id);
    } else if (action === "delete") {
      deleteTodo(id);
    }
  });

  // 필터 버튼도 이벤트 위임으로 처리
  filters.addEventListener("click", (event) => {
    const filter = event.target.dataset.filter;

    // 버튼 사이 빈 공간을 클릭했거나 이미 선택된 필터면 무시
    if (!filter || filter === currentFilter) {
      return;
    }

    currentFilter = filter;

    // 필터는 화면 상태일 뿐 데이터가 바뀐 게 아니라서 저장 없이 다시 그리기만
    render();
  });

  // 완료된 항목 일괄 삭제
  clearBtn.addEventListener("click", clearDone);

  // 불러온 데이터로 최초 화면 표시 (저장은 하지 않음)
  render();
}

initApp();
