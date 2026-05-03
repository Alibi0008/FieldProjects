const BASE = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('tf_token');

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

export const Api = {
  // Auth
  async register(data: object) {
    const r = await fetch(`${BASE}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return r.json();
  },
  async login(data: object) {
    const r = await fetch(`${BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return r.json();
  },

  // Candidates
  async getCandidates() {
    const r = await fetch(`${BASE}/candidates`, { headers: headers() });
    return r.json();
  },

  // Profile
  async updateProfile(data: object) {
    const r = await fetch(`${BASE}/profile`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
    return r.json();
  },

  // Vacancies
  async getVacancies() {
    const r = await fetch(`${BASE}/vacancies`, { headers: headers() });
    return r.json();
  },
  async createVacancy(data: object) {
    const r = await fetch(`${BASE}/vacancies`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
    return r.json();
  },

  // AI
  async chat(prompt: string) {
    const r = await fetch(`${BASE}/ai/chat`, { method: 'POST', headers: headers(), body: JSON.stringify({ prompt }) });
    return r.json();
  },

  // Applications
  async apply(vacancyId: number) {
    const r = await fetch(`${BASE}/applications`, { method: 'POST', headers: headers(), body: JSON.stringify({ vacancyId }) });
    return r.json();
  },
  async getApplications() {
    const r = await fetch(`${BASE}/applications`, { headers: headers() });
    return r.json();
  },
  async updateVacancy(id: number, data: object) {
    const r = await fetch(`${BASE}/vacancies/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
    return r.json();
  },
  async deleteVacancy(id: number) {
    const r = await fetch(`${BASE}/vacancies/${id}`, { method: 'DELETE', headers: headers() });
    return r.json();
  },
  async getProjectMessages(vacancyId: number) {
    const r = await fetch(`${BASE}/projects/${vacancyId}/messages`, { headers: headers() });
    return r.json();
  },
  async sendProjectMessage(vacancyId: number, text: string) {
    const r = await fetch(`${BASE}/projects/${vacancyId}/messages`, { method: 'POST', headers: headers(), body: JSON.stringify({ text }) });
    return r.json();
  },
  // Projects & Reviews
  async getMyProjects() {
    const r = await fetch(`${BASE}/projects/my`, { headers: headers() });
    return r.json();
  },
  async finishProject(vacancyId: number) {
    const r = await fetch(`${BASE}/projects/finish`, { method: 'POST', headers: headers(), body: JSON.stringify({ vacancyId }) });
    return r.json();
  },
  async submitReview(data: object) {
    const r = await fetch(`${BASE}/reviews`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
    return r.json();
  },
};
