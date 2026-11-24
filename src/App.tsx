import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './AuthContext';
import { Users, Briefcase, MessageSquare, UserCircle, Target, Activity, Bell, LogOut } from 'lucide-react';
import { Api } from './api';
import { DashboardScreen, ProfileScreen, VacanciesScreen, MatchScreen, AiScreen, ProjectsScreen, ChatScreen } from './screens';
import { LoginPage, RegisterPage } from './auth-pages';

type IncomingNotification = {
  id: number;
  status: string;
  candidate: { name: string };
  vacancy: { projectName: string };
};

const Sidebar = ({ unreadCount, onOpenNotifications }: { unreadCount: number; onOpenNotifications: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const openNotifications = () => {
    onOpenNotifications();
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ 
          fontSize: '1.75rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          background: 'linear-gradient(to right, var(--primary), var(--secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-heading)'
        }}>
          <Activity size={32} style={{ color: 'var(--primary)', strokeWidth: 2.5 }} /> TeamMatch
        </h1>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Target size={20} /> Dashboard
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <UserCircle size={20} /> Profile
        </NavLink>
        <NavLink to="/vacancies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Briefcase size={20} /> Vacancies
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Activity size={20} /> Projects
        </NavLink>
        <NavLink to="/match" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} /> Match Engine
        </NavLink>
        <NavLink to="/ai" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} /> AI Assistant
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={openNotifications}
          className="notification-button"
          aria-label={unreadCount ? `${unreadCount} new applications` : 'No new applications'}
          title="Application notifications"
        >
          <Bell size={18} />
          <span>Applications</span>
          {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.name}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{user?.role}</p>
        </div>
        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
};

const AuthGate = () => {
  const [isLogin, setIsLogin] = useState(true);
  if (isLogin) return <LoginPage onSwitch={() => setIsLogin(false)} />;
  return <RegisterPage onSwitch={() => setIsLogin(true)} />;
};

const AppLayout = () => {
  const { token } = useAuth();
  const [newApplications, setNewApplications] = useState<IncomingNotification[]>([]);
  const knownApplicationIds = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (!token) {
      knownApplicationIds.current = null;
      setNewApplications([]);
      return;
    }

    let isMounted = true;
    const checkApplications = async () => {
      const data = await Api.getApplications();
      const incoming = Array.isArray(data?.incoming) ? data.incoming as IncomingNotification[] : [];
      const pending = incoming.filter((application) => application.status === 'Pending');

      if (!isMounted) return;

      if (knownApplicationIds.current === null) {
        knownApplicationIds.current = new Set(pending.map((application) => application.id));
        return;
      }

      const unseen = pending.filter((application) => !knownApplicationIds.current?.has(application.id));
      knownApplicationIds.current = new Set(pending.map((application) => application.id));

      if (unseen.length > 0) {
        setNewApplications((current) => [...unseen, ...current.filter((application) => !unseen.some((item) => item.id === application.id))]);
      }
    };

    checkApplications();
    const intervalId = window.setInterval(checkApplications, 15000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [token]);

  if (!token) return <AuthGate />;

  const latestApplication = newApplications[0];
  const openNotifications = () => setNewApplications([]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar unreadCount={newApplications.length} onOpenNotifications={openNotifications} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/vacancies" element={<VacanciesScreen />} />
            <Route path="/projects" element={<ProjectsScreen />} />
            <Route path="/chat/:vacancyId" element={<ChatScreen />} />
            <Route path="/match" element={<MatchScreen />} />
            <Route path="/ai" element={<AiScreen />} />
          </Routes>
        </main>
        {latestApplication && (
          <button className="application-toast" onClick={openNotifications}>
            <Bell size={18} />
            <span>
              <strong>New application</strong>
              <small>{latestApplication.candidate.name} applied for {latestApplication.vacancy.projectName}</small>
            </span>
          </button>
        )}
      </div>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}

export default App;
