import { api, ApiError, token, type User, type Pet, type Vet, type Appointment, type Reminder, type RecordItem } from './api.js';
const root = document.getElementById('app')!;
type Page = 'dashboard' | 'pets' | 'appointments' | 'medical' | 'reminders' | 'vets' | 'profile';
type Modal = 'pet' | 'appointment' | 'reminder' | 'vet' | 'record' | null;
const s: {
    user: User | null;
    auth: 'login' | 'register';
    page: Page;
    modal: Modal;
    pets: Pet[];
    vets: Vet[];
    appointments: Appointment[];
    records: RecordItem[];
    reminders: Reminder[];
    busy: boolean;
    msg: string;
    sidebar: boolean;
} = { user: null, auth: 'login', page: 'dashboard', modal: null, pets: [], vets: [], appointments: [], records: [], reminders: [], busy: false, msg: '', sidebar: false };
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
// SVG line icons keep the interface consistent across Windows, Android and iOS.
// They are part of our own code and require no fonts, emoji or icon packages.
const iconPaths: Record<string, string> = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    paw: '<circle cx="10" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="6" cy="10" r="1"/><circle cx="19" cy="10" r="1"/><path d="M11 12c-1.6 1.7-4.4 2-4.4 5.1 0 1.7 1.4 2.9 1.4 1.1 0 1.8-.7 2.4-.7s1.4.7 2.4.7c1.7 0 3-1.2 3-2.9 0-3.1-2.8-3.4-4.4-5.1-.6-.6-1.4-.6-2 0Z"/>',
    appointments: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    medical: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    reminders: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
    vets: '<path d="M6 3v8a5 5 0 0 0 10 0V3M4 3h4m6 0h4M11 17v1a4 4 0 0 0 8 0v-3"/><circle cx="19" cy="13" r="2"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    shield: '<path d="m12 2 8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z"/><path d="m9 12 2 2 4-4"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
};
function icon(name: string, size = 20): string {
    return `<svg class="line-icon" aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] ?? iconPaths.paw}</svg>`;
}
const ico: Record<string, string> = {
    dashboard: icon('dashboard'),
    pets: icon('paw'),
    appointments: icon('appointments'),
    medical: icon('medical'),
    reminders: icon('reminders'),
    vets: icon('vets'),
    profile: icon('profile'),
};
const labels: {
    [K in Page]: string;
} = { dashboard: 'Огляд', pets: 'Мої тварини', appointments: 'Записи на прийом', medical: 'Медичні картки', reminders: 'Нагадування', vets: 'Ветеринари', profile: 'Мій профіль' };
const fmt = (str: string) => { const dt = new Date(/Z|[+-]\d\d:\d\d$/.test(str) ? str : str + 'Z'); return Number.isNaN(+dt) ? esc(str) : new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(dt); };
const pName = (id: number) => s.pets.find(p => p.id === id)?.name || `Тварина #${id}`;
const vName = (id: number) => s.vets.find(v => v.id === id)?.full_name || `Лікар #${id}`;
const button = (action: string, caption: string, cls = '') => `<button type="button" data-action="${action}" class="btn ${cls}">${caption}</button>`;
const empty = (title: string, desc: string, action?: string, caption?: string) => `<div class="empty">
        <div class="empty-badge">${icon('paw', 27)}</div>
        <h3>${esc(title)}</h3>
        <p>${esc(desc)}</p>${action && caption ? button(action, caption, 'primary') : ''}</div>`;
