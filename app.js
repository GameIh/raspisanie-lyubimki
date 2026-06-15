const TOMSK_TIME_ZONE = "Asia/Tomsk";
const RANGE_START = "2026-06-15";
const RANGE_END = "2026-07-01";
const DAY_END_MINUTES = 24 * 60;
const SLEEP_END_MINUTES = 8 * 60;
const RELATIONSHIP_START = new Date("2026-06-07T21:00:00+07:00");
const FIRST_MEETING = new Date("2026-06-14T03:00:00+07:00");
const FIRST_KISS = new Date("2026-06-15T00:00:00+07:00");

const dimaSchedule = [
  { date: "2026-06-15", events: [
    { start: "13:15", end: "14:50", title: "Оргсобрание", detail: "Дистанционно", type: "busy" },
    { start: "16:30", end: "18:20", title: "Оргсобрание", detail: "ауд. 412ф", type: "busy" },
    { start: "18:30", end: "20:05", title: "Компьютерная графика", detail: "Перемитина Т. О.", type: "busy" }
  ]},
  { date: "2026-06-16", events: [
    { start: "08:50", end: "12:15", title: "Тестирование ПО", detail: "Морозова Ю. В.", type: "busy" }
  ]},
  { date: "2026-06-17", events: [
    { start: "08:50", end: "12:15", title: "Тестирование ПО", detail: "Морозова Ю. В.", type: "busy" },
    { start: "13:15", end: "16:35", title: "Разработка ИП", detail: "Владимиров М. В.", type: "busy" }
  ]},
  { date: "2026-06-18", events: [
    { start: "08:50", end: "12:15", title: "Тестирование ПО", detail: "Морозова Ю. В.", type: "busy" },
    { start: "13:15", end: "16:35", title: "Разработка ИП", detail: "Владимиров М. В.", type: "busy" }
  ]},
  { date: "2026-06-19", events: [
    { start: "13:15", end: "16:35", title: "Компьютерная графика", detail: "Перемитина Т. О.", type: "busy" }
  ]},
  { date: "2026-06-20", events: [] },
  { date: "2026-06-22", events: [
    { start: "13:15", end: "16:35", title: "Компьютерная графика", detail: "Перемитина Т. О.", type: "busy" }
  ]},
  { date: "2026-06-23", events: [
    { start: "08:50", end: "12:15", title: "ОБД", detail: "Волокитин Г. А.", type: "busy" }
  ]},
  { date: "2026-06-24", events: [
    { start: "08:50", end: "16:35", title: "ПиАПС", detail: "Голубева А. А.", type: "busy" }
  ]},
  { date: "2026-06-25", events: [
    { start: "08:50", end: "12:15", title: "ИОиТПР", detail: "Турунтаев Л. П.", type: "busy" },
    { start: "13:15", end: "16:35", title: "Разработка ИП", detail: "Владимиров М. В.", type: "busy" }
  ]},
  { date: "2026-06-26", events: [
    { start: "08:50", end: "12:15", title: "ОБД", detail: "Волокитин Г. А.", type: "busy" },
    { start: "13:15", end: "16:35", title: "Компьютерная графика", detail: "Перемитина Т. О.", type: "busy" }
  ]},
  { date: "2026-06-27", events: [
    { start: "08:50", end: "12:15", title: "ИОиТПР", detail: "Турунтаев Л. П.", type: "busy" }
  ]},
  { date: "2026-06-29", events: [
    { start: "13:15", end: "16:35", title: "ОБД", detail: "Волокитин Г. А.", type: "busy" }
  ]},
  { date: "2026-06-30", events: [
    { start: "08:50", end: "12:15", title: "ВП на Python", detail: "Волокитин Г. А.", type: "busy" }
  ]},
  { date: "2026-07-01", events: [
    { start: "13:15", end: "16:35", title: "ВП на Python", detail: "Волокитин Г. А.", type: "busy" }
  ]}
];

const disciplines = [
  ["Компьютерная графика", "Компьютерная графика", "Перемитина Татьяна Олеговна"],
  ["ОБД", "Организация баз данных", "Волокитин Геннадий Александрович"],
  ["ИПС", "Интерфейсы программных систем", "Кульшин Роман Сергеевич"],
  ["Разработка ИП", "Разработка Интернет-приложений", "Владимиров Михаил Владимирович"],
  ["Тестирование ПО", "Тестирование программного обеспечения", "Морозова Юлия Викторовна"],
  ["ПиАПС", "Проектирование и архитектура программных систем", "Голубева Александра Александровна"],
  ["ИОиТПР", "Исследование операций и теория принятия решений", "Турунтаев Леонид Петрович"],
  ["ВП на Python", "Веб-программирование на Python", "Волокитин Геннадий Александрович"]
];

const romanticPhrases = ["Желаю встретиться с тобой", "Это время для нашей встречи", "Свободное окошко для тебя"];
const timeFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const fullDateFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, day: "numeric", month: "long", year: "numeric", weekday: "long" });
const rowDateFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, weekday: "long" });
const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, day: "numeric", month: "long", weekday: "long" });

