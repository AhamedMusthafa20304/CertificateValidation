import React, { useState } from 'react';
import { Box, Menu, X, ChevronRight, LogOut } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { VerifierComponent } from './components/VerifierComponent';
import { StudentDashboard } from './components/StudentDashboard';
import { AuthPage } from './components/AuthPage';
import { LandingPage, FeaturesPage, HowItWorksPage, AboutPage, ContactPage } from './components/MarketingPages';
import { UserRole, UserProfile } from './types';

type PageView = 'home' | 'features' | 'how-it-works' | 'about' | 'contact' | 'dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [activeRole, setActiveRole] = useState<UserRole>('ADMIN');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigateTo = (page: any, role?: string) => {
    setCurrentPage(page);
    if (role) setActiveRole(role as UserRole);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigateTo('home');
  };

  const renderDashboard = () => {
    if (!currentUser) return <AuthPage onLogin={setCurrentUser} />;
    if (currentUser.role === 'ADMIN') return <AdminDashboard user={currentUser} />;
    if (currentUser.role === 'VERIFIER') return <VerifierComponent user={currentUser} />;
    if (currentUser.role === 'STUDENT') return <StudentDashboard user={currentUser} />;
    return null;
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home': return <LandingPage onNavigate={navigateTo} />;
      case 'features': return <FeaturesPage />;
      case 'how-it-works': return <HowItWorksPage />;
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage />;
      case 'dashboard': return renderDashboard();
      default: return <LandingPage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{background:'linear-gradient(135deg,#00c9a7 0%,#00b09b 30%,#1dd3a0 65%,#43e97b 100%)',fontFamily:"'Poppins','Segoe UI',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');`}</style>

      <header style={{background:'rgba(0,0,0,0.18)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.2)'}} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="p-2 rounded-xl" style={{background:'rgba(255,255,255,0.25)'}}>
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">Certificate Chain</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {[['home','Home'],['features','Features'],['how-it-works','How It Works'],['about','About']].map(([p,label]) => (
              <button key={p} onClick={() => navigateTo(p)} className={`transition-colors ${currentPage===p?'text-white':'text-white/70 hover:text-white'}`}>{label}</button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white hidden md:block">Hi, {currentUser.name}</span>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{background:'linear-gradient(135deg,#ff6b9d,#c44569)'}}>
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <button onClick={() => navigateTo('dashboard','ADMIN')} className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white" style={{background:'linear-gradient(135deg,#ff6b9d,#ff8c42)'}}>
                Launch App <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button className="md:hidden p-2 text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-1" style={{background:'rgba(0,0,0,0.2)'}}>
            {[['home','Home'],['features','Features'],['how-it-works','How It Works'],['about','About']].map(([p,label]) => (
              <button key={p} onClick={() => navigateTo(p)} className="block w-full text-left text-white font-semibold py-2 px-3 rounded-lg hover:bg-white/10">{label}</button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">{renderContent()}</main>

      <footer className="text-center py-5" style={{background:'rgba(0,0,0,0.15)',borderTop:'1px solid rgba(255,255,255,0.15)'}}>
        <p className="text-white/70 text-sm font-medium">© 2025 Certificate Chain | Admin Access</p>
      </footer>
    </div>
  );
}

export default App;
