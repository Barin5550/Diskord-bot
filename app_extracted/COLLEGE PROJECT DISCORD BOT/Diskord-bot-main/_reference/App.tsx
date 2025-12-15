import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { CommandHelper } from './components/CommandHelper';
import { Stats } from './components/Stats';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { DiscordUser } from './types';
import { DiscordService } from './services/discordService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session
  useEffect(() => {
    const user = DiscordService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const handleLogin = async () => {
    try {
      const user = await DiscordService.login();
      setCurrentUser(user);
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const handleLogout = () => {
    DiscordService.logout();
    setCurrentUser(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Nexus...</div>;
  }

  // If logged in, show Dashboard instead of Landing Page
  if (currentUser) {
    return <Dashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Header onLogin={handleLogin} />
      <main className="flex-grow">
        <Hero />
        <Features />
        <CommandHelper />
        <Stats />
      </main>
      <Footer />
    </div>
  );
};

export default App;