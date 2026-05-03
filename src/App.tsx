import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useAuth, AuthProvider } from './AuthContext';
import { Users, Briefcase, MessageSquare, UserCircle, Target, Activity, LogOut } from 'lucide-react';
import { DashboardScreen, ProfileScreen, VacanciesScreen, MatchScreen, AiScreen, ProjectsScreen, ChatScreen } from './screens';
import { LoginPage, RegisterPage } from './auth-pages';

const Sidebar = () => {
  const { user, logout } = useAuth();
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
  if (!token) return <AuthGate />;
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
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