function login() { return `<div class="auth">
        <section class="auth-visual">
        <a class="brand" href="#">${icon('paw', 27)} 
        <strong>VeterinarySoft
        <span>.
        </span>
        </strong>
        </a>
        <div class="story">
        <div class="eyebrow light">ВЕТЕРИНАРНИЙ ПРОСТІР
        </div>
        <h1>Уся турбота про улюбленців — 
        <em>в одному місці.
        </em>
        </h1>
        <p>Медичні картки, онлайн-запис і важливі дати. Зручно для вас і ваших хвостатих друзів.
        </p>
        <div class="hero-paw">${icon('medical', 58)}<span>Турбота поруч
        </span>
        </div>
        </div>
        <small class="auth-foot">${icon('shield', 16)} Особисті дані захищені серверною авторизацією
        </small>
        </section>
        <section class="auth-form">
        <div class="auth-card">
        <div class="eyebrow">ЛАСКАВО ПРОСИМО
        </div>
        <h2>${s.auth === 'login' ? 'Раді бачити знову' : 'Створіть обліковий запис'}</h2>
        <p>Вітаємо у вашому просторі турботи про тварин.
        </p>
        <div class="tabs">
        <button data-action="login-mode" class="${s.auth === 'login' ? 'active' : ''}">Вхід
        </button>
        <button data-action="register-mode" class="${s.auth === 'register' ? 'active' : ''}">Реєстрація
        </button>
        </div>${s.msg ? `<div class="alert" role="alert">${esc(s.msg)}</div>` : ''}<form data-form="auth" class="form">${s.auth === 'register' ? '<label>Ім’я<input name="full_name" required minlength="2" placeholder="Ваше ім’я" autocomplete="name"></label>' : ''}<label>Електронна пошта
        <input name="email" type="email" required placeholder="you@example.com" autocomplete="email">
        </label>
        <label>Пароль
        <input name="password" type="password" required minlength="8" placeholder="Не менше 8 символів">
        </label>
        <button class="btn primary wide" type="submit" ${s.busy ? 'disabled' : ''}>${s.auth === 'login' ? 'Увійти до кабінету' : 'Зареєструватися'} →
        </button>
        </form>
        <div class="tiny">Навчальний проєкт VeterinarySoft · ПЗ18
        </div>
        </div>
        </section>
        </div>`; }
function nav() { return `<aside class="sidebar ${s.sidebar ? 'open' : ''}">
        <div class="side-brand">${icon('paw', 23)} 
        <strong>Veterinary
        <span>Soft
        </span>
        </strong>
        <button class="menu-close" data-action="menu" aria-label="Закрити меню">${icon('close')}</button>
        </div>
        <div class="navtitle">РОБОЧИЙ ПРОСТІР
        </div>
        <nav>${(Object.keys(labels) as Page[]).filter(k => k !== 'profile').map(k => `<button data-page="${k}" class="navitem ${s.page === k ? 'selected' : ''}">
        <span>${ico[k]}</span>${labels[k]}</button>`).join('')}</nav>
        <div class="side-lower">
        <div class="support">
        <div class="support-icon">${icon('medical', 25)}</div>
        <strong>Турбота починається тут
        </strong>
        <p>Дані ваших улюбленців завжди під рукою.
        </p>
        </div>
        <button data-page="profile" class="user-side">
        <span class="avatar">${esc(s.user!.full_name.slice(0, 1).toUpperCase())}</span>
        <span>
        <b>${esc(s.user!.full_name)}</b>
        <small>${s.user!.role === 'admin' ? 'Адміністратор' : 'Власник тварини'}</small>
        </span>›
        </button>
        </div>
        </aside>`; }
