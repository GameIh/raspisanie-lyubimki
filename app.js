const TOMSK_TIME_ZONE = "Asia/Tomsk";
const DAY_END_MINUTES = 24 * 60;
const VISIBLE_DAYS = 7;
const RELATIONSHIP_START = new Date("2026-06-07T21:00:00+07:00");
const FIRST_MEETING = new Date("2026-06-14T03:00:00+07:00");
const FIRST_KISS = new Date("2026-06-15T00:00:00+07:00");

const categories = [
  { id: "work", label: "Работа", color: "#cf416c" },
  { id: "personal", label: "Личные дела", color: "#7557b7" },
  { id: "sport", label: "Спорт", color: "#22936a" },
  { id: "date", label: "Встреча", color: "#ff776f" },
  { id: "study", label: "Учёба", color: "#3d74d8" },
  { id: "family", label: "Семья", color: "#d8892e" },
  { id: "background", label: "Фон", color: "#8a93aa" },
  { id: "other", label: "Другое", color: "#6f6170" }
];

const categoryById = Object.fromEntries(categories.map(category => [category.id, category]));
const participantLabels = {
  dima: "Дима",
  alexandra: "Александра",
  both: "Вместе",
  background: "Фон"
};
const kindLabels = {
  personal: "Личное",
  proposal: "Предложение",
  background: "Фоновое"
};

const timeFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const fullDateFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, day: "numeric", month: "long", year: "numeric", weekday: "long" });
const rowDateFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, day: "numeric", month: "long", weekday: "long" });
const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", { timeZone: TOMSK_TIME_ZONE, weekday: "long" });

let activeViewer = ["dima", "alexandra"].includes(localStorage.getItem("schedule-viewer")) ? localStorage.getItem("schedule-viewer") : "dima";
let events = [];
let visibleDates = [];
let weekStartDate = getWeekStartDate(getTomskDateKey(getNow()));

function getNow() {
  const override = new URLSearchParams(location.search).get("now");
  return override ? new Date(`${override}+07:00`) : new Date();
}

function getTomskDateKey(now) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TOMSK_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateAtNoon(date) {
  return new Date(`${date}T12:00:00+07:00`);
}

function getWeekStartDate(date) {
  const cursor = dateAtNoon(date);
  const day = cursor.getUTCDay() || 7;
  cursor.setUTCDate(cursor.getUTCDate() - day + 1);
  return cursor.toISOString().slice(0, 10);
}

function eventDate(date, time) {
  return new Date(`${date}T${time === "24:00" ? "23:59:59" : `${time}:00`}+07:00`);
}

function eventEndDateValue(event) {
  return event.end_date || event.date;
}

function eventStartDateTime(event) {
  return eventDate(event.date, event.start);
}

function eventEndDateTime(event) {
  return eventDate(eventEndDateValue(event), event.end);
}

