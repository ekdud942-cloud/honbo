# 🗂 My Portfolio

바닐라 HTML / CSS / JavaScript로 만든 웹 프로젝트 3개를 모아둔 포트폴리오 페이지입니다.
빌드 도구나 외부 라이브러리 없이 `index.html`을 브라우저로 열면 바로 동작합니다.

## 포트폴리오 메인 페이지

다크 모드 기반의 카드형 레이아웃으로, 카드를 클릭하면 각 프로젝트로 이동합니다.

- **다크 테마** — `#0b0d12` 배경에 상단 radial-gradient 광원
- **반응형 그리드** — `repeat(auto-fit, minmax(280px, 1fr))`로 화면 폭에 따라 3열 → 1열 자동 전환
- **호버 인터랙션** — 카드가 위로 떠오르고 테두리가 밝아지며 화살표가 이동
- **키보드 접근성** — 카드에 `tabindex` / `role="link"`를 부여해 Tab 이동 후 Enter / Space로도 진입 가능

## 프로젝트 목록

| 프로젝트 | 설명 | 주요 기술 |
| --- | --- | --- |
| [Todo App](https://github.com/bridgeaiedu-jsu/My-todo-app) | 할 일 추가 / 완료 / 삭제, 필터링, 개수 집계 | LocalStorage, 이벤트 위임 |
| 환율 변환기 | 4개 통화 간 실시간 환율 변환 | Fetch API, async/await |
| 스네이크 게임 | 방향키로 조종하는 클래식 아케이드 게임 | Canvas 2D, LocalStorage |

### 📝 Todo App — `My-todo-app/`

할 일을 관리하는 목록 앱입니다. **별도 저장소를 서브모듈로 연결**했습니다.

- 할 일 추가 (버튼 또는 Enter), 체크박스로 완료 처리, 개별 삭제
- **전체 / 진행중 / 완료** 3가지 필터, 전체·완료 개수 실시간 집계
- 완료 항목 일괄 삭제 (확인 창을 거침)
- 공백만 입력하면 등록 차단, 앞뒤 공백·대소문자를 무시한 중복 검사
- LocalStorage(`my-todos`)에 자동 저장되어 새로고침 후에도 목록 유지
- 할 일 텍스트는 `innerHTML` 대신 `textContent`로 삽입해 XSS 방지

### 💱 환율 변환기 — `fxconveter/`

금액과 통화를 선택해 환산 결과를 보여줍니다.

- 지원 통화: **USD / EUR / KRW / JPY**
- `⇅ 통화 교환` 버튼으로 From ↔ To를 맞바꾸고, 금액이 입력된 상태면 즉시 재변환
- 결과와 함께 적용된 환율(`1 USD = 1,350.1234 KRW`)을 함께 표시
- 숫자가 아닌 값·음수 입력 시 안내 메시지, 요청 중에는 버튼 비활성화
- 같은 통화를 선택하면 네트워크 요청 없이 환율 1로 처리
- 네트워크 오류나 환율 누락 시에도 앱이 멈추지 않고 오류 메시지를 출력
- 환율 데이터: [exchangerate-api.com](https://www.exchangerate-api.com/) (API 키 불필요)

> ⚠️ 환율 조회에 인터넷 연결이 필요합니다.

### 🐍 스네이크 게임 — `Snake game/`

400×400 캔버스에 20×20 격자로 구현한 스네이크 게임입니다.

- **조작** — 방향키로 이동, 스페이스바로 일시정지 / 계속하기
- **난이도 4단계** — 쉬움(200ms) / 보통(150ms) / 어려움(100ms) / 매우 어려움(50ms), 게임 중 변경 시 즉시 반영
- **레벨 시스템** — 먹이 1개당 10점, 50점마다 레벨업하며 간격이 10ms씩 단축 (하한 30ms)
- 최고 점수를 LocalStorage(`snakeHighScore`)에 저장하고 갱신 시 `🎉 신기록!` 표시
- 벽·자기 몸 충돌 시 게임 오버, 오버레이로 점수·레벨·최고점 안내
- 한 틱에 방향 전환을 한 번만 확정해 연타로 몸에 파고드는 버그 방지, 180도 역방향 입력은 무시
- 먹이는 빈 칸 목록에서만 무작위로 배치되어 뱀 몸통과 겹치지 않음

## 실행 방법

별도의 설치나 서버 실행이 필요하지 않습니다.

```bash
git clone --recurse-submodules https://github.com/bridgeaiedu-jsu/My-portfolio.git
cd My-portfolio
```

이후 `index.html`을 브라우저로 열면 됩니다. (파일을 더블클릭해도 동작합니다.)

이미 `--recurse-submodules` 없이 클론했다면 아래로 서브모듈을 채울 수 있습니다.

```bash
git submodule update --init --recursive
```

## 파일 구조

```
My-portfolio/
├── index.html        # 포트폴리오 메인 (프로젝트 카드 3개)
├── style.css         # 다크 테마, 카드 그리드, 호버 효과
├── main.js           # 카드 클릭 / 키보드 이동 처리
├── .gitmodules       # 서브모듈 설정
├── My-todo-app/      # 📝 Todo App (서브모듈)
├── fxconveter/       # 💱 환율 변환기
│   ├── index.html
│   ├── style.css
│   └── main.js
└── Snake game/       # 🐍 스네이크 게임
    ├── index.html
    ├── style.css
    └── main.js
```

## 구현 참고 사항

- **의존성 없음** — 프레임워크·빌드 단계·패키지 매니저 없이 순수 HTML/CSS/JS로만 작성했습니다.
- **경로 인코딩** — `Snake game`처럼 폴더명에 공백이 있어, 카드 이동 시 `encodeURI()`로 경로를 인코딩합니다.
- **서브모듈** — Todo App은 자체 저장소가 있어 내용을 복사하지 않고 커밋 참조만 기록합니다.

## 기술 스택

- HTML5 (Canvas, `aria-live`)
- CSS3 (Grid, Flexbox, custom properties, `clamp()`, `radial-gradient`)
- JavaScript (ES6+, DOM API, Fetch API, async/await, LocalStorage)
