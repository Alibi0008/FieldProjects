export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  gpa: number;
  skills: string;
  schedule: string;
  goal: string;
  karma: number;
  githubCommits: number;
  eliteMinGpa: number;
}

export interface Candidate {
  id: number;
  name: string;
  role: string;
  gpa: number;
  skills: string;
  schedule: string;
  goal: string;
  karma: number;
  githubCommits: number;
  completedProjects: number;
  reliabilityLabel: number;
  reviewCount: number;
}

export interface Vacancy {
  id: number;
  projectName: string;
  title: string;
  neededRole: string;
  minGpa: number;
  weeklyHours: number;
  responseHours: number;
  mode: string;
  status: string; // 'Open' | 'Filled' | 'Draft'
  description: string;
}

export interface PeerReview {
  id: number;
  candidateId: number;
  rating: number;
  teamwork: number;
  reliability: number;
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

export interface Application {
  id: number;
  vacancyId: number;
  candidateId: number;
  status: string; // 'Pending' | 'Invited' | 'Accepted' | 'Rejected'
  createdAt: string;
}

export type MatchMode = 'Hybrid' | 'Performance' | 'Social';

export const ROLES = [
  'Developer',
  'Designer',
  'Project Manager',
  'Data Scientist',
  'QA Engineer',
  'DevOps',
  'Business Analyst'
];

export interface MatchResult {
  candidate: Candidate;
  total: number;
  performance: number;
  social: number;
  risk: string;
  explanation: string;
}
