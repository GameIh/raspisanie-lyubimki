const TOMSK_TIME_ZONE = "Asia/Tomsk";
const RANGE_START = "2026-06-15";
const RANGE_END = "2026-07-01";
const DAY_START_MINUTES = 8 * 60 + 50;
const DAY_END_MINUTES = 21 * 60 + 50;
const DAY_SPAN_MINUTES = DAY_END_MINUTES - DAY_START_MINUTES;

const schedule = [
  { date: "2026-06-15", lessons: [
    { start: "13:15", end: "14:50", title: "Оргсобрание", teacher: "Дистанционно" },
    { start: "16:30", end: "18:20", title: "Оргсобрание", teacher: "ауд. 412ф" },
    { start: "18:30", end: "20:05", title: "Компьютерная графика", teacher: "Перемитина Т. О." }
  ]},
  { date: "2026-06-16", lessons: [
    { start: "08:50", end: "12:15", title: "Тестирование ПО", teacher: "Морозова Ю. В." },
    { start: "13:15", end: "16:35", title: "РПРнП 1С", teacher: "Фролова Д. Р.", note: "Для РУП 2023" }
  ]},
  { date: "2026-06-17", lessons: [
    { start: "08:50", end: "12:15", title: "Тестирование ПО", teacher: "Морозова Ю. В." },
    { start: "13:15", end: "16:35", title: "Разработка ИП", teacher: "Владимиров М. В." }
  ]},
  { date: "2026-06-18", lessons: [
    { start: "08:50", end: "12:15", title: "Тестирование ПО", teacher: "Морозова Ю. В." },
    { start: "13:15", end: "16:35", title: "Разработка ИП", teacher: "Владимиров М. В." }
  ]},
  { date: "2026-06-19", lessons: [
    { start: "13:15", end: "16:35", title: "Компьютерная графика", teacher: "Перемитина Т. О." },
    { start: "16:45", end: "20:05", title: "ВиДР", teacher: "Симонов Т. С.", note: "Для РУП 2023" }
  ]},
  { date: "2026-06-20", lessons: [] },
  { date: "2026-06-22", lessons: [
    { start: "13:15", end: "16:35", title: "Компьютерная графика", teacher: "Перемитина Т. О." },
    { start: "16:45", end: "20:05", title: "ВиДР", teacher: "Симонов Т. С.", note: "Для РУП 2023" }
  ]},
  { date: "2026-06-23", lessons: [
    { start: "08:50", end: "12:15", title: "ОБД", teacher: "Волокитин Г. А." },
    { start: "13:15", end: "16:35", title: "РПРнП 1С", teacher: "Фролова Д. Р.", note: "Для РУП 2023" }
  ]},
  { date: "2026-06-24", lessons: [
    { start: "08:50", end: "16:35", title: "ПиАПС", teacher: "Голубева А. А." },
    { start: "16:45", end: "20:05", title: "ВиДР", teacher: "Симонов Т. С.", note: "Для РУП 2023" }
  ]},
  { date: "2026-06-25", lessons: [
    { start: "08:50", end: "12:15", title: "ИОиТПР", teacher: "Турунтаев Л. П." },
    { start: "13:15", end: "16:35", title: "Разработка ИП", teacher: "Владимиров М. В." }
  ]},
  { date: "2026-06-26", lessons: [
    { start: "08:50", end: "12:15", title: "ОБД", teacher: "Волокитин Г. А." },
    { start: "13:15", end: "16:35", title: "Компьютерная графика", teacher: "Перемитина Т. О." }
  ]},
  { date: "2026-06-27", lessons: [
    { start: "08:50", end: "12:15", title: "ИОиТПР", teacher: "Турунтаев Л. П." }
  ]},
  { date: "2026-06-29", lessons: [
    { start: "13:15", end: "16:35", title: "ОБД", teacher: "Волокитин Г. А." }
  ]},
  { date: "2026-06-30", lessons: [
    { start: "08:50", end: "12:15", title: "ВП на Python", teacher: "Волокитин Г. А." }
  ]},
  { date: "2026-07-01", lessons: [
    { start: "13:15", end: "16:35", title: "ВП на Python", teacher: "Волокитин Г. А." }
  ]}
];