function dashboard() { const active = s.appointments.filter(a => a.status === 'pending' || a.status === 'confirmed'); return `<div class="welcome">
        <div>
        <div class="welcome-label">ОСОБИСТИЙ КАБІНЕТ
        </div>
        <h2>Вітаємо, ${esc(s.user!.full_name.split(' ')[0])}!
        </h2>
        <p>Кожен візит, огляд і важлива дата — під контролем. Піклуймося про ваших улюбленців разом.
        </p>${button('open-appointment', 'Записатися до лікаря →', 'white')}</div>
        <div class="welcome-icon">${icon('medical', 62)}<span>З любов’ю до тварин
        </span>
        </div>
        </div>
        <div class="stats">
        <article>
        <span class="stat-icon mint">${icon('paw', 23)}</span>
        <div>
        <small>Мої тварини
        </small>
        <strong>${s.pets.length}</strong>
        <small>Електронні профілі
        </small>
        </div>
        </article>
        <article>
        <span class="stat-icon blue">${icon('appointments', 23)}</span>
        <div>
        <small>Майбутні прийоми
        </small>
        <strong>${active.length}</strong>
        <small>Заплановані візити
        </small>
        </div>
        </article>
        <article>
        <span class="stat-icon apricot">${icon('reminders', 23)}</span>
        <div>
        <small>Нагадування
        </small>
        <strong>${s.reminders.length}</strong>
        <small>Збережені події
        </small>
        </div>
        </article>
        </div>
        <div class="columns">
        <section class="panel">
        <div class="panel-header">
        <div>
        <h3>Найближчі прийоми
        </h3>
        <p>Ваші заплановані візити
        </p>
        </div>
        <button data-page="appointments">Усі записи →
        </button>
        </div>${active.length ? active.slice(0, 3).map(a => `<div class="row">
        <span class="mini-icon">${icon('appointments', 19)}</span>
        <div>
        <strong>${esc(pName(a.pet_id))} · ${esc(vName(a.veterinarian_id))}</strong>
        <small>${fmt(a.starts_at)}</small>
        </div>
        <span class="pill">${a.status === 'pending' ? 'Очікує' : 'Підтверджено'}</span>
        </div>`).join('') : empty('Записів поки немає', 'Запишіть свого улюбленця до ветеринара.', 'open-appointment', 'Записатися')}</section>
        <section class="panel">
        <div class="panel-header">
        <div>
        <h3>Ваші улюбленці
        </h3>
        <p>Швидкий доступ до профілів
        </p>
        </div>
        <button data-page="pets">Усі тварини →
        </button>
        </div>${s.pets.length ? s.pets.slice(0, 3).map(p => `<div class="row">
        <span class="mini-icon">${animal(p.species)}</span>
        <div>
        <strong>${esc(p.name)}</strong>
        <small>${esc(p.species)}${p.breed ? ' · ' + esc(p.breed) : ''}</small>
        </div>
        <button data-page="medical">›
        </button>
        </div>`).join('') : empty('Поки немає тварин', 'Створіть першу картку улюбленця.', 'open-pet', 'Додати тварину')}</section>
        </div>
        <p class="note">Дані зберігаються на сервері VeterinarySoft. Доставка push-повідомлень ще не реалізована.
        </p>`; }
const animal = (_species: string) => icon('paw', 32);
function pets() { return s.pets.length ? `<div class="cards">${s.pets.map(p => `<article class="pet-card">
        <div class="pet-cover">${animal(p.species)}</div>
        <div class="pet-content">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.species)} ${esc(p.breed || '')}</p>
        <small>Дата народження: ${esc(p.birth_date || 'не вказана')}</small>
        <button data-page="medical">Переглянути медичні записи →
        </button>
        </div>
        </article>`).join('')}</div>` : empty('Тварин ще не додано', 'Створіть картку вашого улюбленця.', 'open-pet', 'Додати тварину'); }
const statusLabel: {
    [key: string]: string;
} = { pending: 'Очікує підтвердження', confirmed: 'Підтверджено', completed: 'Завершено', cancelled: 'Скасовано' };
function appointments() { return s.appointments.length ? `<div class="panel list">${s.appointments.map(a => `<div class="entry">
        <div class="entry-icon">${icon('appointments', 21)}</div>
        <div class="entry-main">
        <strong>${esc(pName(a.pet_id))} — ${esc(vName(a.veterinarian_id))}</strong>
        <p>${fmt(a.starts_at)} · ${esc(a.reason || 'Огляд')}</p>
        </div>
        <span class="pill">${statusLabel[a.status]}</span>
        <div class="entry-actions">${s.user?.role === 'admin' && a.status === 'pending' ? `<button data-action="confirm" data-id="${a.id}">Підтвердити
        </button>` : ''}${s.user?.role === 'admin' && a.status === 'confirmed' ? `<button data-action="complete" data-id="${a.id}">Завершити
        </button>` : ''}${['pending', 'confirmed'].includes(a.status) ? `<button data-action="cancel" data-id="${a.id}">Скасувати
        </button>` : ''}</div>
        </div>`).join('')}</div>
        <p class="note">Час запису перевіряє сервер. Якщо його вже зайнято, буде показано помилку.
        </p>` : empty('Записів ще немає', 'Оберіть ветеринара та зручний час.', 'open-appointment', 'Новий запис'); }
