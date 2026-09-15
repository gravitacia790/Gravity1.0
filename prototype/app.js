 (async () => {
  const data = await (window.CYBER_DATA_READY || Promise.resolve(Array.isArray(window.CYBER_DATA) ? window.CYBER_DATA : []));
  data.forEach((record) => {
    const shortName = window.CYBER_REGISTRY_SHORT_NAMES?.[record.id];
    if (shortName) record.school = shortName;
  });
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const issueDefinitions = [
    { key: 'participation', label: 'Неполное участие класса', short: 'Участие', weight: 2, color: '#62e5c2' },
    { key: 'data', label: 'Ошибки в данных платформы', short: 'Данные', weight: 2, color: '#6688f5' },
    { key: 'login', label: 'Логины и пароли учеников', short: 'Вход', weight: 2, color: '#f3b64a' },
    { key: 'tech', label: 'Техника и интернет', short: 'Техника', weight: 2, color: '#eb6c70' },
    { key: 'schedule', label: 'Расписание на платформе', short: 'Расписание', weight: 1, color: '#a995ed' },
    { key: 'director', label: 'Доступ директора', short: 'Директор', weight: 1, color: '#8ab7ef' },
    { key: 'materials', label: 'Методические материалы', short: 'Материалы', weight: 1, color: '#7ab7a6' },
    { key: 'unresolved', label: 'Нерешённые проблемы', short: 'Открытые вопросы', weight: 1, color: '#ee8f70' },
  ];

  const recommendationMap = {
    participation: {
      school: 'До урока провести короткий тестовый вход с представителем класса и назначить взрослого, который помогает детям первые 5–7 минут.',
      organizer: 'Предусмотреть сценарий массового входа и режим работы по подгруппам для больших классов; сократить обязательный объём одного занятия.',
      check: 'На двух следующих занятиях зафиксировать долю учеников, которые вошли и завершили ключевое задание; ориентир для проверки — не менее 90%.',
    },
    data: {
      school: 'Сверить список классов, педагогов и численность учеников с МЭШ; собрать расхождения в одном списке с указанием класса и литеры.',
      organizer: 'Проверить синхронизацию источника данных и дать школе понятный канал с номером обращения и сроком обратной связи.',
      check: 'После обновления сопоставить 3–5 контрольных классов: педагог, литера, число и пофамильный список учеников должны совпадать.',
    },
    login: {
      school: 'Назначить ответственного за выдачу логинов и паролей до урока; для младших классов подготовить крупные карточки или рассадку по парам.',
      organizer: 'Сформировать пофамильную выгрузку доступа по классам и предложить более простой первый вход для начальной школы.',
      check: 'Выборочно проверить вход учеников из каждого параллеля и наличие данных у всех классов, заявленных в расписании.',
    },
    tech: {
      school: 'Провести пробный вход с нескольких рабочих мест, проверить сеть в кабинете и заранее определить план Б: пары, подгруппы или раздаточный материал.',
      organizer: 'Зафиксировать минимальные технические требования и маршрут эскалации для школ, где не хватает устройств или нестабилен интернет.',
      check: 'Перед уроком одновременно подключить контрольную группу устройств и замерить: сеть держится, платформа открывается, рабочие места покрывают класс.',
    },
    schedule: {
      school: 'Сверить расписание Киберуроков с МЭШ и отметить отсутствующие или лишние классы; назначить одного проверяющего от школы.',
      organizer: 'Проверить обмен расписанием и показать школе, какие поля формируются автоматически, а какие требуют обращения.',
      check: 'Все классы из школьного расписания видны на платформе, имеют корректный статус занятия и правильную дату.',
    },
    director: {
      school: 'Назначить директора или школьного куратора владельцем контроля: раз в неделю смотреть доступ, активность классов и открытые обращения.',
      organizer: 'Выдать роли директора/куратора и дать короткий маршрут входа без поиска ссылки по переписке.',
      check: 'Директор самостоятельно входит в кабинет и видит сводную статистику по всем классам школы.',
    },
    materials: {
      school: 'Собрать от педагогов список материалов, которые требуют доработки, и разделить запросы на обязательные и желательные.',
      organizer: 'Обновлять спорные материалы и дать методический комментарий: что можно сократить в рамках 45 минут.',
      check: 'Педагог проводит занятие по материалам в пределах урока и не создаёт отдельный ручной пакет инструкций.',
    },
    unresolved: {
      school: 'Свести все открытые вопросы в один список: проблема, класс, дата обращения, ответственный и ожидаемая дата проверки.',
      organizer: 'Дать каждой заявке понятный статус и срок следующего ответа; повторяющиеся вопросы превратить в FAQ или короткий алгоритм.',
      check: 'У каждой проблемы появляется статус «решено/в работе», ответственный и подтверждение результата со стороны школы.',
    },
  };

  const riskPoints = {
    participation: {
      'Практически весь класс': 0,
      'Большая часть класса': 1,
      'Только отдельные ученики': 2,
      'Пока не удаётся организовать работу': 3,
    },
    data: {
      'Да, всё корректно': 0,
      'Есть отдельные несоответствия': 1,
      'Не могу проверить': 2,
      'Данные отображаются значительно некорректно': 3,
    },
    login: {
      'Да, у всех': 0,
      'У большинства (не все ученики добавлены на платформу)': 1,
      'Не понятен принцип распределения логинов и паролей': 2,
      'Нет класса(ов) на платформе': 3,
      'Логины и пароли не работают': 3,
    },
    tech: {
      'Да, полностью': 0,
      'Используем работу в парах': 1,
      'Оборудования или интернета недостаточно': 3,
    },
    schedule: {
      'Да, расписание и статусы занятий настроены': 0,
      'Настроено частично': 1,
      'Расписание не настроено': 3,
      'Есть ошибки или занятия не отображаются': 3,
    },
    materials: {
      'Да, материалов достаточно': 0,
      'Материалы используются, но требуют доработки': 1,
      'Педагогам нужна дополнительная консультация': 1,
      'Не хватает методических или раздаточных материалов': 2,
    },
    unresolved: {
      'Нет': 0,
      'Да, технические': 1,
      'Да, связанные с классами, педагогами или учениками': 2,
      'Да, связанные с организацией занятий': 2,
    },
    director: { Да: 0, Нет: 2, 'Не могу зайти': 2 },
  };

  const normalize = (value) => String(value || '').toLowerCase().replaceAll('ё', 'е').trim();
  const isGoodParticipation = (record) => /практически весь|весь класс|весь/.test(normalize(record.participation));
  const isAdequateParticipation = (record) => /практически весь|большая часть|весь класс|весь/.test(normalize(record.participation));
  const hasPartialParticipation = (record) => /большая часть/.test(normalize(record.participation));
  const hasGoodData = (record) => /^да[,.]? все корректно/.test(normalize(record.data));
  const hasGoodLogin = (record) => /^да[,.]? у всех/.test(normalize(record.login));
  const hasGoodTech = (record) => /^да[,.]? полностью/.test(normalize(record.tech));
  const hasGoodSchedule = (record) => /^да[,.]? расписание/.test(normalize(record.schedule));
  const hasGoodMaterials = (record) => /^да[,.]? материалов достаточно/.test(normalize(record.materials));
  const hasGoodDirector = (record) => /^да/.test(normalize(record.director));
  const hasUnresolved = (record) => /^да/.test(normalize(record.unresolved));

  function getIssues(record) {
    return issueDefinitions.filter((definition) => {
      switch (definition.key) {
        case 'participation': return !isGoodParticipation(record);
        case 'data': return !hasGoodData(record);
        case 'login': return !hasGoodLogin(record);
        case 'tech': return !hasGoodTech(record);
        case 'schedule': return !hasGoodSchedule(record);
        case 'materials': return !hasGoodMaterials(record);
        case 'director': return !hasGoodDirector(record);
        case 'unresolved': return hasUnresolved(record);
        default: return false;
      }
    });
  }

  function enrich(record) {
    const issues = getIssues(record);
    const score = Object.entries(riskPoints).reduce((sum, [key, points]) => sum + (points[record[key]] ?? 0), 0);
    const level = score >= 10 ? 'critical' : score >= 7 ? 'attention' : 'stable';
    return { ...record, issues, score, level, participationGood: isGoodParticipation(record), participationAdequate: isAdequateParticipation(record), formatType: /на платформе/.test(normalize(record.format)) ? 'platform' : 'handout' };
  }

  const records = data.map(enrich);
  const percent = (value, total = records.length) => total ? Math.round((value / total) * 100) : 0;
  const formatPercent = (value) => `${value}%`;
  const plural = (count, one, few, many) => {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  };
  const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
  const statusClass = (good) => good ? 'status-good' : 'status-bad';
  const riskLabel = { critical: 'Критический', attention: 'Внимание', stable: 'Стабильный' };

  function metricMarkup(label, value, note, color) {
    return `<article class="metric-card" style="--metric-color:${color}"><div class="metric-label">${label}</div><div class="metric-value">${formatPercent(value)}</div><div class="metric-note">${note}</div><div class="metric-accent"></div></article>`;
  }

  function renderOverview() {
    const total = records.length;
    const issueCounts = Object.fromEntries(issueDefinitions.map((issue) => [issue.key, records.filter((record) => record.issues.some((item) => item.key === issue.key)).length]));
    const critical = records.filter((record) => record.level === 'critical').length;
    const metrics = [
      ['Нерешённые проблемы', percent(issueCounts.unresolved), `${issueCounts.unresolved} ${plural(issueCounts.unresolved, 'школа', 'школы', 'школ')}`, '#eb6c70'],
      ['Неполное участие класса', percent(issueCounts.participation), `${issueCounts.participation} школ`, '#62e5c2'],
      ['Ограничения техники', percent(issueCounts.tech), `${issueCounts.tech} школ`, '#f3b64a'],
      ['Ошибки в данных', percent(issueCounts.data), `${issueCounts.data} школ`, '#6688f5'],
      ['Без доступа директора', percent(issueCounts.director), `${issueCounts.director} школ`, '#a995ed'],
    ];
    $('#metric-grid').innerHTML = metrics.map((metric) => metricMarkup(...metric)).join('');

    const platform = records.filter((record) => record.formatType === 'platform');
    const handout = records.filter((record) => record.formatType === 'handout');
    const platformGood = platform.filter((record) => record.participationAdequate).length;
    const handoutGood = handout.filter((record) => record.participationAdequate).length;
    $('#platform-participation').textContent = formatPercent(percent(platformGood, platform.length));
    $('#handout-participation').textContent = formatPercent(percent(handoutGood, handout.length));

    $('#issue-bars').innerHTML = issueDefinitions.map((issue) => {
      const count = issueCounts[issue.key];
      return `<div class="issue-row"><div class="issue-label">${issue.label}</div><div class="bar-track"><div class="bar-fill" style="width:${percent(count)}%"></div></div><div class="issue-value">${percent(count)}%</div></div>`;
    }).join('');

    const riskCounts = { critical, attention: records.filter((record) => record.level === 'attention').length, stable: records.filter((record) => record.level === 'stable').length };
    const criticalDeg = percent(riskCounts.critical) * 3.6;
    const attentionDeg = percent(riskCounts.attention) * 3.6;
    $('#risk-donut').innerHTML = `<div class="donut" style="background:conic-gradient(#eb6c70 0 ${criticalDeg}deg, #f3b64a ${criticalDeg}deg ${criticalDeg + attentionDeg}deg, #62e5c2 ${criticalDeg + attentionDeg}deg 360deg)"><div class="donut-center"><strong>${critical}</strong><span>критическая<br/>зона</span></div></div>`;
    $('#risk-legend').innerHTML = [['critical', '#eb6c70'], ['attention', '#f3b64a'], ['stable', '#62e5c2']].map(([key, color]) => `<div class="legend-row"><span class="legend-dot" style="background:${color}"></span>${riskLabel[key]}<strong>${riskCounts[key]}</strong></div>`).join('');

    $('#priority-grid').innerHTML = records.slice().sort((a, b) => b.score - a.score || b.issues.length - a.issues.length).slice(0, 6).map((record, index) => `<div class="priority-item" data-record-id="${escapeHtml(record.id)}"><div class="priority-rank">${String(index + 1).padStart(2, '0')}</div><div style="min-width:0"><div class="priority-school" title="${escapeHtml(record.school)}">${escapeHtml(record.school)}</div><div class="priority-mun">${escapeHtml(record.municipalityKey)}</div><div class="priority-problems">${record.score} баллов риска · ${record.issues.length} ${plural(record.issues.length, 'точка', 'точки', 'точек')}</div></div></div>`).join('');
    $$('.priority-item').forEach((item) => item.addEventListener('click', () => { switchView('schools'); selectRecord(item.dataset.recordId); }));
  }

  function populateMunicipalities() {
    const municipalities = [...new Set(records.map((record) => record.municipalityKey))].sort((a, b) => a.localeCompare(b, 'ru'));
    $('#municipality-filter').insertAdjacentHTML('beforeend', municipalities.map((municipality) => `<option value="${escapeHtml(municipality)}">${escapeHtml(municipality)}</option>`).join(''));
  }

  let filteredRecords = [];
  let selectedId = records[0]?.id;

  function getFilteredRecords() {
    const search = normalize($('#school-search').value);
    const municipality = $('#municipality-filter').value;
    const risk = $('#risk-filter').value;
    const onlyProblems = $('#problem-only').checked;
    return records.filter((record) => {
      const matchesSearch = !search || normalize(`${record.school} ${record.municipalityKey}`).includes(search);
      const matchesMunicipality = municipality === 'all' || record.municipalityKey === municipality;
      const matchesRisk = risk === 'all' || record.level === risk;
      const matchesProblems = !onlyProblems || record.issues.length > 0;
      return matchesSearch && matchesMunicipality && matchesRisk && matchesProblems;
    }).sort((a, b) => b.score - a.score || a.school.localeCompare(b.school, 'ru'));
  }

  function renderMatrix() {
    filteredRecords = getFilteredRecords();
    $('#result-count').textContent = `${filteredRecords.length} ${plural(filteredRecords.length, 'школа', 'школы', 'школ')} в выборке`;
    $('#table-footer').textContent = filteredRecords.length ? `Показаны ${filteredRecords.length} из ${records.length}. Нажмите на строку, чтобы открыть карту действий школы.` : 'По заданным фильтрам школы не найдены.';
    $('#school-matrix').innerHTML = filteredRecords.map((record) => `<tr data-record-id="${escapeHtml(record.id)}" class="${selectedId === record.id ? 'selected' : ''}"><td><div class="school-name-cell" title="${escapeHtml(record.school)}">${escapeHtml(record.school)}</div><div class="school-mun-cell">${escapeHtml(record.municipalityKey)}</div></td><td><span class="status-dot ${statusClass(record.participationGood)}" title="${escapeHtml(record.participation)}"></span></td><td><span class="status-dot ${statusClass(hasGoodData(record))}" title="${escapeHtml(record.data)}"></span></td><td><span class="status-dot ${statusClass(hasGoodLogin(record))}" title="${escapeHtml(record.login)}"></span></td><td><span class="status-dot ${statusClass(hasGoodTech(record))}" title="${escapeHtml(record.tech)}"></span></td><td><span class="status-dot ${statusClass(hasGoodSchedule(record))}" title="${escapeHtml(record.schedule)}"></span></td><td><span class="status-dot ${statusClass(hasGoodDirector(record))}" title="${escapeHtml(record.director)}"></span></td><td><span class="risk-pill ${record.level}">${riskLabel[record.level]}</span></td></tr>`).join('');
    $$('#school-matrix tr').forEach((row) => row.addEventListener('click', () => selectRecord(row.dataset.recordId)));
    if (!filteredRecords.some((record) => record.id === selectedId)) selectedId = filteredRecords[0]?.id;
    renderDetail(selectedId);
  }

  function renderDetail(id) {
    const record = records.find((item) => item.id === id);
    if (!record) {
      $('#school-detail').innerHTML = '<div class="detail-card"><h3>Нет школы в выборке</h3><p class="section-caption">Измените фильтры, чтобы увидеть карточку.</p></div>';
      return;
    }
    const issueMarkup = record.issues.length ? record.issues.map((issue) => {
      const recommendation = recommendationMap[issue.key];
      return `<section><div class="problem-title"><h4>${issue.label}</h4><span class="problem-badge">точка внимания</span></div><div class="recommendation"><div class="recommendation-label">Что сделать школе</div><p>${recommendation.school}</p></div><div class="recommendation"><div class="recommendation-label">Что требуется от платформы / организаторов</div><p>${recommendation.organizer}</p></div><div class="recommendation check"><div class="recommendation-label">Как проверить результат</div><p>${recommendation.check}</p></div></section>`;
    }).join('') : '<div class="recommendation check"><div class="recommendation-label">Сигнал по ответу</div><p>По выбранным полям критичных барьеров не выявлено. Можно использовать школу как пример устойчивого сценария и собрать практики.</p></div>';
    $('#school-detail').innerHTML = `<div class="detail-card"><div class="detail-top"><div><div class="detail-school">${escapeHtml(record.school)}</div><div class="detail-mun">${escapeHtml(record.municipalityKey)} · исходная запись: «${escapeHtml(record.municipality)}»</div></div><span class="risk-pill ${record.level}">${riskLabel[record.level]}</span></div><div class="detail-source"><strong>Что сообщил директор</strong>${escapeHtml(record.requirement || 'Дополнительный комментарий не указан.')}</div><div class="detail-kpis"><div class="detail-kpi"><span>Формат занятий</span><strong>${record.formatType === 'platform' ? 'На платформе' : 'Раздаточный материал'}</strong></div><div class="detail-kpi"><span>Проблемных точек</span><strong>${record.issues.length}</strong></div><div class="detail-kpi"><span>Участие</span><strong>${escapeHtml(record.participation || 'Не указано')}</strong></div><div class="detail-kpi"><span>Индекс риска</span><strong>${record.score} из 18</strong></div></div><div class="analytical-label">КАРТА ДЕЙСТВИЙ · АНАЛИТИЧЕСКИЕ ПРЕДЛОЖЕНИЯ</div>${issueMarkup}</div>`;
  }

  function renderActions() {
    const actionMarkup = issueDefinitions.map((issue, index) => {
      const count = records.filter((record) => record.issues.some((item) => item.key === issue.key)).length;
      const recommendation = recommendationMap[issue.key];
      return `<article class="action-card"><div class="action-card-top"><div><div class="action-number">${String(index + 1).padStart(2, '0')}</div></div><div style="flex:1;min-width:0"><h3>${issue.label}</h3><div class="action-frequency">${count} школ · ${percent(count)}% ответов с этим сигналом</div></div><span class="problem-badge">фокус</span></div><div class="action-column"><strong>Что сделать школе</strong><p>${escapeHtml(recommendation.school)}</p></div><div class="action-column"><strong>Что требуется от платформы / организаторов</strong><p>${escapeHtml(recommendation.organizer)}</p></div><div class="action-column verify"><strong>Как проверить результат</strong><p>${escapeHtml(recommendation.check)}</p></div></article>`;
    }).join('');
    $('#action-grid').innerHTML = actionMarkup;
  }

  function selectRecord(id) { if (!id) return; selectedId = id; renderMatrix(); const row = $(`#school-matrix tr[data-record-id="${CSS.escape(id)}"]`); row?.scrollIntoView({ block: 'nearest' }); }

  function switchView(view) {
    $$('.nav-button').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
    $$('.view-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `view-${view}`));
    if (view === 'schools') renderMatrix();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $$('.nav-button, [data-view]').forEach((button) => {
    if (button.classList.contains('nav-button')) button.addEventListener('click', () => switchView(button.dataset.view));
    else if (button.dataset.view) button.addEventListener('click', () => switchView(button.dataset.view));
  });
  ['school-search', 'municipality-filter', 'risk-filter', 'problem-only'].forEach((id) => $(`#${id}`).addEventListener('input', renderMatrix));

  renderOverview();
  renderActions();
  populateMunicipalities();
  selectedId = records.slice().sort((a, b) => b.score - a.score)[0]?.id;
  renderMatrix();
})();