const disciplines = [
  ["Компьютерная графика", "Компьютерная графика", "Перемитина Татьяна Олеговна"],
  ["ОБД", "Организация баз данных", "Волокитин Геннадий Александрович"],
  ["РПРнП 1С", "Разработка прикладных решений на платформе 1С", "Фролова Дарья Романовна"],
  ["ИПС", "Интерфейсы программных систем", "Кульшин Роман Сергеевич"],
  ["Разработка ИП", "Разработка Интернет-приложений", "Владимиров Михаил Владимирович"],
  ["Тестирование ПО", "Тестирование программного обеспечения", "Морозова Юлия Викторовна"],
  ["ПиАПС", "Проектирование и архитектура программных систем", "Голубева Александра Александровна"],
  ["ИОиТПР", "Исследование операций и теория принятия решений", "Турунтаев Леонид Петрович"],
  ["ВП на Python", "Веб-программирование на Python", "Волокитин Геннадий Александрович"],
  ["ВиДР", "Виртуальная и дополненная реальность", "Симонов Тимофей Сергеевич"]
];

const allLessons = schedule.flatMap(day => day.lessons.map(lesson => ({ ...lesson, date: day.date })));
const timeFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const fullDateFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, day: "numeric", month: "long", year: "numeric", weekday: "long" });
const rowDateFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, weekday: "long" });
const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, day: "numeric", month: "long", weekday: "long" });
const romanticPhrases = ["Желаю встретиться с тобой", "Это время для нашей встречи", "Свободное окошко для тебя"];

function lessonDate(date, time) {
  return new Date(`${date}T${time}:00+07:00`);
}

