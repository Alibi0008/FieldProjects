import { useState, useEffect, useRef, useMemo } from 'react';
import { Api } from './api';
import { useAuth } from './AuthContext';
import { MatchingEngine } from './engines';
import type { MatchMode } from './models';
import { ROLES } from './models';
import { Send, Loader, Users, Target, Briefcase, UserCircle, Activity, Star, CheckCircle, Edit2, X, Trash2, Mail, Info, MessageSquare, Shield, Zap, Globe } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

// ─── UI Components ────────────────────────────────────────────────────────────

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// GroupChatModal is no longer used, we now use ChatScreen

const Toast = ({ message, type = 'success', onClose }: any) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
      <span>{message}</span>
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const DashboardScreen = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [candidateCount, setCandidateCount] = useState(0);
  const [vacancyCount, setVacancyCount] = useState(0);
  const [incomingApps, setIncomingApps] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    Api.getCandidates().then(d => setCandidateCount(Array.isArray(d) ? d.length : 0)).catch(() => {});
    Api.getVacancies().then(d => setVacancyCount(Array.isArray(d) ? d.length : 0)).catch(() => {});
    Api.getApplications().then(d => d && d.incoming && setIncomingApps(d.incoming)).catch(() => {});
    Api.getMyProjects().then(d => Array.isArray(d) && setMyProjects(d)).catch(() => {});
  }, []);

  const handleStatus = async (id: number, status: string) => {
    try {
      await Api.updateApplicationStatus(id, status);
      setNotification({ message: `Application ${status.toLowerCase()}`, type: 'success' });
      Api.getApplications().then(d => d && d.incoming && setIncomingApps(d.incoming));
    } catch (err) {
      setNotification({ message: 'Error updating status', type: 'error' });
    }
  };

  return (
    <div className="screen-container animate-fade-in">
      <div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Friend'} 👋
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Here's what's happening with your team formation today.</p>
      </div>
      
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="card stat-card">
          <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Vacancies</span>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{vacancyCount}</div>
        </div>
        <div className="card stat-card">
          <span style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Candidates</span>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{candidateCount}</div>
        </div>
        <div className="card stat-card">
          <span style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Karma</span>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{user?.karma ?? 80}</div>
        </div>
        <div className="card stat-card">
          <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Finished</span>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{user?.completedProjects ?? 0}</div>
        </div>
      </div>

      {incomingApps.length > 0 && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={24} style={{ color: 'var(--primary)' }} /> Incoming Applications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {incomingApps.map((app: any) => (
              <div key={app.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem' }}>{app.candidate.name} applied for <span style={{ color: 'var(--primary)' }}>{app.vacancy.projectName}</span></h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Role: {app.candidate.role} · GPA: {app.candidate.gpa} · Karma: {app.candidate.karma}</p>
                </div>
                {app.status === 'Pending' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleStatus(app.id, 'Accepted')} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Accept</button>
                    <button onClick={() => handleStatus(app.id, 'Rejected')} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Reject</button>
                  </div>
                ) : (
                  <span className={`pill ${app.status === 'Accepted' ? 'pill-success' : 'pill-danger'}`}>{app.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {myProjects.length > 0 && (
        <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Briefcase size={24} style={{ color: 'var(--secondary)' }} /> Your Teams & Projects
          </h3>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', gap: '1.5rem' }}>
            {myProjects.map((project: any) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onRefresh={() => {
                  Api.getMyProjects().then(d => Array.isArray(d) && setMyProjects(d));
                  Api.getCandidates().then(d => setCandidateCount(Array.isArray(d) ? d.length : 0));
                }}
                onNotify={(msg: string, type: string) => setNotification({ message: msg, type })}
              />
            ))}
          </div>
        </div>
      )}

      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Quick Match Analysis</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Based on your GPA ({user?.gpa}) and skills, you are a 92% match for 3 active projects.</p>
        </div>
        <button onClick={() => navigate('/match')} className="btn btn-primary">Start Matching</button>
      </div>

      <div className="toast-container">
        {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      </div>
    </div>
  );
};

// ─── Profile ─────────────────────────────────────────────────────────────────
export const ProfileScreen = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '', role: 'Developer',
    gpa: '3.0', skills: '',
    eliteMinGpa: '3.5',
    matchingMode: 'Hybrid'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        role: user.role || 'Developer',
        gpa: user.gpa?.toString() || '3.0',
        skills: user.skills || '',
        eliteMinGpa: user.eliteMinGpa?.toString() || '3.5',
        matchingMode: user.matchingMode || 'Hybrid'
      });
    }
  }, [user]);

  const [notification, setNotification] = useState<any>(null);

  const save = async () => {
    try {
      const updated = await Api.updateProfile(form);
      if (updated && !updated.error) {
        refreshUser(updated);
        setNotification({ message: 'Profile updated successfully!', type: 'success' });
      } else {
        setNotification({ message: updated?.error || 'Failed to update profile', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Connection error. Please try again.', type: 'error' });
    }
  };

  return (
    <div className="screen-container animate-fade-in">
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Your Profile</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your professional identity and team preferences. You have finished <strong>{user?.completedProjects || 0} projects</strong>.</p>
      </div>
      
      <div className="card form-container-small" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group"><label className="form-label">Full Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="form-group">
            <label className="form-label">Professional Role</label>
            <select 
              value={form.role} 
              onChange={e => setForm({...form, role: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Current GPA</label><input type="number" step="0.1" min="0" max="4" value={form.gpa} onChange={e => setForm({...form, gpa: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Elite Min GPA Target</label><input type="number" step="0.1" min="0" max="4" value={form.eliteMinGpa} onChange={e => setForm({...form, eliteMinGpa: e.target.value})} /></div>
          <div className="form-group">
            <label className="form-label">Default Matching Strategy</label>
            <select 
              value={form.matchingMode} 
              onChange={e => setForm({...form, matchingMode: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="Hybrid">Hybrid (Balanced)</option>
              <option value="Performance">Performance (GPA + Skills)</option>
              <option value="Social">Social (Karma + Engagement)</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Skills & Tech Stack (comma separated)</label><textarea rows={3} value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} /></div>
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

// ─── Vacancies ────────────────────────────────────────────────────────────────
export const VacanciesScreen = () => {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [notification, setNotification] = useState<any>(null);
  const [form, setForm] = useState({ 
    projectName: '', title: 'Teammate Needed', neededRole: 'Developer', 
    minGpa: '3.0', weeklyHours: '4', responseHours: '24', 
    mode: 'Hybrid', description: 'Looking for a motivated teammate.' 
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [appliedIds, setAppliedIds] = useState<number[]>([]);

  useEffect(() => { 
    Api.getVacancies().then(d => Array.isArray(d) && setVacancies(d)); 
    Api.getApplications().then(data => {
      if (data.outgoing) {
        setAppliedIds(data.outgoing.map((a: any) => a.vacancyId));
      }
    });
  }, []);

  const add = async () => {
    await Api.createVacancy(form);
    setNotification({ message: 'Vacancy posted successfully!', type: 'success' });
    Api.getVacancies().then(d => Array.isArray(d) && setVacancies(d));
    setForm({ ...form, projectName: '', neededRole: 'Developer' });
  };

  const update = async (id: number) => {
    await Api.updateVacancy(id, form);
    setNotification({ message: 'Vacancy updated!', type: 'success' });
    setEditingId(null);
    Api.getVacancies().then(d => Array.isArray(d) && setVacancies(d));
    setForm({ ...form, projectName: '', neededRole: 'Developer' });
  };

  const startEdit = (v: any) => {
    setEditingId(v.id);
    setForm({
      projectName: v.projectName,
      title: v.title,
      neededRole: v.neededRole,
      minGpa: v.minGpa.toString(),
      weeklyHours: v.weeklyHours.toString(),
      responseHours: v.responseHours.toString(),
      mode: v.mode,
      description: v.description
    });
  };

  const remove = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vacancy?')) {
      await Api.deleteVacancy(id);
      setNotification({ message: 'Vacancy deleted', type: 'success' });
      Api.getVacancies().then(d => Array.isArray(d) && setVacancies(d));
    }
  };

  const handleApply = async (id: number) => {
    await Api.apply(id);
    setAppliedIds([...appliedIds, id]);
  };

  return (
    <div className="screen-container animate-fade-in">
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Vacancies</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Find projects to join or recruit talent for your own.</p>
      </div>

      <div className="card form-container-small" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem' }}>{editingId ? 'Edit Vacancy' : 'Post New Vacancy'}</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group"><label className="form-label">Project Name</label><input value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} placeholder="e.g. AI Matcher" /></div>
          <div className="form-group">
            <label className="form-label">Role Needed</label>
            <select 
              value={form.neededRole} 
              onChange={e => setForm({...form, neededRole: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Min GPA</label><input type="number" step="0.1" value={form.minGpa} onChange={e => setForm({...form, minGpa: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Weekly Hours</label><input type="number" value={form.weeklyHours} onChange={e => setForm({...form, weeklyHours: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Response Time (h)</label><input type="number" value={form.responseHours} onChange={e => setForm({...form, responseHours: e.target.value})} /></div>
          <div className="form-group">
            <label className="form-label">Work Format</label>
            <select value={form.mode} onChange={e => setForm({...form, mode: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              <option value="Hybrid">🏠 Hybrid</option>
              <option value="Remote">🌐 Remote</option>
              <option value="On-site">🏢 On-site</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', gridColumn: 'span 2' }}>
            {editingId ? (
              <>
                <button onClick={() => update(editingId)} className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button onClick={() => { setEditingId(null); setForm({ ...form, projectName: '', neededRole: 'Developer' }); }} className="btn btn-secondary"><X size={16} /></button>
              </>
            ) : (
              <button onClick={add} className="btn btn-primary" style={{ width: '100%' }}>Post Vacancy</button>
            )}
          </div>
        </div>
      </div>

    <div className="grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem' }}>
        {vacancies.length === 0 && <p style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No vacancies yet. Post the first one!</p>}
        {vacancies.map((v: any) => (
          <div key={v.id} className="card stat-card" style={{ borderLeft: '4px solid var(--primary)', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{v.projectName}</h3>
                <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>{v.status}</span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Role: <strong>{v.neededRole}</strong></span>
                <span style={{ color: 'var(--text-secondary)' }}>GPA: <strong>{v.minGpa}</strong></span>
                <span style={{ color: 'var(--text-secondary)' }}>Commitment: <strong>{v.weeklyHours}h/week</strong></span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Posted by</span>
                <span style={{ fontSize: '0.85rem' }}>{v.author?.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {user?.id === v.authorId && (
                  <>
                    <button onClick={() => startEdit(v)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => remove(v.id)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                {appliedIds.includes(v.id) ? (
                  <span className="pill pill-neutral">Applied</span>
                ) : (
                  <button onClick={() => handleApply(v.id)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Apply Now</button>
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

// ─── Match Engine ─────────────────────────────────────────────────────────────
export const MatchScreen = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<MatchMode>((user?.matchingMode as MatchMode) || 'Hybrid');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [results, setResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => { Api.getCandidates().then(d => Array.isArray(d) && setCandidates(d)); }, []);

  useEffect(() => {
    if (!user || !candidates.length) return;
    const profile = { 
      skills: user.skills || '', 
      eliteMinGpa: user.eliteMinGpa || 3.0, 
      schedule: user.schedule || '', 
      gpa: user.gpa || 0 
    };
    const filtered = roleFilter === 'All' ? candidates : candidates.filter((c: any) => c.role === roleFilter);
    setResults(MatchingEngine.rank(profile as any, filtered, mode));
  }, [mode, roleFilter, candidates, user]);

  const filterRoles = ['All', ...ROLES];

  return (
    <div className="screen-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Match Engine</h2>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={16} /> Here you can find the best candidates for your project and contact them directly.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['Hybrid', 'Performance', 'Social'] as MatchMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`btn ${mode === m ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              {m === 'Performance' && <Zap size={14} />}
              {m === 'Social' && <Users size={14} />}
              {m === 'Hybrid' && <Globe size={14} />}
              {m} Strategy
            </button>
          ))}
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginRight: '0.5rem' }}>
          <Users size={16} /> Filter by role:
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {filterRoles.map(r => (
            <button 
              key={r} 
              onClick={() => setRoleFilter(r)} 
              className={`pill ${roleFilter === r ? 'pill-success' : 'pill-neutral'}`} 
              style={{ 
                cursor: 'pointer', 
                background: roleFilter === r ? 'var(--primary-glow)' : 'var(--bg-surface-hover)',
                color: roleFilter === r ? 'var(--primary)' : 'var(--text-secondary)',
                border: roleFilter === r ? '1px solid var(--primary)' : '1px solid var(--border)',
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'var(--transition)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {results.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '4rem' }}><p style={{ color: 'var(--text-secondary)' }}>No candidates found for this selection.</p></div>}
        {results.map((r: any, i: number) => (
          <div key={r.candidate.id} className="card" style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: i < 3 ? 'var(--primary-glow)' : 'var(--bg-surface-hover)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 800, color: i < 3 ? 'var(--primary)' : 'var(--text-secondary)'
            }}>
              {i + 1}
            </div>
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{r.candidate.name}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{r.candidate.role}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>{r.explanation}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span className={`pill ${r.risk.includes('High') || r.risk.includes('Critical') ? 'pill-danger' : 'pill-success'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{r.risk}</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{r.total}%</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedUser(r.candidate)}
                className="btn btn-secondary" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
              >
                Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
};

const UserDetailModal = ({ user, onClose }: any) => {
  return (
    <Modal isOpen={!!user} onClose={onClose} title="Candidate Profile">
      {user && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
              {user.name[0]}
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem' }}>{user.name}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{user.role} · GPA {user.gpa}</p>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Karma Status</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)' }}>{user.karma} Points</div>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Projects Completed</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{user.completedProjects} Finished</div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Skills & Expertise</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {user?.skills?.split(',').filter(Boolean).map((s: string) => (
                <span key={s} className="pill pill-neutral">{s.trim()}</span>
              )) || <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills listed</span>}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => { alert(`Contacting ${user.name} via ${user.email || 'university email'}...`); onClose(); }}>
              <Mail size={18} /> Contact for Interview
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export const ProjectsScreen = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<any>(null);

  const fetch = () => {
    Api.getMyProjects().then(d => {
      setProjects(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="screen-container animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>My Projects</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Teams you are leading or part of</p>
      </div>

      {loading ? <Loader className="animate-spin" /> : (
        projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>You are not part of any active projects yet.</p>
          </div>
        ) : (
          projects.map(p => <ProjectCard key={p.id} project={p} onRefresh={fetch} onNotify={(msg: string, type: string) => setNotification({ message: msg, type })} />)
        )
      )}

      <div className="toast-container">
        {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      </div>
    </div>
  );
};

// ─── AI Assistant ─────────────────────────────────────────────────────────────
export const AiScreen = () => {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: 'assistant', text: 'Hi! I\'m powered by Gemini 1.5 Flash and have access to your real candidate database. How can I help you build your perfect team today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);
    const data = await Api.chat(userMsg);
    setLoading(false);
    setMessages(prev => [...prev, { sender: 'assistant', text: data.answer || data.error || 'Error getting response.' }]);
  };

  return (
    <div className="screen-container animate-fade-in" style={{ height: 'calc(100vh - 8rem)' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>AI Assistant</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Intelligent recruitment & risk analysis</p>
      </div>
      
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1.25rem' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1.25rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              maxWidth: '85%', 
              padding: '1rem 1.25rem', 
              borderRadius: '1.25rem',
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              background: m.sender === 'user' ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-surface-hover)',
              border: m.sender === 'user' ? 'none' : '1px solid var(--border)',
              borderBottomRightRadius: m.sender === 'user' ? '4px' : '1.25rem',
              borderBottomLeftRadius: m.sender === 'assistant' ? '4px' : '1.25rem',
              color: m.sender === 'user' ? '#fff' : 'var(--text-primary)',
              whiteSpace: 'pre-wrap', 
              lineHeight: 1.6,
              fontSize: '0.9rem'
            }}>
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '0.75rem', background: 'var(--bg-surface-hover)', borderRadius: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Loader size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-base)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about candidates or risks..."
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

// ─── Team Chat Screen ──────────────────────────────────────────────────────────
export const ChatScreen = () => {
  const { vacancyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [project, setProject] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (vacancyId) {
      Api.getProjectMessages(parseInt(vacancyId)).then(setMessages);
      Api.getMyProjects().then(projects => {
        const p = projects.find((p: any) => p.id === parseInt(vacancyId));
        setProject(p);
      });
      const interval = setInterval(() => {
        Api.getProjectMessages(parseInt(vacancyId)).then(setMessages);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [vacancyId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !vacancyId) return;
    const msg = await Api.sendProjectMessage(parseInt(vacancyId), text);
    setMessages([...messages, msg]);
    setText('');
  };

  return (
    <div className="screen-container animate-fade-in">
      <div className="chat-page-container">
        <div className="chat-header">
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>{project?.projectName || 'Project Chat'}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Team Communication</p>
          </div>
          <button onClick={() => navigate('/projects')} className="btn btn-secondary">
            <X size={18} /> Exit Chat
          </button>
        </div>
        <div className="chat-messages-area">
          {messages.map((m: any) => (
            <div key={m.id} className={`chat-bubble ${m.senderId === user?.id ? 'mine' : 'theirs'}`}>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.2rem', fontWeight: 600 }}>{m.sender.name}</div>
              {m.text}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
        <div className="chat-input-area">
          <input 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a message to the team..."
            style={{ borderRadius: 'var(--radius-md)' }}
          />
          <button onClick={send} className="btn btn-primary" style={{ padding: '0 1.5rem' }}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Project Card Component ──────────────────────────────────────────────────
const ProjectCard = ({ project, onRefresh, onNotify }: { project: any; onRefresh: () => void, onNotify?: (msg: string, type: string) => void }) => {
  const { user } = useAuth();
  const isAuthor = user?.id === project.authorId;
  const [chatOpen, setChatOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<any>(null);
  const [ratingForm, setRatingForm] = useState({ rating: 5, teamwork: 5, reliability: 5, comment: '' });

  const handleFinish = async () => {
    if (window.confirm('Are you sure you want to finish this project? All members will receive +1 to completed projects.')) {
      await Api.finishProject(project.id);
      onNotify?.('Project completed successfully!', 'success');
      onRefresh();
    }
  };

  const handleRate = async () => {
    await Api.submitReview({ ...ratingForm, candidateId: ratingTarget.id });
    setRatingTarget(null);
    setRatingForm({ rating: 5, teamwork: 5, reliability: 5, comment: '' });
    onNotify?.('Rating submitted successfully!', 'success');
  };

  const members = [
    { ...project.author, isAuthor: true },
    ...(project.applications || []).filter((a: any) => a.status === 'Accepted').map((a: any) => ({ ...a.candidate, isAuthor: false }))
  ];

  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h4 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{project.projectName}</h4>
          <p style={{ color: 'var(--text-secondary)' }}>{project.title} · {project.neededRole}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={() => navigate(`/chat/${project.id}`)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
            <MessageSquare size={16} /> Open Group Chat
          </button>
          <span className={`pill ${project.status === 'Completed' ? 'pill-neutral' : 'pill-success'}`}>{project.status}</span>
          {isAuthor && project.status !== 'Completed' && (
            <button onClick={handleFinish} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <CheckCircle size={16} /> Finish Project
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h5 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Project Members ({members.length})</h5>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {members.map((m: any) => (
            <div key={m.id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {m.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name} {m.id === user?.id && '(You)'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.isAuthor ? 'Project Lead' : m.role}</div>
                </div>
              </div>
              {project.status === 'Completed' && m.id !== user?.id && (
                <button onClick={() => setRatingTarget(m)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <GroupChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} vacancyId={project.id} projectName={project.projectName} />

      <Modal isOpen={!!ratingTarget} onClose={() => setRatingTarget(null)} title={`Rate ${ratingTarget?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Overall Contribution (1-10)</label>
            <input type="range" min="1" max="10" value={ratingForm.rating} onChange={e => setRatingForm({...ratingForm, rating: parseInt(e.target.value)})} />
            <div style={{ textAlign: 'center', fontWeight: 700 }}>{ratingForm.rating}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Teamwork & Communication (1-10)</label>
            <input type="range" min="1" max="10" value={ratingForm.teamwork} onChange={e => setRatingForm({...ratingForm, teamwork: parseInt(e.target.value)})} />
            <div style={{ textAlign: 'center', fontWeight: 700 }}>{ratingForm.teamwork}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Reliability & Commitment (1-10)</label>
            <input type="range" min="1" max="10" value={ratingForm.reliability} onChange={e => setRatingForm({...ratingForm, reliability: parseInt(e.target.value)})} />
            <div style={{ textAlign: 'center', fontWeight: 700 }}>{ratingForm.reliability}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Review Comment</label>
            <textarea value={ratingForm.comment} onChange={e => setRatingForm({...ratingForm, comment: e.target.value})} placeholder="What was it like working with them?" rows={3} />
          </div>
          <button onClick={handleRate} className="btn btn-primary" style={{ width: '100%' }}>Submit Review</button>
        </div>
      </Modal>
    </div>
  );
};

