import type { UserProfile, Candidate, Vacancy, PeerReview, ChatMessage, Application } from './models';

const SEED_DATA_KEY = 'tf_seeded';

function getStorage<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const Database = {
  initialize() {
    if (!localStorage.getItem(SEED_DATA_KEY)) {
      this.resetDemoData();
      localStorage.setItem(SEED_DATA_KEY, 'true');
    }
  },

  getProfile(): UserProfile {
    return getStorage<UserProfile[]>('tf_profiles', [])[0];
  },

  updateProfile(profile: UserProfile): void {
    const profiles = getStorage<UserProfile[]>('tf_profiles', []);
    profiles[0] = profile;
    setStorage('tf_profiles', profiles);
  },

  getCandidates(): Candidate[] {
    const candidates = getStorage<Candidate[]>('tf_candidates', []);
    return candidates.sort((a, b) => b.karma - a.karma || b.gpa - a.gpa);
  },

  addCandidate(candidate: Candidate): void {
    const candidates = getStorage<Candidate[]>('tf_candidates', []);
    candidate.id = candidates.length > 0 ? Math.max(...candidates.map(c => c.id)) + 1 : 1;
    candidates.push(candidate);
    setStorage('tf_candidates', candidates);
  },

  getVacancies(): Vacancy[] {
    const vacancies = getStorage<Vacancy[]>('tf_vacancies', []);
    return vacancies.sort((a, b) => b.id - a.id);
  },

  addVacancy(vacancy: Vacancy): void {
    const vacancies = getStorage<Vacancy[]>('tf_vacancies', []);
    vacancy.id = vacancies.length > 0 ? Math.max(...vacancies.map(v => v.id)) + 1 : 1;
    vacancies.push(vacancy);
    setStorage('tf_vacancies', vacancies);
  },

  updateVacancyStatus(id: number, status: string): void {
    const vacancies = getStorage<Vacancy[]>('tf_vacancies', []);
    const index = vacancies.findIndex(v => v.id === id);
    if (index !== -1) {
      vacancies[index].status = status;
      setStorage('tf_vacancies', vacancies);
    }
  },

  getApplications(): Application[] {
    const apps = getStorage<Application[]>('tf_applications', []);
    return apps.sort((a, b) => b.id - a.id);
  },

  addApplication(vacancyId: number, candidateId: number, status: string): void {
    const apps = getStorage<Application[]>('tf_applications', []);
    apps.push({
      id: apps.length > 0 ? Math.max(...apps.map(a => a.id)) + 1 : 1,
      vacancyId,
      candidateId,
      status,
      createdAt: new Date().toISOString()
    });
    setStorage('tf_applications', apps);
  },

  updateApplicationStatus(id: number, status: string): void {
    const apps = getStorage<Application[]>('tf_applications', []);
    const index = apps.findIndex(a => a.id === id);
    if (index !== -1) {
      apps[index].status = status;
      setStorage('tf_applications', apps);
    }
  },

  getReviews(): PeerReview[] {
    const reviews = getStorage<PeerReview[]>('tf_reviews', []);
    return reviews.sort((a, b) => b.id - a.id);
  },

  addReview(candidateId: number, rating: number, teamwork: number, reliability: number, comment: string): void {
    const reviews = getStorage<PeerReview[]>('tf_reviews', []);
    reviews.push({
      id: reviews.length > 0 ? Math.max(...reviews.map(r => r.id)) + 1 : 1,
      candidateId,
      rating,
      teamwork,
      reliability,
      comment,
      createdAt: new Date().toISOString()
    });
    setStorage('tf_reviews', reviews);
    this.recalculateKarma(candidateId);
  },

  recalculateKarma(candidateId: number): void {
    const reviews = getStorage<PeerReview[]>('tf_reviews', []).filter(r => r.candidateId === candidateId);
    if (reviews.length === 0) return;
    
    let sum = 0;
    reviews.forEach(r => {
      sum += ((r.rating + r.teamwork + r.reliability) * 100.0) / 15.0;
    });
    const avg = Math.round(sum / reviews.length);
    const newKarma = Math.max(1, Math.min(100, avg));
    
    const candidates = getStorage<Candidate[]>('tf_candidates', []);
    const index = candidates.findIndex(c => c.id === candidateId);
    if (index !== -1) {
      candidates[index].karma = newKarma;
      candidates[index].reviewCount = reviews.length;
      candidates[index].reliabilityLabel = newKarma >= 70 ? 1 : 0;
      setStorage('tf_candidates', candidates);
    }
  },

  getMessages(): ChatMessage[] {
    return getStorage<ChatMessage[]>('tf_messages', []);
  },

  addMessage(sender: 'user' | 'assistant', text: string): void {
    const messages = getStorage<ChatMessage[]>('tf_messages', []);
    messages.push({
      id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
      sender,
      text,
      createdAt: new Date().toISOString()
    });
    setStorage('tf_messages', messages);
  },

  resetDemoData(): void {
    localStorage.clear();
    setStorage<UserProfile[]>('tf_profiles', [{
      id: 1,
      name: 'Ayan Serik',
      email: 'ayan.serik@university.edu',
      role: 'Team Lead',
      gpa: 3.62,
      skills: 'Kotlin, React, UX',
      schedule: 'Night owl',
      goal: 'A grade and portfolio project',
      karma: 86,
      githubCommits: 41,
      eliteMinGpa: 3.0
    }]);

    setStorage<Candidate[]>('tf_candidates', [
      { id: 1, name: 'Dana Omar', role: 'Backend Developer', gpa: 3.74, skills: 'Kotlin, SQL, REST', schedule: 'Night owl', goal: 'A grade and clean architecture', karma: 92, githubCommits: 68, completedProjects: 6, reliabilityLabel: 1, reviewCount: 4 },
      { id: 2, name: 'Aliya Nurbek', role: 'ML Assistant', gpa: 3.38, skills: 'Python, NLP, Statistics', schedule: 'Flexible', goal: 'Strong demo for defense', karma: 88, githubCommits: 53, completedProjects: 5, reliabilityLabel: 1, reviewCount: 3 },
      { id: 3, name: 'Miras Tulegen', role: 'UI/UX Designer', gpa: 2.92, skills: 'Figma, CSS, React', schedule: 'Early bird', goal: 'Stable pass and learning', karma: 78, githubCommits: 18, completedProjects: 4, reliabilityLabel: 1, reviewCount: 2 },
      { id: 4, name: 'Timur Askar', role: 'Researcher', gpa: 2.71, skills: 'Docs, Survey, Testing', schedule: 'Night owl', goal: 'Pass with low stress', karma: 64, githubCommits: 7, completedProjects: 2, reliabilityLabel: 0, reviewCount: 1 },
      { id: 5, name: 'Madina Sapar', role: 'Frontend Developer', gpa: 3.51, skills: 'React, CSS, Vite', schedule: 'Flexible', goal: 'A grade and startup pitch', karma: 90, githubCommits: 44, completedProjects: 7, reliabilityLabel: 1, reviewCount: 5 }
    ]);

    setStorage<Vacancy[]>('tf_vacancies', [
      { id: 1, projectName: 'Capstone Team Matcher', title: 'Build Web MVP', neededRole: 'Frontend Developer', minGpa: 3.0, weeklyHours: 4, responseHours: 24, mode: 'Hybrid', status: 'Open', description: 'Need UI dashboard and logic.' },
      { id: 2, projectName: 'AI Study Planner', title: 'Prototype assistant', neededRole: 'ML Assistant', minGpa: 3.2, weeklyHours: 5, responseHours: 12, mode: 'Performance', status: 'Open', description: 'Need explainable logic.' }
    ]);

    setStorage<ChatMessage[]>('tf_messages', [
      { id: 1, sender: 'assistant', text: 'Hi. I can recommend candidates, explain match risks, and draft defense arguments from your project data.', createdAt: new Date().toISOString() }
    ]);
  }
};