function dateAtNoon(date) {
  return new Date(`${date}T12:00:00+07:00`);
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timelinePoint(time) {
  return ((timeToMinutes(time) - DAY_START_MINUTES) / DAY_SPAN_MINUTES) * 100;
}

function minutesToTime(total) {
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function freeWindows(lessons) {
  const sorted = [...lessons].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const windows = [];
  let cursor = DAY_START_MINUTES;
  sorted.forEach(lesson => {
    const start = timeToMinutes(lesson.start);
    if (start - cursor >= 45) windows.push({ start: minutesToTime(cursor), end: lesson.start });
    cursor = Math.max(cursor, timeToMinutes(lesson.end));
  });
  if (DAY_END_MINUTES - cursor >= 45) windows.push({ start: minutesToTime(cursor), end: minutesToTime(DAY_END_MINUTES) });
  return windows;
}

function getTomskDateKey(now) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TOMSK_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getNow() {
  const override = new URLSearchParams(location.search).get("now");
  return override ? new Date(`${override}+07:00`) : new Date();
}

function getState(now) {
  const current = allLessons.find(lesson => lessonDate(lesson.date, lesson.start) <= now && now < lessonDate(lesson.date, lesson.end));
  const next = allLessons.find(lesson => lessonDate(lesson.date, lesson.start) > now);
  return { current, next };
}

function lessonMeta(lesson) {
  return [lesson.teacher, lesson.note].filter(Boolean).join(" · ");
}

function renderLessonStatus(target, lesson) {
  target.innerHTML = `
    <div class="lesson-status">
      <span class="status-dot" aria-hidden="true"></span>
      <strong>${lesson.title}</strong>
      <span>${lesson.start}–${lesson.end}</span>
      <span class="status-note">${shortDateFormatter.format(dateAtNoon(lesson.date))} · ${lessonMeta(lesson)}</span>
    </div>`;
}

function renderEmptyStatus(target, title, message) {
  const template = document.querySelector("#empty-status-template").content.cloneNode(true);
  template.querySelector("strong").textContent = title;
  template.querySelector("span").textContent = message;
  target.replaceChildren(template);
}

function renderStatus(now) {
  const { current, next } = getState(now);
  const currentTarget = document.querySelector("#current-status");
  const nextTarget = document.querySelector("#next-status");
  const todayKey = getTomskDateKey(now);

  if (current) {
    renderLessonStatus(currentTarget, current);
  } else if (todayKey < RANGE_START) {
    renderEmptyStatus(currentTarget, "Занятия ещё не начались", "Летнее расписание начнётся 15 июня");
  } else if (todayKey > RANGE_END) {
    renderEmptyStatus(currentTarget, "Расписание завершено", "Последний учебный день был 1 июля");
  } else {
    const todayLessons = allLessons.filter(lesson => lesson.date === todayKey);
    const hasFutureToday = todayLessons.some(lesson => lessonDate(lesson.date, lesson.start) > now);
    renderEmptyStatus(currentTarget, hasFutureToday ? "Свободное окошко для тебя" : "Сейчас занятий нет", hasFutureToday ? "Желаю встретиться с тобой" : "Самое время побыть вместе");
  }

  if (next) {
    renderLessonStatus(nextTarget, next);
  } else {
    renderEmptyStatus(nextTarget, "Занятий больше нет", "Летнее расписание завершено");
  }
}

function renderSchedule(now) {
  const list = document.querySelector("#schedule-list");
  const todayKey = getTomskDateKey(now);
  const { current, next } = getState(now);
  const rows = schedule.map(day => {
    const dayDate = dateAtNoon(day.date);
    const row = document.createElement("article");
    row.className = "day-row";
    row.id = `day-${day.date}`;
    row.dataset.date = day.date;
    row.dataset.empty = String(day.lessons.length === 0);
    if (day.date === todayKey) row.classList.add("is-today");
    if (day.date < todayKey) row.classList.add("is-past-day");

    const meta = document.createElement("header");
    meta.className = "day-meta";
    meta.innerHTML = `<time datetime="${day.date}">${rowDateFormatter.format(dayDate)}</time><span>${weekdayFormatter.format(dayDate)}</span>`;

    const timeline = document.createElement("div");
    timeline.className = "day-timeline";
    if (!day.lessons.length) {
      timeline.innerHTML = '<div class="empty-day">Желаю провести этот день с тобой ♡</div>';
    } else {
      freeWindows(day.lessons).forEach((window, index) => {
        const free = document.createElement("div");
        free.className = "free-window";
        free.style.setProperty("--start", timelinePoint(window.start));
        free.style.setProperty("--end", timelinePoint(window.end));
        free.title = `${window.start}–${window.end}: ${romanticPhrases[index % romanticPhrases.length]}`;
        free.textContent = romanticPhrases[index % romanticPhrases.length];
        timeline.append(free);
      });
      day.lessons.forEach(lesson => {
        const item = document.createElement("div");
        item.className = "lesson";
        item.style.setProperty("--start", timelinePoint(lesson.start));
        item.style.setProperty("--end", timelinePoint(lesson.end));
        item.title = `${lesson.title}, ${lesson.start}–${lesson.end}, ${lessonMeta(lesson)}`;
        item.innerHTML = `<strong>${lesson.title}</strong><span class="lesson-time">${lesson.start}–${lesson.end}</span><span>${lessonMeta(lesson)}</span>`;
        const enriched = { ...lesson, date: day.date };
        const starts = lessonDate(day.date, lesson.start);
        const ends = lessonDate(day.date, lesson.end);
        if (ends <= now) item.classList.add("is-past");
        if (current && current.date === enriched.date && current.start === enriched.start) item.classList.add("is-current");
        if (!current && next && next.date === enriched.date && next.start === enriched.start) item.classList.add("is-next");
        timeline.append(item);
      });
    }

    row.append(meta, timeline);
    return row;
  });
  list.replaceChildren(...rows);
  applyFilters();
}

function applyFilters() {
  const showPast = document.querySelector("#show-past").checked;
  const showEmpty = document.querySelector("#show-empty").checked;
  const todayKey = getTomskDateKey(getNow());
  document.querySelectorAll(".day-row").forEach(row => {
    const hidden = (!showPast && row.dataset.date < todayKey) || (!showEmpty && row.dataset.empty === "true");
    row.classList.toggle("is-hidden", hidden);
  });
}

function renderDisciplines() {
  const target = document.querySelector("#disciplines-list");
  const items = disciplines.map(([shortName, fullName, teacher]) => {
    const item = document.createElement("article");
    item.className = "discipline-item";
    item.innerHTML = `<strong>${shortName} — ${fullName}</strong><span>${teacher}</span>`;
    return item;
  });
  target.replaceChildren(...items);
}

function updateClock() {
  const now = getNow();
  document.querySelector("#tomsk-time").textContent = timeFormatter.format(now);
  document.querySelector("#tomsk-date").textContent = fullDateFormatter.format(now);
  return now;
}

function refreshDynamicState() {
  const now = updateClock();
  renderStatus(now);
  renderSchedule(now);
}

document.querySelector("#show-past").addEventListener("change", applyFilters);
document.querySelector("#show-empty").addEventListener("change", applyFilters);
document.querySelector("#today-button").addEventListener("click", () => {
  const row = document.querySelector(`#day-${getTomskDateKey(getNow())}`);
  if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
  else document.querySelector(".schedule-section").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelector("#disciplines-toggle").addEventListener("click", event => {
  const target = document.querySelector("#disciplines-list");
  const willOpen = target.hidden;
  target.hidden = !willOpen;
  event.currentTarget.setAttribute("aria-expanded", String(willOpen));
  event.currentTarget.textContent = willOpen ? "Скрыть список" : "Показать список";
});

renderDisciplines();
refreshDynamicState();
setInterval(() => {
  const previousMinute = document.querySelector("#tomsk-time").textContent.slice(0, 5);
  const now = updateClock();
  if (timeFormatter.format(now).slice(0, 5) !== previousMinute) {
    renderStatus(now);
    renderSchedule(now);
  }
}, 1000);
