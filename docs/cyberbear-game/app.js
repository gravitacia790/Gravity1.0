const app = document.querySelector('#app');
const scenarios = window.CYBERBEAR_SCENARIOS;

let state = createState(null);

function createState(scenarioId) {
  const scenario = scenarios.find((item) => item.id === scenarioId) || null;
  return {
    scenarioId,
    scenario,
    nodeId: 'start',
    score: 0,
    turns: 0,
    safePicks: 0,
    riskyPicks: 0,
    history: [],
    flags: {},
    tip: scenario ? scenario.nodes.start.tip : '',
    coach: 'Я рядом. Выбирай действие — подскажу, где ловушка.',
    busy: false,
    ending: null
  };
}

function layout(content) {
  return `
    <div class="shell">
      <header class="brand">
        <img class="brand-mascot" src="assets/cyberbear.png" alt="" width="48" height="60" />
        <div>
          КИБЕРМИШКА
          <small>киберурок · цифровая безопасность</small>
        </div>
      </header>
      ${content}
    </div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function intro() {
  state = createState(null);
  app.innerHTML = layout(`
    <section class="intro intro-hub">
      <div class="intro-copy">
        <div class="eyebrow">Интерактивная новелла · 5–9 классы</div>
        <h1>Кто на том конце?</h1>
        <p>Четыре странных чата. Разные голоса, один экран. Открой любой — и посмотри, куда заведёт переписка.</p>
        <div class="intro-actions">
          <button class="secondary" id="rules" type="button">Как играть</button>
        </div>
      </div>
      <aside class="mascot-card">
        <img class="mascot-hero" src="assets/cyberbear.png" alt="Кибермишка — защитник детей от киберугроз" />
        <div class="mascot-message">Настоящие данные писать не нужно. Это учебный чат — я подскажу, где ловушка.</div>
        <ul class="mission-list">
          <li>4 сценария с ветками</li>
          <li>Уловки и давление в диалоге</li>
          <li>Победа — безопасный выход</li>
        </ul>
      </aside>
    </section>
    <section class="mission-grid" aria-label="Выбор миссии">
      ${scenarios
        .map(
          (scenario) => `
        <article class="mission-card">
          <div class="mission-cover-wrap">
            <img class="mission-cover" src="${escapeHtml(scenario.cover)}" alt="" />
            <span class="mission-emoji" aria-hidden="true">${scenario.avatar}</span>
          </div>
          <div class="mission-card-body">
            <h2>${escapeHtml(scenario.title)}</h2>
            <p>${escapeHtml(scenario.blurb)}</p>
            <ul class="tag-row">
              ${scenario.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}
            </ul>
            <button class="primary mission-start" type="button" data-scenario="${scenario.id}">
              Начать →
            </button>
          </div>
        </article>`
        )
        .join('')}
    </section>`);

  document.querySelector('#rules').addEventListener('click', () => {
    alert(
      'На каждом шаге выбирай один ответ.\n\n' +
        'Рискованный выбор не заканчивает игру сразу — диалог продолжится, уловки станут жёстче.\n\n' +
        'Победа: ты сам(а) завершаешь опасный разговор (блок + взрослый или проверка по известному контакту).'
    );
  });

  document.querySelectorAll('[data-scenario]').forEach((button) => {
    button.addEventListener('click', () => startGame(button.dataset.scenario));
  });
}

function startGame(scenarioId) {
  state = createState(scenarioId);
  if (!state.scenario) {
    intro();
    return;
  }
  const node = state.scenario.nodes.start;
  node.incoming.forEach((text) => pushMessage('them', text));
  state.tip = node.tip;
  renderGame();
}

function pushMessage(role, text) {
  state.history.push({ role, text });
}

function currentNode() {
  return state.scenario.nodes[state.nodeId];
}

function hasLeaks() {
  const f = state.flags;
  return Boolean(
    f.leakedSchool ||
      f.leakedDob ||
      f.sentCode ||
      f.agreedCode ||
      f.gaveIn ||
      f.openedLink ||
      f.filledForm ||
      f.paidFake ||
      f.leakedLogin ||
      f.sentPassword ||
      f.sentMoney ||
      f.askedRequisites
  );
}

function flagItems() {
  const map = [
    ['leakedSchool', 'Упомянута школа'],
    ['leakedDob', 'Названа дата рождения'],
    ['agreedCode', 'Согласие прислать СМС-код'],
    ['sentCode', 'Код «отправлен» (учебно)'],
    ['openedLink', 'Открыта подозрительная ссылка'],
    ['filledForm', 'Заполнена «анкета»'],
    ['paidFake', '«Оплата доставки»'],
    ['leakedLogin', 'Отправлен логин'],
    ['sentPassword', 'Отправлен пароль/код'],
    ['askedRequisites', 'Запрошены реквизиты'],
    ['sentMoney', 'Сделан учебный перевод'],
    ['gaveIn', 'Поддался(лась) на финальное давление']
  ];
  const items = map.filter(([key]) => state.flags[key]).map(([, label]) => label);
  if (!items.length) items.push('Личные данные пока в безопасности');
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderMessages() {
  const parts = ['<p class="time">Сегодня, 16:42</p>'];
  state.history.forEach((msg) => {
    if (msg.role === 'them') parts.push(`<div class="bubble">${escapeHtml(msg.text)}</div>`);
    else if (msg.role === 'me') parts.push(`<div class="bubble me">${escapeHtml(msg.text)}</div>`);
    else parts.push(`<div class="bubble system">${escapeHtml(msg.text)}</div>`);
  });
  return parts.join('');
}

function renderGame() {
  const scenario = state.scenario;
  const node = currentNode();
  app.innerHTML = layout(`
    <section class="game">
      <aside class="side-panel">
        <div class="side-card coach-card">
          <img class="coach-avatar" src="assets/cyberbear.png" alt="" />
          <div>
            <span class="coach-label">Кибермишка</span>
            <p id="coach-line">${escapeHtml(state.coach)}</p>
          </div>
        </div>
        <div class="side-card">
          <h2>${escapeHtml(scenario.title)} · ход ${state.turns + 1}</h2>
          <p id="tip-line">${escapeHtml(state.tip || node.tip)}</p>
          <div class="stats-row">
            <div><strong>${state.score}</strong><span>щит</span></div>
            <div><strong>${state.safePicks}</strong><span>безопасно</span></div>
            <div><strong>${state.riskyPicks}</strong><span>риск</span></div>
          </div>
        </div>
        <div class="side-card flags-card ${hasLeaks() ? 'warn' : ''}">
          <span class="coach-label">Статус данных</span>
          <ul class="flag-list">${flagItems()}</ul>
        </div>
        <button class="secondary side-exit" id="to-hub" type="button">← К миссиям</button>
      </aside>

      <section class="phone" aria-label="Учебная переписка">
        <header class="chat-top">
          <div class="avatar">${escapeHtml(scenario.avatar)}</div>
          <div>
            <div class="contact-name">${escapeHtml(scenario.contactName)}</div>
            <div class="contact-number">${escapeHtml(scenario.contactNumber)}</div>
          </div>
          <div class="status">в сети</div>
        </header>
        <div class="chat-body" id="messages">${renderMessages()}</div>
        <div class="decision" id="decision">
          <p class="decision-title">Что ты сделаешь?</p>
          <div class="choices">
            ${node.choices
              .map(
                (choice, index) => `
              <button class="choice" type="button" data-choice="${index}">
                <span class="choice-letter">${'АБВ'[index]}</span>
                <span>${escapeHtml(choice.text)}</span>
              </button>`
              )
              .join('')}
          </div>
        </div>
      </section>
    </section>`);

  document.querySelector('#messages').scrollTop = document.querySelector('#messages').scrollHeight;
  document.querySelector('#to-hub').addEventListener('click', intro);
  document.querySelectorAll('[data-choice]').forEach((button) => {
    button.addEventListener('click', () => choose(Number(button.dataset.choice)));
  });
}

function choose(index) {
  if (state.busy) return;
  const choice = currentNode().choices[index];
  if (!choice) return;

  state.busy = true;
  state.turns += 1;
  if (choice.safety === 'safe') {
    state.score += 1;
    state.safePicks += 1;
  } else if (choice.safety === 'risky') {
    state.riskyPicks += 1;
  }
  if (choice.flags) Object.assign(state.flags, choice.flags);
  if (choice.coach) state.coach = choice.coach;

  pushMessage('me', choice.player);
  const decision = document.querySelector('#decision');
  const messages = document.querySelector('#messages');
  decision.innerHTML = '<p class="decision-title">Кибермишка анализирует твой выбор…</p>';
  messages.innerHTML =
    renderMessages() +
    '<div class="typing" aria-label="Собеседник печатает"><i></i><i></i><i></i></div>';
  messages.scrollTop = messages.scrollHeight;

  const coach = document.querySelector('#coach-line');
  if (coach) coach.textContent = state.coach;

  window.setTimeout(() => {
    document.querySelector('.typing')?.remove();
    showFeedback(choice);
  }, 680);
}

function feedbackMeta(safety) {
  if (safety === 'safe') {
    return { title: 'Верное решение', icon: '🛡️', riskClass: '' };
  }
  if (safety === 'neutral') {
    return { title: 'Почти у цели', icon: '🔎', riskClass: '' };
  }
  return { title: 'Стоп, это уловка', icon: '⚠️', riskClass: 'risk' };
}

function showFeedback(choice) {
  if (choice.reply) {
    const replies = Array.isArray(choice.reply) ? choice.reply : [choice.reply];
    replies.forEach((text) => pushMessage('them', text));
  }

  const messages = document.querySelector('#messages');
  if (messages) {
    messages.innerHTML = renderMessages();
    messages.scrollTop = messages.scrollHeight;
  }

  const decision = document.querySelector('#decision');
  if (decision) {
    decision.innerHTML = '<p class="decision-title">Разбор выбора</p>';
  }

  const meta = feedbackMeta(choice.safety);
  const phone = document.querySelector('.phone');
  phone.querySelector('.feedback')?.remove();

  const isLast = Boolean(choice.end);
  phone.insertAdjacentHTML(
    'beforeend',
    `<div class="feedback ${meta.riskClass}">
      <h3>${meta.icon} ${meta.title}</h3>
      <p>${escapeHtml(choice.coach || '')}</p>
      <button class="mini-button" id="continue" type="button">
        ${isLast ? 'Посмотреть результат' : 'Продолжить →'}
      </button>
    </div>`
  );

  document.querySelector('#continue').addEventListener('click', () => advance(choice));
}

function advance(choice) {
  document.querySelector('.feedback')?.remove();

  if (choice.end) {
    state.ending = choice.end;
    const ending = state.scenario.endings[choice.end];
    pushMessage(
      'system',
      ending?.won
        ? 'Переписка завершена. Кибермишка фиксирует безопасный выход.'
        : 'Переписка завершена. Разберём, что улучшить.'
    );
    state.busy = false;
    renderResult();
    return;
  }

  const next = state.scenario.nodes[choice.next];
  if (!next) {
    state.ending = 'silent_exit';
    state.busy = false;
    renderResult();
    return;
  }

  state.nodeId = choice.next;
  state.tip = next.tip;

  const decision = document.querySelector('#decision');
  if (decision) {
    decision.innerHTML = '<p class="decision-title">Собеседник продолжает…</p>';
  }

  next.incoming.forEach((text, i) => {
    const delay = 320 + i * 480;
    window.setTimeout(() => {
      pushMessage('them', text);
      const messages = document.querySelector('#messages');
      if (messages) {
        messages.innerHTML = renderMessages();
        messages.scrollTop = messages.scrollHeight;
      }
      if (i === next.incoming.length - 1) {
        state.busy = false;
        renderGame();
      }
    }, delay);
  });
}

function renderResult() {
  const scenario = state.scenario;
  const ending = scenario.endings[state.ending] || {
    won: false,
    title: 'Тренировка завершена',
    text: 'Можно пройти миссию ещё раз и выбрать другие ответы.'
  };
  const won = ending.won;

  app.innerHTML = layout(`
    <section class="result">
      <div class="result-main ${won ? 'won' : 'learn'}">
        <div class="eyebrow">${won ? 'Миссия выполнена' : 'Тренировка продолжается'} · ${escapeHtml(scenario.title)}</div>
        <h1>${escapeHtml(ending.title)}</h1>
        <p>${escapeHtml(ending.text)}</p>
        <div class="result-score">
          <img class="result-bear" src="assets/cyberbear.png" alt="" />
          <div>
            <strong>${state.score}</strong>
            <span>очков щита · ходов: ${state.turns} · безопасно: ${state.safePicks} · риск: ${state.riskyPicks}</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="primary" id="replay" type="button">Пройти ещё раз</button>
          <button class="secondary" id="other" type="button">Другая миссия</button>
        </div>
      </div>
      <aside class="result-side">
        <h2>Запомни правила</h2>
        <ol class="takeaway">
          ${scenario.rules
            .map((rule, i) => `<li><b>${i + 1}</b><span>${escapeHtml(rule)}</span></li>`)
            .join('')}
        </ol>
        <div class="result-note">
          ${hasLeaks()
            ? 'В этом прохождении были рискованные шаги — попробуй оборвать разговор раньше.'
            : 'Данные остались при тебе. Можешь пройти другие миссии и сравнить уловки.'}
        </div>
      </aside>
    </section>`);

  document.querySelector('#replay').addEventListener('click', () => startGame(scenario.id));
  document.querySelector('#other').addEventListener('click', intro);
}

intro();