function timeToMinutes(time) {
  if (time === "24:00") return DAY_END_MINUTES;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timelinePoint(time) {
  return (timeToMinutes(time) / DAY_END_MINUTES) * 100;
}

function dayRangeFrom(startDate, count) {
  const dates = [];
  const cursor = dateAtNoon(startDate);
  for (let index = 0; index < count; index += 1) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
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
  const totalSeconds = Math.max(0, Math.floor((now - start) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const dayText = `${days} ${plural(days, ["день", "дня", "дней"])}`;
  if (!detailed) return `${dayText} назад`;
  return `${dayText}, ${hours} ${plural(hours, ["час", "часа", "часов"])} и ${minutes} ${plural(minutes, ["минута", "минуты", "минут"])}`;
}

function selectedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

function eventMatchesFilters(event) {
  if (!selectedValues("kind").includes(event.kind)) return false;
  if (event.kind === "background") return true;
  return selectedValues("category").includes(event.category)
    && selectedValues("participant").includes(event.participant);
}

function eventIntersectsDates(event, dates) {
  const start = event.date;
  const end = eventEndDateValue(event);
  return dates.some(date => start <= date && date <= end);
}

function visibleEvents() {
  return events
    .filter(event => eventIntersectsDates(event, visibleDates))
    .filter(eventMatchesFilters)
    .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
}

function nonBackgroundEvents() {
  return visibleEvents().filter(event => event.kind !== "background");
}

function getState(now) {
  const current = nonBackgroundEvents().find(event => eventStartDateTime(event) <= now && now < eventEndDateTime(event));
  const next = nonBackgroundEvents().find(event => eventStartDateTime(event) > now);
  return { current, next };
}

function eventMeta(event) {
  const parts = event.kind === "background"
    ? [kindLabels[event.kind], event.note]
    : [participantLabels[event.participant], categoryById[event.category]?.label, event.note];
  return parts.join(" · ");
}

function renderEventStatus(target, event) {
  target.innerHTML = `
    <div class="event-status ${event.kind}">
      <span class="status-dot" aria-hidden="true" style="--event-color:${categoryById[event.category]?.color || "#cf416c"}"></span>
      <strong>${escapeHtml(event.title)}</strong>
      <span>${escapeHtml(eventRangeText(event))}</span>
      <span class="status-note">${shortDateFormatter.format(dateAtNoon(event.date))} · ${escapeHtml(eventMeta(event))}</span>
    </div>`;
}

function renderEmptyStatus(target, title, message) {
  const template = document.querySelector("#empty-status-template").content.cloneNode(true);
  template.querySelector("strong").textContent = title;
  template.querySelector("span").textContent = message;
  target.replaceChildren(template);
}

function renderStatus() {
  const now = getNow();
  const { current, next } = getState(now);
  current
    ? renderEventStatus(document.querySelector("#current-status"), current)
    : renderEmptyStatus(document.querySelector("#current-status"), "Сейчас свободно", "Нет активных обычных дел или предложений");
  next
    ? renderEventStatus(document.querySelector("#next-status"), next)
    : renderEmptyStatus(document.querySelector("#next-status"), "Дальше пока пусто", "Можно добавить планы или фоновое событие");
}

function renderSchedule(keepScroll = false) {
  const list = document.querySelector("#schedule-list");
  const scroll = document.querySelector("#timeline-scroll");
  const oldScroll = keepScroll ? scroll.scrollLeft : null;
  const todayKey = getTomskDateKey(getNow());
  const filtered = visibleEvents();

  const rows = visibleDates.map(date => {
    const row = document.createElement("article");
    row.className = "day-row";
    row.id = `day-${date}`;
    row.dataset.date = date;
    if (date === todayKey) row.classList.add("is-today");
    if (date < todayKey) row.classList.add("is-past-day");

    const meta = document.createElement("header");
    meta.className = "day-meta";
    meta.innerHTML = `<time datetime="${date}">${rowDateFormatter.format(dateAtNoon(date))}</time><span>${weekdayFormatter.format(dateAtNoon(date))}</span>`;

    const timeline = document.createElement("div");
    timeline.className = "day-timeline";
    const dayEvents = filtered.filter(event => event.date <= date && date <= eventEndDateValue(event));
    const background = dayEvents.filter(event => event.kind === "background");
    const foreground = dayEvents.filter(event => event.kind !== "background");

    background.forEach(event => timeline.append(createEventNode(event, true, date)));
    foreground.forEach(event => timeline.append(createEventNode(event, false, date)));
    if (!dayEvents.length) {
      const empty = document.createElement("div");
      empty.className = "empty-day";
      empty.textContent = "Пока ничего нет";
      timeline.append(empty);
    }
    row.append(meta, timeline);
    return row;
  });

  list.replaceChildren(...rows);
  applyPastFilter();
  renderEventList();
  renderStatus();
  if (oldScroll !== null) scroll.scrollLeft = oldScroll;
}

function segmentForDate(event, date) {
  const endDate = eventEndDateValue(event);
  return {
    start: date === event.date ? event.start : "00:00",
    end: date === endDate ? event.end : "24:00",
    continuationStart: date > event.date,
    continuationEnd: date < endDate
  };
}

function eventRangeText(event) {
  const endDate = eventEndDateValue(event);
  if (endDate === event.date) return `${event.start}–${event.end}`;
  return `${rowDateFormatter.format(dateAtNoon(event.date))} ${event.start} — ${rowDateFormatter.format(dateAtNoon(endDate))} ${event.end}`;
}

function createEventNode(event, background, date) {
  const segment = segmentForDate(event, date);
  const item = document.createElement("button");
  item.type = "button";
  item.className = `timeline-event ${event.kind} category-${event.category}`;
  if (segment.continuationStart) item.classList.add("continues-from-before");
  if (segment.continuationEnd) item.classList.add("continues-after");
  if (background) item.classList.add("is-background");
  item.style.setProperty("--start", timelinePoint(segment.start));
  item.style.setProperty("--end", timelinePoint(segment.end));
  item.style.setProperty("--event-color", categoryById[event.category]?.color || "#cf416c");
  item.title = `${eventRangeText(event)}: ${event.title}. ${eventMeta(event)}`;
  item.setAttribute("aria-label", `${eventRangeText(event)}: ${event.title}. Открыть редактирование`);
  item.innerHTML = `
    <strong>${escapeHtml(event.title)}</strong>
    <span class="event-time">${segment.start}–${segment.end}</span>
    <span>${escapeHtml(eventMeta(event))}</span>`;
  item.addEventListener("click", () => openEventDialog(event));
  return item;
}

function renderEventList() {
  const target = document.querySelector("#event-list");
  const filtered = visibleEvents();
  document.querySelector("#event-count").textContent = `${filtered.length} ${plural(filtered.length, ["событие", "события", "событий"])} с учётом фильтров`;
  if (!filtered.length) {
    target.innerHTML = '<p class="empty-list">Ничего не найдено. Добавь занятие или включи больше фильтров.</p>';
    return;
  }
  target.replaceChildren(...filtered.map(event => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `event-list-item ${event.kind}`;
    item.style.setProperty("--event-color", categoryById[event.category]?.color || "#cf416c");
    item.innerHTML = `
      <span class="event-list-date">${rowDateFormatter.format(dateAtNoon(event.date))}</span>
      <strong>${escapeHtml(event.title)}</strong>
      <span>${escapeHtml(eventRangeText(event))} · ${escapeHtml(kindLabels[event.kind])} · ${escapeHtml(eventMeta(event))}</span>`;
    item.addEventListener("click", () => openEventDialog(event));
    return item;
  }));
}

function applyPastFilter() {
  const showPast = document.querySelector("#show-past").checked;
  const todayKey = getTomskDateKey(getNow());
  document.querySelectorAll(".day-row").forEach(row => row.classList.toggle("is-hidden", !showPast && row.dataset.date < todayKey));
}

function renderFilters() {
  const target = document.querySelector("#category-filters");
  target.replaceChildren(...categories.filter(category => category.id !== "background").map(category => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" name="category" value="${category.id}" checked> ${category.label}`;
    label.style.setProperty("--event-color", category.color);
    return label;
  }));
  document.querySelector("#event-category").replaceChildren(...categories.map(category => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.label;
    return option;
  }));
}

