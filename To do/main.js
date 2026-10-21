const STORAGE_KEY = 'todos';

function loadTodos() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    // 저장 실패 시(용량 초과, 사생활 보호 모드 등) 메모리에서만 동작
  }
}

let todos = loadTodos();
let nextId = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;
let currentFilter = 'all';

function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input.value.trim();

  if (!text) {
    alert('할 일을 입력하세요');
    input.focus();
    return;
  }

  if (todos.some((t) => t.text === text)) {
    alert('이미 등록된 할 일입니다');
    input.focus();
    return;
  }

  todos.push({ id: nextId++, text, completed: false });
  input.value = '';
  input.focus();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  renderTodos();
}

function clearCompleted() {
  todos = todos.filter((t) => !t.completed);
  renderTodos();
}

function setFilter(filter) {
  currentFilter = filter;
  renderTodos();
}

function renderTodos() {
  saveTodos();

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === currentFilter);
  });

  const completedCount = todos.filter((t) => t.completed).length;
  document.getElementById('todo-count').textContent =
    `전체 ${todos.length}개, 완료 ${completedCount}개`;

  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  const visible = todos.filter((t) => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  visible.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-check';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-btn';
    delBtn.textContent = '삭제';
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.append(checkbox, span, delBtn);
    list.appendChild(li);
  });
}

function initApp() {
  // form submit이 추가 버튼 클릭과 Enter 키를 모두 처리
  document.querySelector('.todo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo();
  });
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  document.getElementById('clear-completed-btn').addEventListener('click', clearCompleted);

  renderTodos();
}

initApp();