let activeProfile = "dima";

function dateAtNoon(date) { return new Date(`${date}T12:00:00+07:00`); }
function eventDate(date, time) { return new Date(`${date}T${time === "24:00" ? "23:59:59" : `${time}:00`}+07:00`); }

function timeToMinutes(time) {
  if (time === "24:00") return DAY_END_MINUTES;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(total) {
  if (total >= DAY_END_MINUTES) return "24:00";
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function timelinePoint(time) { return (timeToMinutes(time) / DAY_END_MINUTES) * 100; }

function getTomskDateKey(now) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TOMSK_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getNow() {
  const override = new URLSearchParams(location.search).get("now");
  return override ? new Date(`${override}+07:00`) : new Date();
}

function daysInRange(start, end) {
  const dates = [];
  const cursor = new Date(`${start}T12:00:00+07:00`);
  const last = new Date(`${end}T12:00:00+07:00`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function loverEvents(date) {
  const weekday = dateAtNoon(date).getUTCDay();
  if ([2, 3, 4].includes(weekday)) {
    return [
      { start: "10:00", end: "16:00", title: "Любимка работает", detail: "После 16:00 свободна", type: "love-busy" },
      { start: "16:00", end: "24:00", title: "Свободна для нашей встречи", detail: "Вечер для нас", type: "love-free" }
    ];
  }
  if ([5, 6, 0].includes(weekday)) {
    return [{ start: "08:00", end: "24:00", title: "Любимка свободна весь день", detail: "Можно планировать встречу", type: "love-free" }];
  }
  return [{ start: "08:00", end: "24:00", title: "Планы любимки уточняются", detail: "Понедельник пока без расписания", type: "unknown" }];
}

function scheduleForProfile(profile) {
  if (profile === "dima") return dimaSchedule;
  return daysInRange(RANGE_START, RANGE_END).map(date => ({ date, events: loverEvents(date) }));
}

function normalizedEvents(day, profile) {
  const sleep = { start: "00:00", end: "08:00", title: "Сладко спим через интернетик", detail: "Вместе даже во сне", type: "sleep" };
  const events = [sleep, ...day.events];
  if (profile === "love") return events;

  const sorted = [...events].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const result = [];
  let cursor = SLEEP_END_MINUTES;
  sorted.forEach(event => {
    const start = timeToMinutes(event.start);
    if (start - cursor >= 45) {
      result.push({ start: minutesToTime(cursor), end: event.start, title: romanticPhrases[result.length % romanticPhrases.length], detail: "Можно побыть вместе", type: "free" });
    }
    result.push(event);
    cursor = Math.max(cursor, timeToMinutes(event.end));
  });
  if (DAY_END_MINUTES - cursor >= 45) {
    result.push({ start: minutesToTime(cursor), end: "24:00", title: romanticPhrases[result.length % romanticPhrases.length], detail: "Можно побыть вместе", type: "free" });
  }
  return result;
}

function allEvents(profile) {
  return scheduleForProfile(profile).flatMap(day => normalizedEvents(day, profile).map(event => ({ ...event, date: day.date })));
}

function getState(now, profile) {
  const events = allEvents(profile);
  const current = events.find(event => eventDate(event.date, event.start) <= now && now < eventDate(event.date, event.end));
  const next = events.find(event => eventDate(event.date, event.start) > now);
  return { current, next };
}

function renderEventStatus(target, event) {
  target.innerHTML = `<div class="lesson-status ${event.type}"><span class="status-dot" aria-hidden="true"></span><strong>${event.title}</strong><span>${event.start}–${event.end}</span><span class="status-note">${shortDateFormatter.format(dateAtNoon(event.date))} · ${event.detail}</span></div>`;
}

function renderEmptyStatus(target, title, message) {
  const template = document.querySelector("#empty-status-template").content.cloneNode(true);
  template.querySelector("strong").textContent = title;
  template.querySelector("span").textContent = message;
  target.replaceChildren(template);
}

function renderStatus(now) {
  const { current, next } = getState(now, activeProfile);
  const currentTarget = document.querySelector("#current-status");
  const nextTarget = document.querySelector("#next-status");
  document.querySelector("#active-person").textContent = activeProfile === "dima" ? "Дима" : "Любимка";
  current ? renderEventStatus(currentTarget, current) : renderEmptyStatus(currentTarget, "Сейчас вне периода", "Расписание показано с 15 июня по 1 июля");
  next ? renderEventStatus(nextTarget, next) : renderEmptyStatus(nextTarget, "Событий больше нет", "Пора планировать новые встречи");
}

function renderSchedule(now) {
  const list = document.querySelector("#schedule-list");
  const todayKey = getTomskDateKey(now);
  const { current, next } = getState(now, activeProfile);
  const rows = scheduleForProfile(activeProfile).map(day => {
    const row = document.createElement("article");
    row.className = `day-row profile-${activeProfile}`;
    row.id = `day-${day.date}`;
    row.dataset.date = day.date;
    if (day.date === todayKey) row.classList.add("is-today");
    if (day.date < todayKey) row.classList.add("is-past-day");

    const meta = document.createElement("header");
    meta.className = "day-meta";
    meta.innerHTML = `<time datetime="${day.date}">${rowDateFormatter.format(dateAtNoon(day.date))}</time><span>${weekdayFormatter.format(dateAtNoon(day.date))}</span>`;

    const timeline = document.createElement("div");
    timeline.className = "day-timeline";
    normalizedEvents(day, activeProfile).forEach(event => {
      const item = document.createElement("div");
      item.className = `timeline-event ${event.type}`;
      item.style.setProperty("--start", timelinePoint(event.start));
      item.style.setProperty("--end", timelinePoint(event.end));
      item.title = `${event.start}–${event.end}: ${event.title}. ${event.detail}`;
      item.innerHTML = `<strong>${event.title}</strong><span class="event-time">${event.start}–${event.end}</span><span>${event.detail}</span>`;
      if (eventDate(day.date, event.end) <= now) item.classList.add("is-past");
      if (current && current.date === day.date && current.start === event.start) item.classList.add("is-current");
      if (!current && next && next.date === day.date && next.start === event.start) item.classList.add("is-next");
      timeline.append(item);
    });
    row.append(meta, timeline);
    return row;
  });
  list.replaceChildren(...rows);
  applyFilters();
}

function applyFilters() {
  const showPast = document.querySelector("#show-past").checked;
  const todayKey = getTomskDateKey(getNow());
  document.querySelectorAll(".day-row").forEach(row => row.classList.toggle("is-hidden", !showPast && row.dataset.date < todayKey));
}

function elapsedParts(start, now) {
  const totalSeconds = Math.max(0, Math.floor((now - start) / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60)
  };
}

function plural(number, forms) {
  const n10 = number % 10;
  const n100 = number % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
  return forms[2];
}

function elapsedText(start, now, detailed = false) {
  if (now < start) return "Это событие ещё впереди";
  const { days, hours, minutes } = elapsedParts(start, now);
  const dayText = `${days} ${plural(days, ["день", "дня", "дней"])}`;
  if (!detailed) return `${dayText} назад`;
  return `${dayText}, ${hours} ${plural(hours, ["час", "часа", "часов"])} и ${minutes} ${plural(minutes, ["минута", "минуты", "минут"])}`;
}

function updateCounters(now) {
  document.querySelector("#together-counter").textContent = elapsedText(RELATIONSHIP_START, now, true);
  document.querySelector("#meeting-counter").textContent = elapsedText(FIRST_MEETING, now);
  document.querySelector("#kiss-counter").textContent = elapsedText(FIRST_KISS, now);
}

function renderDisciplines() {
  const target = document.querySelector("#disciplines-list");
  target.replaceChildren(...disciplines.map(([shortName, fullName, teacher]) => {
    const item = document.createElement("article");
    item.className = "discipline-item";
    item.innerHTML = `<strong>${shortName} — ${fullName}</strong><span>${teacher}</span>`;
    return item;
  }));
}

function updateClock() {
  const now = getNow();
  document.querySelector("#tomsk-time").textContent = timeFormatter.format(now);
  document.querySelector("#tomsk-date").textContent = fullDateFormatter.format(now);
  updateCounters(now);
  return now;
}

function refreshDynamicState() {
  const now = updateClock();
  renderStatus(now);
  renderSchedule(now);
}

function setProfile(profile) {
  activeProfile = profile;
  document.querySelectorAll(".profile-tab").forEach(button => {
    const active = button.dataset.profile === profile;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelector("#schedule-heading").textContent = profile === "dima" ? "Расписание Дима" : "Расписание Любимка";
  document.querySelector(".schedule-section").classList.toggle("love-theme", profile === "love");
  document.querySelector(".disciplines").hidden = profile === "love";
  refreshDynamicState();
}

document.querySelectorAll(".profile-tab").forEach(button => button.addEventListener("click", () => setProfile(button.dataset.profile)));
document.querySelector("#show-past").addEventListener("change", applyFilters);
document.querySelector("#today-button").addEventListener("click", () => {
  const row = document.querySelector(`#day-${getTomskDateKey(getNow())}`);
  (row || document.querySelector(".schedule-section")).scrollIntoView({ behavior: "smooth", block: "center" });
});
document.querySelector("#disciplines-toggle").addEventListener("click", event => {
  const target = document.querySelector("#disciplines-list");
  target.hidden = !target.hidden;
  const open = !target.hidden;
  event.currentTarget.setAttribute("aria-expanded", String(open));
  event.currentTarget.textContent = open ? "Скрыть список" : "Показать список";
});

renderDisciplines();
refreshDynamicState();
setInterval(() => {
  const oldMinute = document.querySelector("#tomsk-time").textContent.slice(0, 5);
  const now = updateClock();
  if (timeFormatter.format(now).slice(0, 5) !== oldMinute) {
    renderStatus(now);
    renderSchedule(now);
  }
}, 1000);