function medical() { return s.records.length ? `<div class="panel list">${s.records.map(r => `<article class="entry">
        <div class="entry-icon">${icon('medical', 21)}</div>
        <div class="entry-main">
        <small>${esc(r.visit_date)} · ${esc(pName(r.pet_id))}</small>
        <strong>${esc(r.diagnosis)}</strong>${r.treatment ? `<p>Лікування: ${esc(r.treatment)}</p>` : ''}${r.notes ? `<p>Примітки: ${esc(r.notes)}</p>` : ''}</div>
        </article>`).join('')}</div>` : empty('Медична історія порожня', 'Медичні записи додає адміністратор клініки.'); }
function reminders() { return `<div class="panel list">${s.reminders.length ? s.reminders.map(r => `<div class="entry">
        <div class="entry-icon">${icon('reminders', 21)}</div>
        <div class="entry-main">
        <strong>${esc(r.title)}</strong>
        <p>${esc(pName(r.pet_id))} · ${fmt(r.remind_at)}</p>
        </div>
        <button data-action="delete-reminder" data-id="${r.id}" class="danger">Видалити
        </button>
        </div>`).join('') : empty('Нагадувань ще немає', 'Додайте дату вакцинації, огляду чи лікування.', 'open-reminder', 'Додати нагадування')}</div>
        <p class="note">Нагадування зберігаються в базі. Надсилання push-повідомлень поки не налаштоване.
        </p>`; }
function vets() { return s.vets.length ? `<div class="cards">${s.vets.map(v => `<article class="vet-card">
        <div class="vet-icon">${icon('vets', 27)}</div>
        <small>ВЕТЕРИНАРНИЙ ЛІКАР
        </small>
        <h3>${esc(v.full_name)}</h3>
        <p>${esc(v.specialization)}</p>
        <span class="pill">Приймає
        </span>
        </article>`).join('')}</div>` : empty('Лікарів ще не додано', 'Адміністратор може створити профіль ветеринара.', s.user?.role === 'admin' ? 'open-vet' : undefined, 'Додати лікаря'); }
function profile() { return `<div class="columns profile-columns">
        <section class="panel profile">
        <div class="profile-avatar">${icon('profile', 38)}</div>
        <h2>${esc(s.user!.full_name)}</h2>
        <p>${esc(s.user!.email)}</p>
        <span class="pill">${s.user!.role === 'admin' ? 'Адміністратор клініки' : 'Власник тварини'}</span>
        <hr/>
        <p>ID: ${s.user!.id}</p>
        </section>
        <section class="panel profile-edit">
        <h3>Особисті дані
        </h3>
        <p>Ви можете змінити ім’я у профілі.
        </p>
        <form data-form="profile" class="form">
        <label>Повне ім’я
        <input name="full_name" minlength="2" required value="${esc(s.user!.full_name)}">
        </label>
        <label>Електронна пошта
        <input value="${esc(s.user!.email)}" disabled>
        </label>
        <button class="btn primary" type="submit">Зберегти зміни
        </button>
        </form>
        <hr/>${button('logout', 'Вийти з облікового запису', 'outline')}</section>
        </div>`; }
