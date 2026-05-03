import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Activity, Mail, Lock, User, Briefcase, GraduationCap, Code } from 'lucide-react';
import { ROLES } from './models';

export const LoginPage = ({ onSwitch }: { onSwitch: () => void }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="auth-page">
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '16px', 
            background: 'var(--primary-glow)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' 
          }}>
            <Activity size={36} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TeamMatch</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={14} /> Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-primary w-full" style={{ height: '52px', marginTop: '1rem' }} disabled={loading}>
            {loading ? <LoaderIcon /> : 'Sign In to Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <button onClick={onSwitch} style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Register now</button>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage = ({ onSwitch }: { onSwitch: () => void }) => {
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'Developer',
    gpa: '3.5', skills: 'JavaScript, React',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const err = await register(form);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="auth-page">
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '3rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Create Profile</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Join KBTU's intelligent team formation network</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={14} /> Full Name</label>
              <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Alex Smith" required />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> Email</label>
              <input type="email" name="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@kbtu.kz" required />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={14} /> Password</label>
              <input type="password" name="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={14} /> Preferred Role</label>
              <select 
                value={form.role} 
                onChange={e => setForm({...form, role: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><GraduationCap size={14} /> Current GPA</label>
              <input type="number" step="0.1" name="gpa" value={form.gpa} onChange={e => setForm({...form, gpa: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Code size={14} /> Top Skills</label>
              <input name="skills" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="React, Python..." />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="btn btn-primary w-full" style={{ height: '52px', marginTop: '1rem' }} disabled={loading}>
            {loading ? <LoaderIcon /> : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already registered? <button onClick={onSwitch} style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Sign in here</button>
        </div>
      </div>
    </div>
  );
};

const LoaderIcon = () => (
  <svg style={{ animation: 'spin 1s linear infinite', width: '24px', height: '24px' }} viewBox="0 0 24 24">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);
