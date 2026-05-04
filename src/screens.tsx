import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  Briefcase,
  CheckCircle,
  Edit2,
  Globe,
  Info,
  Loader,
  MessageSquare,
  Send,
  Star,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Api } from './api';
import { useAuth } from './AuthContext';
import { MatchingEngine } from './engines';
import type { Candidate, MatchMode, UserProfile, Vacancy } from './models';
import { ROLES } from './models';

type ToastType = 'success' | 'error';

type ToastState = {
  message: string;
  type: ToastType;
} | null;

type AppCandidate = Candidate & {
  email?: string;
};

type IncomingApplication = {
  id: number;
  status: string;
  candidate: {
    id: number;
    name: string;
    role: string;
    gpa: number;
    karma: number;
    skills: string;
  };
  vacancy: {
    projectName: string;
    neededRole: string;
  };
};

type OutgoingApplication = {
  vacancyId: number;
  status: string;
};

type InvitationApplication = {
  id: number;
  status: string;
  vacancy: {
    id: number;
    projectName: string;
    neededRole: string;
    minGpa: number;
    weeklyHours: number;
    mode: string;
    author: {
      id: number;
      name: string;
      role: string;
    };
  };
};

type VacancyRecord = Vacancy & {
  authorId: number;
  author?: {
    name: string;
  };
};

type ProjectMember = {
  id: number;
  name: string;
  role: string;
  gpa?: number;
  skills?: string;
  isAuthor?: boolean;
};

type ProjectRecord = {
  id: number;
  projectName: string;
  title: string;
  neededRole: string;
  status: string;
  authorId: number;
  author: ProjectMember;
  applications: Array<{
    id: number;
    status: string;
    candidate: ProjectMember;
  }>;
};

type ProjectMessage = {
  id: number;
  text: string;
  senderId: number;
  sender: {
    id: number;
    name: string;
    role: string;
  };
};

type InviteState = {
  candidate: AppCandidate;
  vacancyId: string;
};

type VacancyForm = {
  projectName: string;
  title: string;
  neededRole: string;
  minGpa: string;
  weeklyHours: string;
  responseHours: string;
  mode: string;
  description: string;
};

const defaultVacancyForm = (): VacancyForm => ({
  projectName: '',
  title: 'Teammate Needed',
  neededRole: 'Developer',
  minGpa: '3.0',
  weeklyHours: '4',
  responseHours: '24',
  mode: 'Hybrid',
  description: 'Looking for a motivated teammate.',
});

const buildProfileForm = (user: ReturnType<typeof useAuth>['user']) => ({
  name: user?.name || '',
  role: user?.role || 'Developer',
  gpa: user?.gpa?.toString() || '3.0',
  skills: user?.skills || '',
  eliteMinGpa: user?.eliteMinGpa?.toString() || '3.5',
  matchingMode: user?.matchingMode || 'Hybrid',
});

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
};

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: ToastType;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
      <span>{message}</span>
    </div>
  );
};

