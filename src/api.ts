import { AuthStorage } from './auth-storage';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

const getToken = () => AuthStorage.readToken();

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

const request = async (path: string, init?: RequestInit) => {
  try {
    const response = await fetch(`${BASE}${path}`, init);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      return data?.error ? data : { error: `Request failed (${response.status})` };
    }

    return data;
  } catch {
    return { error: 'Backend is unavailable. Start the server on http://localhost:3000.' };
  }
};

export const Api = {
  // Auth
  async register(data: object) {
    return request('/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  async login(data: object) {
    return request('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },

  // Candidates
  async getCandidates() {
    return request('/candidates', { headers: headers() });
  },

  // Profile
  async updateProfile(data: object) {
    return request('/profile', { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
  },

  // Vacancies
  async getVacancies() {
    return request('/vacancies', { headers: headers() });
  },
  async createVacancy(data: object) {
    return request('/vacancies', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  },

  // AI
  async chat(prompt: string) {
    return request('/ai/chat', { method: 'POST', headers: headers(), body: JSON.stringify({ prompt }) });
  },

  // Applications
  async apply(vacancyId: number) {
    return request('/applications', { method: 'POST', headers: headers(), body: JSON.stringify({ vacancyId }) });
  },
  async getApplications() {
    return request('/applications', { headers: headers() });
  },
  async updateApplicationStatus(id: number, status: string) {
    return request(`/applications/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ status })
    });
  },
  async updateVacancy(id: number, data: object) {
    return request(`/vacancies/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
  },
  async deleteVacancy(id: number) {
    return request(`/vacancies/${id}`, { method: 'DELETE', headers: headers() });
  },
  async getProjectMessages(vacancyId: number) {
    return request(`/projects/${vacancyId}/messages`, { headers: headers() });
  },
  async sendProjectMessage(vacancyId: number, text: string) {
    return request(`/projects/${vacancyId}/messages`, { method: 'POST', headers: headers(), body: JSON.stringify({ text }) });
  },
  // Projects & Reviews
  async getMyProjects() {
    return request('/projects/my', { headers: headers() });
  },
  async finishProject(vacancyId: number) {
    return request('/projects/finish', { method: 'POST', headers: headers(), body: JSON.stringify({ vacancyId }) });
  },
  async submitReview(data: object) {
    return request('/reviews', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  },
};