function updateClock() {
  const now = getNow();
  document.querySelector("#tomsk-time").textContent = timeFormatter.format(now);
  document.querySelector("#tomsk-date").textContent = fullDateFormatter.format(now);
  document.querySelector("#together-counter").textContent = elapsedText(RELATIONSHIP_START, now, true);
  document.querySelector("#meeting-counter").textContent = elapsedText(FIRST_MEETING, now);
  document.querySelector("#kiss-counter").textContent = elapsedText(FIRST_KISS, now);
  return now;
}

function updateVisibleRange() {
  visibleDates = dayRangeFrom(weekStartDate, VISIBLE_DAYS);
  const first = rowDateFormatter.format(dateAtNoon(visibleDates[0]));
  const last = rowDateFormatter.format(dateAtNoon(visibleDates[visibleDates.length - 1]));
  document.querySelector("#visible-range").textContent = `${first} — ${last}`;
  document.querySelector("#week-range").textContent = `${first} — ${last}`;
}

function setWeekStart(date, keepScroll = false) {
  weekStartDate = getWeekStartDate(date);
  updateVisibleRange();
  renderSchedule(keepScroll);
  scrollToDaytime();
}

function shiftWeek(delta) {
  const cursor = dateAtNoon(weekStartDate);
  cursor.setUTCDate(cursor.getUTCDate() + delta * VISIBLE_DAYS);
  setWeekStart(cursor.toISOString().slice(0, 10));
}

