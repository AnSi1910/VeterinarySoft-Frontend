export type User = {
    id: number;
    email: string;
    full_name: string;
    role: 'owner' | 'admin';
};
export type Pet = {
    id: number;
    owner_id: number;
    name: string;
    species: string;
    breed: string | null;
    birth_date: string | null;
};
export type Vet = {
    id: number;
    full_name: string;
    specialization: string;
    is_active: boolean;
};
export type Appointment = {
    id: number;
    pet_id: number;
    veterinarian_id: number;
    starts_at: string;
    reason: string | null;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};
export type Reminder = {
    id: number;
    pet_id: number;
    title: string;
    remind_at: string;
    status: string;
};
export type RecordItem = {
    id: number;
    pet_id: number;
    veterinarian_id: number | null;
    visit_date: string;
    diagnosis: string;
    treatment: string | null;
    notes: string | null;
};
export class ApiError extends Error {
    constructor(public code: number, message: string) { super(message); }
}
const host = 'http://127.0.0.1:8000';
const key = 'vetsoft_token';
export const token = { get: () => sessionStorage.getItem(key), set: (s: string) => sessionStorage.setItem(key, s), clear: () => sessionStorage.removeItem(key) };
function describe(body: any, status: number): string {
    if (typeof body?.detail === 'string')
        return body.detail;
    if (Array.isArray(body?.detail))
        return body.detail.map((v: any) => v.msg).join('; ');
    return `Помилка HTTP ${status}`;
}
export async function req<T>(route: string, method = 'GET', data?: unknown, form = false): Promise<T> {
    const h = new Headers();
    if (token.get())
        h.set('Authorization', `Bearer ${token.get()}`);
    if (data !== undefined && !form)
        h.set('Content-Type', 'application/json');
    let response: Response;
    try {
        response = await fetch(host + route, { method, headers: h, body: data === undefined ? undefined : form ? new URLSearchParams(data as Record<string, string>) : JSON.stringify(data), signal: AbortSignal.timeout(12000) });
    }
    catch {
        throw new ApiError(0, 'Сервер недоступний. Перевірте, чи працює FastAPI на 127.0.0.1:8000.');
    }
    if (!response.ok) {
        let body: any = {};
        try {
            body = await response.json();
        }
        catch { }
        throw new ApiError(response.status, describe(body, response.status));
    }
    if (response.status === 204)
        return undefined as T;
    return response.json() as Promise<T>;
}
export const api = {
    login: (email: string, password: string) => req<{
        access_token: string;
    }>('/api/auth/login', 'POST', { username: email, password }, true),
    register: (full_name: string, email: string, password: string) => req<User>('/api/auth/register', 'POST', { full_name, email, password }),
    me: () => req<User>('/api/users/me'), updateName: (full_name: string) => req<User>('/api/users/me', 'PATCH', { full_name }),
    pets: () => req<Pet[]>('/api/pets'), newPet: (data: unknown) => req<Pet>('/api/pets', 'POST', data),
    vets: () => req<Vet[]>('/api/veterinarians'), newVet: (data: unknown) => req<Vet>('/api/veterinarians', 'POST', data),
    appointments: () => req<Appointment[]>('/api/appointments'), newAppointment: (data: unknown) => req<Appointment>('/api/appointments', 'POST', data), status: (id: number, status: string) => req<Appointment>(`/api/appointments/${id}/status`, 'PATCH', { status }),
    records: (pet: number) => req<RecordItem[]>(`/api/medical-records/pet/${pet}`), newRecord: (data: unknown) => req<RecordItem>('/api/medical-records', 'POST', data),
    reminders: () => req<Reminder[]>('/api/reminders'), newReminder: (data: unknown) => req<Reminder>('/api/reminders', 'POST', data), deleteReminder: (id: number) => req<void>(`/api/reminders/${id}`, 'DELETE')
};