export const DashboardScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidateCount, setCandidateCount] = useState(0);
  const [vacancyCount, setVacancyCount] = useState(0);
  const [incomingApps, setIncomingApps] = useState<IncomingApplication[]>([]);
  const [invitations, setInvitations] = useState<InvitationApplication[]>([]);
  const [myProjects, setMyProjects] = useState<ProjectRecord[]>([]);
  const [notification, setNotification] = useState<ToastState>(null);

  useEffect(() => {
    Api.getCandidates().then((data) => setCandidateCount(Array.isArray(data) ? data.length : 0)).catch(() => {});
    Api.getVacancies().then((data) => setVacancyCount(Array.isArray(data) ? data.length : 0)).catch(() => {});
    Api.getApplications()
      .then((data) => {
        setIncomingApps(Array.isArray(data?.incoming) ? data.incoming : []);
        setInvitations(Array.isArray(data?.invitations) ? data.invitations : []);
      })
      .catch(() => {});
    Api.getMyProjects()
      .then((data) => setMyProjects(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const refreshProjects = () => {
    Api.getMyProjects().then((data) => setMyProjects(Array.isArray(data) ? data : []));
    Api.getCandidates().then((data) => setCandidateCount(Array.isArray(data) ? data.length : 0));
  };

  const handleStatus = async (id: number, status: string) => {
    const data = await Api.updateApplicationStatus(id, status);
    if (data?.error) {
      setNotification({ message: data.error, type: 'error' });
      return;
    }

    setNotification({ message: `Application ${status.toLowerCase()}`, type: 'success' });
    Api.getApplications().then((result) => {
      setIncomingApps(Array.isArray(result?.incoming) ? result.incoming : []);
      setInvitations(Array.isArray(result?.invitations) ? result.invitations : []);
    });
    if (status === 'Accepted') {
      refreshProjects();
    }
  };

  return (
    <div className="screen-container animate-fade-in">
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Friend'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          A compact view of your recruiting flow, active teams, and next actions.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Vacancies', value: vacancyCount, color: 'var(--primary)' },
          { label: 'Candidates', value: candidateCount, color: 'var(--secondary)' },
          { label: 'Karma', value: user?.karma ?? 80, color: 'var(--warning)' },
          { label: 'Finished', value: user?.completedProjects ?? 0, color: 'var(--success)' },
        ].map((item) => (
          <div key={item.label} className="card stat-card" style={{ padding: '0.85rem 1rem', minHeight: '92px' }}>
            <span style={{ color: item.color, fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>{item.label}</span>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {incomingApps.length > 0 && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={20} style={{ color: 'var(--primary)' }} /> Incoming Applications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {incomingApps.map((application) => (
              <div
                key={application.id}
                className="card"
                style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem' }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem' }}>
                    {application.candidate.name} applied for <span style={{ color: 'var(--primary)' }}>{application.vacancy.projectName}</span>
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Role: {application.candidate.role} | GPA: {application.candidate.gpa} | Karma: {application.candidate.karma}
                  </p>
                </div>
                {application.status === 'Pending' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleStatus(application.id, 'Accepted')} className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                      Accept
                    </button>
                    <button onClick={() => handleStatus(application.id, 'Rejected')} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className={`pill ${application.status === 'Accepted' ? 'pill-success' : 'pill-danger'}`}>{application.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.length > 0 && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Briefcase size={20} style={{ color: 'var(--warning)' }} /> Project Invitations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="card"
                style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem' }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem' }}>
                    <span style={{ color: 'var(--primary)' }}>{invitation.vacancy.author.name}</span> invited you to{' '}
                    <span style={{ color: 'var(--primary)' }}>{invitation.vacancy.projectName}</span>
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Role: {invitation.vacancy.neededRole} | GPA: {invitation.vacancy.minGpa} | {invitation.vacancy.weeklyHours}h/week | {invitation.vacancy.mode}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleStatus(invitation.id, 'Accepted')} className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                    Accept
                  </button>
                  <button onClick={() => handleStatus(invitation.id, 'Rejected')} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myProjects.length > 0 && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Briefcase size={20} style={{ color: 'var(--secondary)' }} /> Your Teams & Projects
          </h3>
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
            {myProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onRefresh={refreshProjects}
                onNotify={(message, type) => setNotification({ message, type })}
              />
            ))}
          </div>
        </div>
      )}

      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>Quick Match Analysis</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Open the ranking screen to compare candidates using your current GPA, skills, and preferred strategy.
          </p>
        </div>
        <button onClick={() => navigate('/match')} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          Open Match Engine
        </button>
      </div>

      <div className="toast-container">
        {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      </div>
    </div>
  );
};

export const ProfileScreen = () => {
  const { user, refreshUser } = useAuth();
  const [notification, setNotification] = useState<ToastState>(null);
  const [form, setForm] = useState(() => buildProfileForm(user));

  const save = async () => {
    const updated = await Api.updateProfile(form);
    if (updated?.error) {
      setNotification({ message: updated.error, type: 'error' });
      return;
    }

    refreshUser(updated);
    setNotification({ message: 'Profile updated successfully', type: 'success' });
  };

  return (
    <div className="screen-container animate-fade-in">
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Your Profile</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your identity and preferences. You have finished <strong>{user?.completedProjects || 0} projects</strong>.
        </p>
      </div>

      <div className="card form-container-small" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Professional Role</label>
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Current GPA</label>
            <input type="number" step="0.1" min="0" max="4" value={form.gpa} onChange={(event) => setForm({ ...form, gpa: event.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Elite Min GPA Target</label>
            <input type="number" step="0.1" min="0" max="4" value={form.eliteMinGpa} onChange={(event) => setForm({ ...form, eliteMinGpa: event.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Default Matching Strategy</label>
            <select
              value={form.matchingMode}
              onChange={(event) => setForm({ ...form, matchingMode: event.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="Hybrid">Hybrid</option>
              <option value="Performance">Performance</option>
              <option value="Social">Social</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Skills & Tech Stack</label>
            <textarea rows={3} value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={save} className="btn btn-primary" style={{ minWidth: '160px' }}>
            Update Profile
          </button>
        </div>
      </div>

      <div className="toast-container">
        {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      </div>
    </div>
  );
};

export const VacanciesScreen = () => {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState<VacancyRecord[]>([]);
  const [notification, setNotification] = useState<ToastState>(null);
  const [form, setForm] = useState<VacancyForm>(defaultVacancyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [outgoingApplications, setOutgoingApplications] = useState<OutgoingApplication[]>([]);

  const refreshVacancies = () => {
    Api.getVacancies().then((data) => setVacancies(Array.isArray(data) ? data : []));
  };

  const refreshApplications = () => {
    Api.getApplications().then((data) => {
      const outgoing = Array.isArray(data?.outgoing) ? data.outgoing : [];
      setOutgoingApplications(outgoing);
    });
  };

  useEffect(() => {
    refreshVacancies();
    refreshApplications();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultVacancyForm());
  };

  const add = async () => {
    const data = await Api.createVacancy(form);
    if (data?.error) {
      setNotification({ message: data.error, type: 'error' });
      return;
    }

    setNotification({ message: 'Vacancy posted successfully', type: 'success' });
    refreshVacancies();
    resetForm();
  };

  const update = async (id: number) => {
    const data = await Api.updateVacancy(id, form);
    if (data?.error) {
      setNotification({ message: data.error, type: 'error' });
      return;
    }

    setNotification({ message: 'Vacancy updated', type: 'success' });
    refreshVacancies();
    resetForm();
  };

  const startEdit = (vacancy: VacancyRecord) => {
    setEditingId(vacancy.id);
    setForm({
      projectName: vacancy.projectName,
      title: vacancy.title,
      neededRole: vacancy.neededRole,
      minGpa: vacancy.minGpa.toString(),
      weeklyHours: vacancy.weeklyHours.toString(),
      responseHours: vacancy.responseHours.toString(),
      mode: vacancy.mode,
      description: vacancy.description,
    });
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this vacancy?')) return;

    const data = await Api.deleteVacancy(id);
    if (data?.error) {
      setNotification({ message: data.error, type: 'error' });
      return;
    }

    setNotification({ message: 'Vacancy deleted', type: 'success' });
    refreshVacancies();
  };

  const handleApply = async (id: number) => {
    const data = await Api.apply(id);
    if (data?.error) {
      setNotification({ message: data.error, type: 'error' });
      return;
    }

    setOutgoingApplications((prev) => [...prev, { vacancyId: id, status: 'Pending' }]);
    setNotification({ message: 'Application sent', type: 'success' });
  };

  const outgoingByVacancy = new Map(outgoingApplications.map((application) => [application.vacancyId, application.status]));

  return (
    <div className="screen-container animate-fade-in">
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Vacancies</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Find projects to join or recruit teammates for your own work.</p>
      </div>

      <div className="card form-container-small" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem' }}>{editingId ? 'Edit Vacancy' : 'Post New Vacancy'}</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input value={form.projectName} onChange={(event) => setForm({ ...form, projectName: event.target.value })} placeholder="AI Matcher" />
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Frontend teammate needed" />
          </div>
          <div className="form-group">
            <label className="form-label">Role Needed</label>
            <select
              value={form.neededRole}
              onChange={(event) => setForm({ ...form, neededRole: event.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Min GPA</label>
            <input type="number" step="0.1" value={form.minGpa} onChange={(event) => setForm({ ...form, minGpa: event.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Weekly Hours</label>
            <input type="number" value={form.weeklyHours} onChange={(event) => setForm({ ...form, weeklyHours: event.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Response Time (h)</label>
            <input type="number" value={form.responseHours} onChange={(event) => setForm({ ...form, responseHours: event.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Work Format</label>
            <select
              value={form.mode}
              onChange={(event) => setForm({ ...form, mode: event.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 4' }}>
            <label className="form-label">Short Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="What should a candidate know before applying?"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', gridColumn: 'span 2' }}>
            {editingId ? (
              <>
                <button onClick={() => update(editingId)} className="btn btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
                <button onClick={resetForm} className="btn btn-secondary">
                  <X size={16} />
                </button>
              </>
            ) : (
              <button onClick={add} className="btn btn-primary" style={{ width: '100%' }}>
                Post Vacancy
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '0.75rem' }}>
        {vacancies.length === 0 && <p style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No vacancies yet. Post the first one.</p>}
        {vacancies.map((vacancy) => (
          <div
            key={vacancy.id}
            className="card"
            style={{ borderLeft: '3px solid var(--primary)', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem' }}
          >
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{vacancy.projectName}</h3>
                <span className={`pill ${vacancy.status === 'Completed' ? 'pill-neutral' : 'pill-success'}`} style={{ fontSize: '0.68rem' }}>
                  {vacancy.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', flexWrap: 'wrap', marginBottom: vacancy.description ? '0.35rem' : 0 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Role: <strong>{vacancy.neededRole}</strong></span>
                <span style={{ color: 'var(--text-secondary)' }}>GPA: <strong>{vacancy.minGpa}</strong></span>
                <span style={{ color: 'var(--text-secondary)' }}>Commitment: <strong>{vacancy.weeklyHours}h/week</strong></span>
                <span style={{ color: 'var(--text-secondary)' }}>Format: <strong>{vacancy.mode}</strong></span>
              </div>
              {vacancy.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{vacancy.description}</p>}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'right', minWidth: '110px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Posted by</span>
                <span style={{ fontSize: '0.82rem' }}>{vacancy.author?.name || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {user?.id === vacancy.authorId && (
                  <>
                    <button onClick={() => startEdit(vacancy)} className="btn btn-secondary" style={{ padding: '0.4rem', width: '32px', height: '32px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => remove(vacancy.id)} className="btn btn-secondary" style={{ padding: '0.4rem', width: '32px', height: '32px', color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                {outgoingByVacancy.has(vacancy.id) ? (
                  <span className={`pill ${outgoingByVacancy.get(vacancy.id) === 'Invited' ? 'pill-success' : 'pill-neutral'}`}>
                    {outgoingByVacancy.get(vacancy.id) === 'Invited' ? 'Invited' : 'Applied'}
                  </span>
                ) : (
                  <button onClick={() => handleApply(vacancy.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="toast-container">
        {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      </div>
    </div>
  );
};

export const MatchScreen = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<MatchMode>((user?.matchingMode as MatchMode) || 'Hybrid');
  const [candidates, setCandidates] = useState<AppCandidate[]>([]);
  const [myOpenVacancies, setMyOpenVacancies] = useState<VacancyRecord[]>([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<AppCandidate | null>(null);
  const [inviteState, setInviteState] = useState<InviteState | null>(null);
  const [notification, setNotification] = useState<ToastState>(null);

  useEffect(() => {
    Api.getCandidates().then((data) => {
      if (data?.error) {
        setNotification({ message: data.error, type: 'error' });
        setCandidates([]);
        return;
      }

      setCandidates(Array.isArray(data) ? data : []);
    });

    Api.getVacancies().then((data) => {
      if (data?.error) {
        return;
      }

      const vacancies = Array.isArray(data) ? data : [];
      setMyOpenVacancies(vacancies.filter((vacancy: VacancyRecord) => vacancy.authorId === user?.id && vacancy.status === 'Open'));
    });
  }, [user?.id]);

  const openInviteModal = (candidate: AppCandidate) => {
    if (myOpenVacancies.length === 0) {
      setNotification({ message: 'Create an open vacancy first, then you can invite candidates.', type: 'error' });
      return;
    }

    setInviteState({ candidate, vacancyId: String(myOpenVacancies[0].id) });
  };

  const sendInvite = async () => {
    if (!inviteState) return;

    const data = await Api.inviteCandidate(Number(inviteState.vacancyId), inviteState.candidate.id);
    if (data?.error) {
      setNotification({ message: data.error, type: 'error' });
      return;
    }

    setInviteState(null);
    setSelectedUser(null);
    setNotification({ message: `Invitation sent to ${inviteState.candidate.name}`, type: 'success' });
  };

  const results = useMemo(() => {
    if (!user || candidates.length === 0) return [];

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills || '',
      goal: '',
      karma: user.karma,
      githubCommits: user.githubCommits || 0,
      eliteMinGpa: user.eliteMinGpa || 3.0,
      schedule: user.schedule || '',
      gpa: user.gpa || 0,
    } as UserProfile;
    const filtered = roleFilter === 'All' ? candidates : candidates.filter((candidate) => candidate.role === roleFilter);
    return MatchingEngine.rank(profile, filtered, mode);
  }, [candidates, mode, roleFilter, user]);

  return (
    <div className="screen-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Match Engine</h2>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={16} /> Compare candidates by performance, social fit, or a hybrid view.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['Hybrid', 'Performance', 'Social'] as MatchMode[]).map((strategy) => (
            <button key={strategy} onClick={() => setMode(strategy)} className={`btn ${mode === strategy ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              {strategy === 'Performance' && <Zap size={14} />}
              {strategy === 'Social' && <Users size={14} />}
              {strategy === 'Hybrid' && <Globe size={14} />}
              {strategy}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <Users size={16} /> Filter by role:
        </div>
        {['All', ...ROLES].map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`pill ${roleFilter === role ? 'pill-success' : 'pill-neutral'}`}
            style={{
              cursor: 'pointer',
              background: roleFilter === role ? 'var(--primary-glow)' : 'var(--bg-surface-hover)',
              color: roleFilter === role ? 'var(--primary)' : 'var(--text-secondary)',
              border: roleFilter === role ? '1px solid var(--primary)' : '1px solid var(--border)',
              padding: '0.45rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            {role}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {results.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No candidates found for this selection.</p>
          </div>
        )}
        {results.map((result, index) => (
          <div key={result.candidate.id} className="card" style={{ display: 'grid', gridTemplateColumns: '36px 1fr 120px 88px', gap: '0.9rem', alignItems: 'center', padding: '0.8rem 1rem' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: index < 3 ? 'var(--primary-glow)' : 'var(--bg-surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 800,
                color: index < 3 ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              {index + 1}
            </div>
            <div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{result.candidate.name}</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{result.candidate.role}</span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>{result.explanation}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span className={`pill ${result.risk.includes('High') || result.risk.includes('Critical') ? 'pill-danger' : 'pill-success'}`} style={{ fontSize: '0.64rem', padding: '0.1rem 0.4rem' }}>
                {result.risk}
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>{result.total}%</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedUser(result.candidate)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>
                Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onInvite={openInviteModal} />

      <Modal isOpen={Boolean(inviteState)} onClose={() => setInviteState(null)} title={`Invite ${inviteState?.candidate.name || 'candidate'} to project`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Select one of your open vacancies</label>
            <select
              value={inviteState?.vacancyId || ''}
              onChange={(event) => setInviteState((current) => (current ? { ...current, vacancyId: event.target.value } : current))}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {myOpenVacancies.map((vacancy) => (
                <option key={vacancy.id} value={vacancy.id}>
                  {vacancy.projectName} | {vacancy.neededRole}
                </option>
              ))}
            </select>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            The candidate will receive an invitation linked to the selected vacancy.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setInviteState(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={sendInvite}>
              Invite to Project
            </button>
          </div>
        </div>
      </Modal>

      <div className="toast-container">
        {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      </div>
    </div>
  );
};

const UserDetailModal = ({
  user,
  onClose,
  onInvite,
}: {
  user: AppCandidate | null;
  onClose: () => void;
  onInvite: (candidate: AppCandidate) => void;
}) => (
  <Modal isOpen={Boolean(user)} onClose={onClose} title="Candidate Profile">
    {user && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {user.name[0]}
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem' }}>{user.name}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{user.role} | GPA {user.gpa}</p>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Karma</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning)' }}>{user.karma} points</div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Projects Completed</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>{user.completedProjects ?? 0}</div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.65rem' }}>Skills</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {user.skills
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean)
              .map((skill) => (
                <span key={skill} className="pill pill-neutral">
                  {skill}
                </span>
              ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => onInvite(user)}>
            <Briefcase size={18} /> Invite to Project
          </button>
        </div>
      </div>
    )}
  </Modal>
);

export const ProjectsScreen = () => {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<ToastState>(null);

  const fetchProjects = () => {
    Api.getMyProjects().then((data) => {
      setProjects(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="screen-container animate-fade-in">
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>My Projects</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Teams you are leading or contributing to.</p>
      </div>

      {loading ? (
        <Loader className="animate-spin" />
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>You are not part of any active projects yet.</p>
        </div>
      ) : (
        projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onRefresh={fetchProjects}
            onNotify={(message, type) => setNotification({ message, type })}
          />
        ))
      )}

      <div className="toast-container">
        {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      </div>
    </div>
  );
};

export const AiScreen = () => {
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([
    {
      sender: 'assistant',
      text: 'Hi! I am powered by Gemini 2.5 Flash and can use your live candidate and vacancy data for recommendations, risk checks, and team decisions.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const data = await Api.chat(userMessage);
      setMessages((prev) => [...prev, { sender: 'assistant', text: data.answer || data.error || 'Error getting response.' }]);
    } catch {
      setMessages((prev) => [...prev, { sender: 'assistant', text: 'The assistant is temporarily unavailable. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-container animate-fade-in" style={{ height: 'calc(100vh - 8rem)' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>AI Assistant</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Recruitment analysis, fit checks, and risk summaries.</p>
      </div>

      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1.1rem' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.9rem', paddingRight: '0.4rem', marginBottom: '1rem' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                maxWidth: '85%',
                padding: '0.9rem 1.1rem',
                borderRadius: '1.1rem',
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                background: message.sender === 'user' ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-surface-hover)',
                border: message.sender === 'user' ? 'none' : '1px solid var(--border)',
                borderBottomRightRadius: message.sender === 'user' ? '4px' : '1.1rem',
                borderBottomLeftRadius: message.sender === 'assistant' ? '4px' : '1.1rem',
                color: message.sender === 'user' ? '#fff' : 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.55,
                fontSize: '0.9rem',
              }}
            >
              {message.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '0.7rem 0.85rem', background: 'var(--bg-surface-hover)', borderRadius: '1rem', display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
              <Loader size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-base)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && send()}
            placeholder="Ask about candidates, vacancies, or team risks..."
            style={{ flex: 1, background: 'transparent', border: 'none', boxShadow: 'none', padding: '0.5rem', fontSize: '0.9rem' }}
          />
          <button onClick={send} disabled={loading || !input.trim()} className="btn btn-primary" style={{ padding: '0 1rem', height: '40px' }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ChatScreen = () => {
  const { vacancyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [text, setText] = useState('');
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [notification, setNotification] = useState<ToastState>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!vacancyId) return;

    const id = Number(vacancyId);

    const fetchMessages = () => {
      Api.getProjectMessages(id).then((data) => {
        if (data?.error) {
          setNotification({ message: data.error, type: 'error' });
          return;
        }

        setMessages(Array.isArray(data) ? data : []);
      });
    };

    fetchMessages();
    Api.getMyProjects().then((projects) => {
      const list = Array.isArray(projects) ? projects : [];
      setProject(list.find((item: ProjectRecord) => item.id === id) || null);
    });

    const intervalId = window.setInterval(fetchMessages, 2500);
    return () => window.clearInterval(intervalId);
  }, [vacancyId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !vacancyId) return;

    const response = await Api.sendProjectMessage(Number(vacancyId), text.trim());
    if (response?.error) {
      setNotification({ message: response.error, type: 'error' });
      return;
    }

    setMessages((prev) => [...prev, response]);
    setText('');
  };

  return (
    <div className="screen-container animate-fade-in">
      <div className="chat-page-container">
        <div className="chat-header">
          <div>
            <h2 style={{ fontSize: '1.2rem' }}>{project?.projectName || 'Project Chat'}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Team communication for active project members.</p>
          </div>
          <button onClick={() => navigate('/projects')} className="btn btn-secondary">
            <X size={18} /> Exit Chat
          </button>
        </div>
        <div className="chat-messages-area">
          {messages.map((message) => (
            <div key={message.id} className={`chat-bubble ${message.senderId === user?.id ? 'mine' : 'theirs'}`}>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.2rem', fontWeight: 600 }}>{message.sender.name}</div>
              {message.text}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
        <div className="chat-input-area">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && send()}
            placeholder="Type a message to the team..."
            style={{ borderRadius: 'var(--radius-md)' }}
          />
          <button onClick={send} className="btn btn-primary" style={{ padding: '0 1.5rem' }}>
            <Send size={20} />
          </button>
        </div>
      </div>

      <div className="toast-container">
        {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      </div>
    </div>
  );
};

const ProjectCard = ({
  project,
  onRefresh,
  onNotify,
}: {
  project: ProjectRecord;
  onRefresh: () => void;
  onNotify?: (message: string, type: ToastType) => void;
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthor = user?.id === project.authorId;
  const [ratingTarget, setRatingTarget] = useState<ProjectMember | null>(null);
  const [ratingForm, setRatingForm] = useState({ rating: 5, teamwork: 5, reliability: 5, comment: '' });

  const handleFinish = async () => {
    if (!window.confirm('Finish this project and increment completed projects for the team?')) return;

    const data = await Api.finishProject(project.id);
    if (data?.error) {
      onNotify?.(data.error, 'error');
      return;
    }

    onNotify?.('Project completed successfully', 'success');
    onRefresh();
  };

  const handleRate = async () => {
    if (!ratingTarget) return;

    const data = await Api.submitReview({ ...ratingForm, candidateId: ratingTarget.id });
    if (data?.error) {
      onNotify?.(data.error, 'error');
      return;
    }

    setRatingTarget(null);
    setRatingForm({ rating: 5, teamwork: 5, reliability: 5, comment: '' });
    onNotify?.('Review submitted', 'success');
  };

  const members: ProjectMember[] = [
    { ...project.author, isAuthor: true },
    ...(project.applications || [])
      .filter((application) => application.status === 'Accepted')
      .map((application) => ({ ...application.candidate, isAuthor: false })),
  ];

  return (
    <div className="card" style={{ padding: '1.1rem 1.2rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{project.projectName}</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{project.title} | {project.neededRole}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(`/chat/${project.id}`)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
            <MessageSquare size={16} /> Open Group Chat
          </button>
          <span className={`pill ${project.status === 'Completed' ? 'pill-neutral' : 'pill-success'}`}>{project.status}</span>
          {isAuthor && project.status !== 'Completed' && (
            <button onClick={handleFinish} className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}>
              <CheckCircle size={16} /> Finish Project
            </button>
          )}
        </div>
      </div>

      <div>
        <h5 style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.8rem', letterSpacing: '0.04em' }}>
          Project Members ({members.length})
        </h5>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
          {members.map((member) => (
            <div key={member.id} className="glass-card" style={{ padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {member.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {member.name} {member.id === user?.id ? '(You)' : ''}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{member.isAuthor ? 'Project Lead' : member.role}</div>
                </div>
              </div>
              {project.status === 'Completed' && member.id !== user?.id && (
                <button onClick={() => setRatingTarget(member)} className="btn btn-secondary" style={{ padding: '0.4rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={Boolean(ratingTarget)} onClose={() => setRatingTarget(null)} title={`Rate ${ratingTarget?.name || 'teammate'}`}>
        <div className="rating-modal">
          <div className="rating-row">
            <div>
              <label className="form-label">Overall Contribution</label>
              <p className="rating-help">How much real value this teammate added to delivery.</p>
            </div>
            <div className="rating-control">
              <input className="rating-slider" type="range" min="1" max="10" value={ratingForm.rating} onChange={(event) => setRatingForm({ ...ratingForm, rating: Number(event.target.value) })} />
              <div className="rating-value">{ratingForm.rating}</div>
            </div>
          </div>
          <div className="rating-row">
            <div>
              <label className="form-label">Teamwork & Communication</label>
              <p className="rating-help">How clearly they communicated and collaborated in the team.</p>
            </div>
            <div className="rating-control">
              <input className="rating-slider" type="range" min="1" max="10" value={ratingForm.teamwork} onChange={(event) => setRatingForm({ ...ratingForm, teamwork: Number(event.target.value) })} />
              <div className="rating-value">{ratingForm.teamwork}</div>
            </div>
          </div>
          <div className="rating-row">
            <div>
              <label className="form-label">Reliability & Commitment</label>
              <p className="rating-help">Whether they were dependable, responsive, and completed their part.</p>
            </div>
            <div className="rating-control">
              <input className="rating-slider" type="range" min="1" max="10" value={ratingForm.reliability} onChange={(event) => setRatingForm({ ...ratingForm, reliability: Number(event.target.value) })} />
              <div className="rating-value">{ratingForm.reliability}</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Review Comment</label>
            <textarea value={ratingForm.comment} onChange={(event) => setRatingForm({ ...ratingForm, comment: event.target.value })} rows={3} placeholder="What was it like working with them?" />
          </div>
          <button onClick={handleRate} className="btn btn-primary" style={{ width: '100%' }}>
            Submit Review
          </button>
        </div>
      </Modal>
    </div>
  );
};