function selectP() { return s.pets.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join(''); }
function selectV() { return s.vets.map(v => `<option value="${v.id}">${esc(v.full_name)} — ${esc(v.specialization)}</option>`).join(''); }
const futureDate = () => { const d = new Date(Date.now() + 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T12:00`; };
function modal() {
    if (!s.modal)
        return '';
    let title = '', fields = '';
    switch (s.modal) {
        case 'pet':
            title = 'Додати тварину';
            fields = '<label>Кличка<input name="name" required placeholder="Річі"></label><label>Вид тварини<input name="species" required minlength="2" placeholder="Собака"></label><label>Порода<input name="breed" placeholder="Необов’язково"></label><label>Дата народження<input type="date" name="birth_date"></label>';
            break;
        case 'appointment':
            title = 'Новий запис на прийом';
            fields = `${!s.pets.length ? '<p class="alert">Спочатку додайте тварину.</p>' : ''}${!s.vets.length ? '<p class="alert">Адміністратор повинен додати лікаря.</p>' : ''}<label>Тварина
        <select name="pet_id">${selectP()}</select>
        </label>
        <label>Ветеринар
        <select name="veterinarian_id">${selectV()}</select>
        </label>
        <label>Дата та час
        <input name="starts_at" type="datetime-local" required value="${futureDate()}">
        </label>
        <label>Причина візиту
        <textarea name="reason" rows="3">
        </textarea>
        </label>`;
            break;
        case 'reminder':
            title = 'Нове нагадування';
            fields = `<label>Тварина
        <select name="pet_id">${selectP()}</select>
        </label>
        <label>Назва
        <input name="title" required minlength="2" placeholder="Щеплення">
        </label>
        <label>Дата та час
        <input name="remind_at" type="datetime-local" required value="${futureDate()}">
        </label>`;
            break;
        case 'vet':
            title = 'Додати ветеринара';
            fields = '<label>Ім’я лікаря<input name="full_name" minlength="2" required></label><label>Спеціалізація<input name="specialization" minlength="2" required></label>';
            break;
        case 'record':
            title = 'Новий медичний запис';
            fields = `<label>Тварина
        <select name="pet_id">${selectP()}</select>
        </label>
        <label>Лікар
        <select name="veterinarian_id">
        <option value="">Не вказано
        </option>${selectV()}</select>
        </label>
        <label>Дата прийому
        <input type="date" name="visit_date" required value="${new Date().toISOString().slice(0, 10)}">
        </label>
        <label>Діагноз
        <input name="diagnosis" required minlength="2">
        </label>
        <label>Лікування
        <textarea name="treatment">
        </textarea>
        </label>
        <label>Примітки
        <textarea name="notes">
        </textarea>
        </label>`;
            break;
    }
    const disabled = (s.modal === 'appointment' && (!s.pets.length || !s.vets.length)) || (s.modal === 'reminder' && !s.pets.length) || (s.modal === 'record' && !s.pets.length);
    return `<div class="overlay" data-action="close-modal">
        <section class="modal" role="dialog" aria-modal="true">
        <header>
        <div>
        <div class="eyebrow">VETERINARYSOFT
        </div>
        <h2>${title}</h2>
        </div>
        <button data-action="close-modal" type="button" aria-label="Закрити">${icon('close', 20)}</button>
        </header>
        <form data-form="${s.modal}" class="form">${fields}<div class="modal-footer">${button('close-modal', 'Скасувати', 'outline')}<button class="btn primary" type="submit" ${disabled ? 'disabled' : ''}>Зберегти
        </button>
        </div>
        </form>
        </section>
        </div>`;
}
function shell() { const actions: Partial<Record<Page, string>> = { pets: 'open-pet', appointments: 'open-appointment', reminders: 'open-reminder', vets: s.user?.role === 'admin' ? 'open-vet' : undefined, medical: s.user?.role === 'admin' ? 'open-record' : undefined }; const contents = { dashboard, pets, appointments, medical, reminders, vets, profile }; return `<div class="app-layout">${nav()}${s.sidebar ? '<div class="shade" data-action="menu"></div>' : ''}<div class="workspace">
        <header class="topbar">
        <button class="mobile-menu" data-action="menu" aria-label="Відкрити меню">${icon('menu', 20)}</button>
        <div class="bread">VeterinarySoft &nbsp; / &nbsp; 
        <strong>${labels[s.page]}</strong>
        </div>
        <div class="right-top">
        <span class="api-indicator">Локальний API
        </span>
        <button data-page="profile" class="profile-button">
        <span class="avatar">${esc(s.user!.full_name[0])}</span> ${esc(s.user!.full_name.split(' ')[0])}</button>
        </div>
        </header>
        <main class="main-content">
        <div class="heading">
        <div>
        <span class="eyebrow">VETERINARYSOFT
        </span>
        <h1>${labels[s.page] === 'Огляд' ? 'Мій кабінет' : labels[s.page]}</h1>
        <p>${({ dashboard: 'Ваш простір для турботи про здоров’я улюбленців', pets: 'Електронні профілі ваших тварин', appointments: 'Плануйте візити до ветеринарів', medical: 'Історія оглядів та рекомендацій', reminders: 'Важливі дати під контролем', vets: 'Наші ветеринарні фахівці', profile: 'Особисті дані та налаштування' } as Record<Page, string>)[s.page]}</p>
        </div>${actions[s.page] ? button(actions[s.page]!, ({ pets: 'Додати тварину', appointments: 'Новий запис', reminders: 'Додати нагадування', vets: 'Додати лікаря', medical: 'Новий медзапис' } as Record<string, string>)[s.page], 'primary') : ''}</div>${s.msg ? `<div class="flash" role="status">${esc(s.msg)} 
        <button data-action="dismiss" aria-label="Закрити">${icon('close', 16)}</button>
        </div>` : ''}${contents[s.page]()}<footer>VeterinarySoft · Практичне заняття №18 
        <span>HTML · CSS · TypeScript · FastAPI
        </span>
        </footer>
        </main>
        </div>${modal()}${s.busy ? '<div class="loading"><span class="spinner"></span> Обробляємо запит…</div>' : ''}</div>`; }
function render() { root.innerHTML = s.user ? shell() : login(); }
async function refresh() { const [user, pets, vets, appointments, reminders] = await Promise.all([api.me(), api.pets(), api.vets(), api.appointments(), api.reminders()]); s.user = user; s.pets = pets; s.vets = vets; s.appointments = appointments; s.reminders = reminders; s.records = (await Promise.all(pets.map(p => api.records(p.id)))).flat(); }
async function run(fn: () => Promise<void>, msg = '') {
    if (s.busy)
        return;
    s.busy = true;
    render();
    try {
        await fn();
        s.msg = msg;
    }
    catch (err) {
        if (err instanceof ApiError && err.code === 401 && s.user) {
            s.user = null;
            token.clear();
            s.modal = null;
            s.msg = 'Сеанс завершився. Увійдіть повторно.';
        }
        else
            s.msg = err instanceof Error ? err.message : 'Невідома помилка.';
    }
    finally {
        s.busy = false;
        render();
    }
}
const formValue = (f: FormData, key: string) => String(f.get(key) || '').trim();
const nullable = (v: string) => v || null;
const iso = (v: string) => {
    const d = new Date(v);
    if (!v || Number.isNaN(d.getTime()))
        throw new Error('Некоректна дата або час.');
    return d.toISOString();
};
root.addEventListener('submit', ev => {
    const form = ev.target as HTMLFormElement;
    if (!form?.dataset.form)
        return;
    ev.preventDefault();
    const f = new FormData(form);
    const kind = form.dataset.form;
    if (kind === 'auth') {
        void run(async () => {
            const email = formValue(f, 'email'), pw = formValue(f, 'password');
            if (s.auth === 'register')
                await api.register(formValue(f, 'full_name'), email, pw);
            const res = await api.login(email, pw);
            token.set(res.access_token);
            await refresh();
            s.page = 'dashboard';
        }, 'Вхід успішний. Вітаємо!');
        return;
    }
    if (kind === 'profile') {
        void run(async () => { s.user = await api.updateName(formValue(f, 'full_name')); }, 'Ім’я оновлено.');
        return;
    }
    void run(async () => {
        if (kind === 'pet')
            await api.newPet({ name: formValue(f, 'name'), species: formValue(f, 'species'), breed: nullable(formValue(f, 'breed')), birth_date: nullable(formValue(f, 'birth_date')) });
        if (kind === 'appointment')
            await api.newAppointment({ pet_id: Number(formValue(f, 'pet_id')), veterinarian_id: Number(formValue(f, 'veterinarian_id')), starts_at: iso(formValue(f, 'starts_at')), reason: nullable(formValue(f, 'reason')) });
        if (kind === 'reminder')
            await api.newReminder({ pet_id: Number(formValue(f, 'pet_id')), title: formValue(f, 'title'), remind_at: iso(formValue(f, 'remind_at')) });
        if (kind === 'vet')
            await api.newVet({ full_name: formValue(f, 'full_name'), specialization: formValue(f, 'specialization') });
        if (kind === 'record')
            await api.newRecord({ pet_id: Number(formValue(f, 'pet_id')), veterinarian_id: formValue(f, 'veterinarian_id') ? Number(formValue(f, 'veterinarian_id')) : null, visit_date: formValue(f, 'visit_date'), diagnosis: formValue(f, 'diagnosis'), treatment: nullable(formValue(f, 'treatment')), notes: nullable(formValue(f, 'notes')) });
        await refresh();
        s.modal = null;
        s.page = kind === 'pet' ? 'pets' : kind === 'appointment' ? 'appointments' : kind === 'reminder' ? 'reminders' : kind === 'vet' ? 'vets' : 'medical';
    }, 'Зміни збережено на сервері.');
});
root.addEventListener('click', ev => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-page], [data-action]');
    if (!el)
        return;
    if (el.classList.contains('overlay') && (ev.target as HTMLElement).closest('.modal'))
        return;
    if (el.dataset.page) {
        s.page = el.dataset.page as Page;
        s.sidebar = false;
        s.msg = '';
        render();
        return;
    }
    const action = el.dataset.action;
    if (action === 'login-mode' || action === 'register-mode') {
        s.auth = action === 'login-mode' ? 'login' : 'register';
        s.msg = '';
        render();
        return;
    }
    if (action === 'logout') {
        token.clear();
        s.user = null;
        s.page = 'dashboard';
        s.msg = '';
        render();
        return;
    }
    if (action === 'menu') {
        s.sidebar = !s.sidebar;
        render();
        return;
    }
    if (action === 'dismiss') {
        s.msg = '';
        render();
        return;
    }
    if (action === 'close-modal') {
        s.modal = null;
        render();
        return;
    }
    if (action?.startsWith('open-')) {
        const m = action.slice(5) as Modal;
        if (['pet', 'appointment', 'reminder', 'vet', 'record'].includes(m || '')) {
            s.modal = m;
            render();
        }
        return;
    }
    const id = Number(el.dataset.id);
    if (['confirm', 'complete', 'cancel', 'delete-reminder'].includes(action || '')) {
        if ((action === 'cancel' || action === 'delete-reminder') && !confirm('Підтвердити цю дію?'))
            return;
        void run(async () => {
            if (action === 'delete-reminder')
                await api.deleteReminder(id);
            else
                await api.status(id, action === 'confirm' ? 'confirmed' : action === 'complete' ? 'completed' : 'cancelled');
            await refresh();
        }, 'Операцію виконано.');
    }
});
window.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && s.modal) {
        s.modal = null;
        render();
    }
});
if (token.get()) {
    void refresh().catch(() => { token.clear(); s.user = null; s.msg = 'Увійдіть повторно, щоб відновити сеанс.'; }).finally(render);
}
else
    render();

