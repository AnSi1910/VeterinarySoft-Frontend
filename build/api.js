export class ApiError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
const host = 'http://127.0.0.1:8000';
const key = 'vetsoft_token';
export const token = { get: () => sessionStorage.getItem(key), set: (s) => sessionStorage.setItem(key, s), clear: () => sessionStorage.removeItem(key) };
function describe(body, status) {
    if (typeof body?.detail === 'string')
        return body.detail;
    if (Array.isArray(body?.detail))
        return body.detail.map((v) => v.msg).join('; ');
    return `Помилка HTTP ${status}`;
}
export async function req(route, method = 'GET', data, form = false) {
    const h = new Headers();
    if (token.get())
        h.set('Authorization', `Bearer ${token.get()}`);
    if (data !== undefined && !form)
        h.set('Content-Type', 'application/json');
    let response;
    try {
        response = await fetch(host + route, { method, headers: h, body: data === undefined ? undefined : form ? new URLSearchParams(data) : JSON.stringify(data), signal: AbortSignal.timeout(12000) });
    }
    catch {
        throw new ApiError(0, 'Сервер недоступний. Перевірте, чи працює FastAPI на 127.0.0.1:8000.');
    }
    if (!response.ok) {
        let body = {};
        try {
            body = await response.json();
        }
        catch { }
        throw new ApiError(response.status, describe(body, response.status));
    }
    if (response.status === 204)
        return undefined;
    return response.json();
}
export const api = {
    login: (email, password) => req('/api/auth/login', 'POST', { username: email, password }, true),
    register: (full_name, email, password) => req('/api/auth/register', 'POST', { full_name, email, password }),
    me: () => req('/api/users/me'), updateName: (full_name) => req('/api/users/me', 'PATCH', { full_name }),
    pets: () => req('/api/pets'), newPet: (data) => req('/api/pets', 'POST', data),
    vets: () => req('/api/veterinarians'), newVet: (data) => req('/api/veterinarians', 'POST', data),
    appointments: () => req('/api/appointments'), newAppointment: (data) => req('/api/appointments', 'POST', data), status: (id, status) => req(`/api/appointments/${id}/status`, 'PATCH', { status }),
    records: (pet) => req(`/api/medical-records/pet/${pet}`), newRecord: (data) => req('/api/medical-records', 'POST', data),
    reminders: () => req('/api/reminders'), newReminder: (data) => req('/api/reminders', 'POST', data), deleteReminder: (id) => req(`/api/reminders/${id}`, 'DELETE')
};