async function loadEvents() {
  const response = await fetch("/api/events", { cache: "no-store" });
  if (!response.ok) throw new Error("Не удалось загрузить события");
  const payload = await response.json();
  events = Array.isArray(payload.events) ? payload.events : [];
  renderSchedule(true);
}

function setViewer(viewer) {
  activeViewer = viewer;
  localStorage.setItem("schedule-viewer", viewer);
  document.querySelectorAll(".viewer-button").forEach(button => {
    const active = button.dataset.viewer === viewer;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function openEventDialog(event = null) {
  const dialog = document.querySelector("#event-dialog");
  const today = getTomskDateKey(getNow());
  document.querySelector("#event-dialog-kicker").textContent = event ? "Редактирование" : "Новое занятие";
  document.querySelector("#event-dialog-title").textContent = event ? "Изменить событие" : "Добавить в расписание";
  document.querySelector("#event-id").value = event?.id || "";
  document.querySelector("#event-title").value = event?.title || "";
  document.querySelector("#event-date").value = event?.date || today;
  document.querySelector("#event-end-date").value = event?.end_date || event?.date || today;
  document.querySelector("#event-start").value = event?.start || "12:00";
  document.querySelector("#event-end").value = event?.end || "13:00";
  document.querySelector("#event-kind").value = event?.kind || "personal";
  document.querySelector("#event-category").value = event?.category || "personal";
  document.querySelector("#event-participant").value = event?.participant || activeViewer;
  document.querySelector("#event-note").value = event?.note || "";
  document.querySelector("#delete-event").hidden = !event;
  document.querySelector("#event-error").hidden = true;
  syncKindDefaults();
  dialog.showModal();
}

function closeEventDialog() {
  document.querySelector("#event-dialog").close();
}

function readEventForm() {
  const title = document.querySelector("#event-title").value.trim();
  const date = document.querySelector("#event-date").value;
  const endDate = document.querySelector("#event-end-date").value || date;
  const start = document.querySelector("#event-start").value;
  const end = document.querySelector("#event-end").value;
  if (!title) throw new Error("Нужно указать название");
  if (!date || !endDate || !start || !end) throw new Error("Нужно указать даты и время");
  if (endDate < date) throw new Error("Дата окончания не может быть раньше даты начала");
  if (endDate === date && timeToMinutes(end) <= timeToMinutes(start)) throw new Error("Конец должен быть позже начала");
  return {
    title,
    date,
    end_date: endDate,
    start,
    end,
    kind: document.querySelector("#event-kind").value,
    category: document.querySelector("#event-category").value,
    participant: document.querySelector("#event-participant").value,
    note: document.querySelector("#event-note").value.trim(),
    author: activeViewer
  };
}

async function saveEvent(event) {
  event.preventDefault();
  const errorTarget = document.querySelector("#event-error");
  const button = document.querySelector("#save-event");
  errorTarget.hidden = true;
  button.disabled = true;
  try {
    const id = document.querySelector("#event-id").value;
    const payload = readEventForm();
    const response = await fetch(id ? `/api/events/${id}` : "/api/events", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Не удалось сохранить");
    closeEventDialog();
    await loadEvents();
  } catch (error) {
    errorTarget.textContent = error.message;
    errorTarget.hidden = false;
  } finally {
    button.disabled = false;
  }
}

async function deleteEvent() {
  const id = document.querySelector("#event-id").value;
  if (!id) return;
  const errorTarget = document.querySelector("#event-error");
  errorTarget.hidden = true;
  try {
    const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Не удалось удалить");
    closeEventDialog();
    await loadEvents();
  } catch (error) {
    errorTarget.textContent = error.message;
    errorTarget.hidden = false;
  }
}

function syncKindDefaults() {
  const kind = document.querySelector("#event-kind").value;
  const category = document.querySelector("#event-category");
  const participant = document.querySelector("#event-participant");
  if (kind === "background") {
    category.value = "background";
    participant.value = "background";
  } else if (kind === "proposal" && participant.value === "background") {
    participant.value = "both";
  } else if (kind === "personal" && participant.value === "background") {
    participant.value = activeViewer;
  }
}

function scrollToDaytime() {
  const scroll = document.querySelector("#timeline-scroll");
  const canvas = document.querySelector(".timeline-canvas");
  const dateWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--date-column")) || 175;
  const timelineWidth = canvas.scrollWidth - dateWidth;
  scroll.scrollLeft = Math.max(0, dateWidth + timelineWidth * (8 / 24) - scroll.clientWidth * 0.18);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderFilters();
updateVisibleRange();
setViewer(activeViewer);
updateClock();
renderSchedule();
scrollToDaytime();
loadEvents().catch(error => {
  console.error(error);
  renderEmptyStatus(document.querySelector("#current-status"), "Сервер недоступен", "Не удалось загрузить общее расписание");
});

document.querySelectorAll(".viewer-button").forEach(button => button.addEventListener("click", () => setViewer(button.dataset.viewer)));
document.querySelectorAll('input[name="category"], input[name="kind"], input[name="participant"]').forEach(input => input.addEventListener("change", () => renderSchedule(true)));
document.querySelector("#show-past").addEventListener("change", applyPastFilter);
document.querySelector("#prev-week-button").addEventListener("click", () => shiftWeek(-1));
document.querySelector("#next-week-button").addEventListener("click", () => shiftWeek(1));
document.querySelector("#today-button").addEventListener("click", () => {
  setWeekStart(getTomskDateKey(getNow()), true);
  const row = document.querySelector(`#day-${getTomskDateKey(getNow())}`);
  (row || document.querySelector(".schedule-section")).scrollIntoView({ behavior: "smooth", block: "center" });
});
document.querySelector("#add-event-button").addEventListener("click", () => openEventDialog());
document.querySelector("#event-form").addEventListener("submit", saveEvent);
document.querySelector("#delete-event").addEventListener("click", deleteEvent);
document.querySelector("#event-kind").addEventListener("change", syncKindDefaults);
document.querySelector("#event-date").addEventListener("change", () => {
  const startDate = document.querySelector("#event-date").value;
  const endDate = document.querySelector("#event-end-date");
  if (!endDate.value || endDate.value < startDate) endDate.value = startDate;
});
document.querySelector(".dialog-close").addEventListener("click", closeEventDialog);
document.querySelector("[data-close-dialog]").addEventListener("click", closeEventDialog);
document.querySelector("#event-dialog").addEventListener("click", event => {
  if (event.target === event.currentTarget) closeEventDialog();
});

setInterval(() => {
  const previousToday = getTomskDateKey(getNow());
  const currentWeekWasVisible = weekStartDate === getWeekStartDate(previousToday);
  const oldMinute = document.querySelector("#tomsk-time").textContent.slice(0, 5);
  const now = updateClock();
  const newDay = getTomskDateKey(now);
  if (newDay !== previousToday && currentWeekWasVisible) {
    setWeekStart(newDay, true);
  } else if (timeFormatter.format(now).slice(0, 5) !== oldMinute) {
    renderStatus();
  }
}, 1000);

setInterval(() => {
  if (!document.hidden && !document.querySelector("#event-dialog").open) {
    loadEvents().catch(console.error);
  }
}, 15000);
