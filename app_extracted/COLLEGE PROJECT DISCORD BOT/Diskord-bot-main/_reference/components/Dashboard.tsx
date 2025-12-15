import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  Save, 
  Server as ServerIcon, 
  Activity,
  Menu,
  X
} from 'lucide-react';
import { BotConfig, DiscordUser, Guild, LogEntry } from '../types';
import { DiscordService } from '../services/discordService';

interface DashboardProps {
  user: DiscordUser;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'logs'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [activeGuild, setActiveGuild] = useState<string | null>(null);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const g = await DiscordService.getGuilds();
      setGuilds(g);
      if (g.length > 0) setActiveGuild(g[0].id);
    };
    loadData();
  }, []);

  // Load guild specific data
  useEffect(() => {
    if (!activeGuild) return;
    
    const loadGuildData = async () => {
      const c = await DiscordService.getConfig(activeGuild);
      const l = await DiscordService.getLogs(activeGuild);
      setConfig(c);
      setLogs(l);
    };
    loadGuildData();
  }, [activeGuild]);

  const handleSaveConfig = async () => {
    if (!activeGuild || !config) return;
    setIsSaving(true);
    await DiscordService.saveConfig(activeGuild, config);
    setIsSaving(false);
    // You could add a toast notification here
  };

  const toggleConfig = (key: keyof BotConfig) => {
    if (!config) return;
    setConfig({ ...config, [key]: !config[key as keyof BotConfig] });
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Nexus Console
          </span>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="ml-auto md:hidden text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              Servers
            </h3>
            <div className="space-y-1">
              {guilds.map(guild => (
                <button
                  key={guild.id}
                  onClick={() => setActiveGuild(guild.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeGuild === guild.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${guild.active ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  {guild.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              Menu
            </h3>
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'overview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard size={18} />
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings size={18} />
                Bot Settings
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'logs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity size={18} />
                Audit Logs
              </button>
            </nav>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full border border-slate-700" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <p className="text-xs text-slate-500">#{user.discriminator}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-white">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'settings' && 'Server Configuration'}
              {activeTab === 'logs' && 'Activity Logs'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               System Online
             </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-400 text-sm font-medium">Total Members</h3>
                  <ServerIcon className="text-indigo-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-white">12,405</p>
                <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">↑ 12% from last month</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-400 text-sm font-medium">Commands Used</h3>
                  <Activity className="text-purple-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-white">84.3k</p>
                <p className="text-slate-500 text-xs mt-2">In the last 24 hours</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-400 text-sm font-medium">Security Actions</h3>
                  <ShieldAlert className="text-red-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-white">142</p>
                <p className="text-red-400 text-xs mt-2">Threats blocked today</p>
              </div>
              
              <div className="md:col-span-3 bg-slate-800/30 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Activity className="text-slate-500" size={32} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Activity Chart Placeholder</h3>
                <p className="text-slate-500 max-w-md">
                  Connect your bot's database to visualize member growth and command usage trends over time.
                </p>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && config && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Preset Configuration</h2>
                    <p className="text-slate-400 text-sm">Manage behavior for {guilds.find(g => g.id === activeGuild)?.name}</p>
                  </div>
                  <button 
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* General */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Command Prefix</label>
                        <input 
                          type="text" 
                          value={config.prefix}
                          onChange={(e) => setConfig({...config, prefix: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-slate-300 mb-1">Language</label>
                         <select 
                           value={config.language}
                           onChange={(e) => setConfig({...config, language: e.target.value})}
                           className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                         >
                           <option value="en-US">English (US)</option>
                           <option value="es-ES">Spanish</option>
                           <option value="fr-FR">French</option>
                         </select>
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Modules</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div>
                        <div className="font-medium text-white">Auto Moderation</div>
                        <div className="text-xs text-slate-500">Automatically filter spam and bad words</div>
                      </div>
                      <button 
                        onClick={() => toggleConfig('autoMod')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.autoMod ? 'bg-indigo-600' : 'bg-slate-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.autoMod ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div>
                        <div className="font-medium text-white">Welcome Messages</div>
                        <div className="text-xs text-slate-500">Send a greeting when users join</div>
                      </div>
                      <button 
                         onClick={() => toggleConfig('welcomeMessage')}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.welcomeMessage ? 'bg-indigo-600' : 'bg-slate-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.welcomeMessage ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div>
                        <div className="font-medium text-white">Audit Logging</div>
                        <div className="text-xs text-slate-500">Track all administration actions</div>
                      </div>
                      <button 
                         onClick={() => toggleConfig('auditLog')}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.auditLog ? 'bg-indigo-600' : 'bg-slate-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.auditLog ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
             <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-900/50 border-b border-slate-700">
                       <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Time</th>
                       <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                       <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">User</th>
                       <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Details</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-700/50">
                     {logs.map(log => (
                       <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                         <td className="px-6 py-4 text-sm font-mono text-slate-400">{log.time}</td>
                         <td className="px-6 py-4">
                           <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${
                             log.type === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                             log.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                             'bg-red-500/10 text-red-400 border-red-500/20'
                           }`}>
                             {log.action}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-sm text-slate-300">{log.user}</td>
                         <td className="px-6 py-4 text-sm text-slate-400">{log.details}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               {logs.length === 0 && (
                 <div className="p-8 text-center text-slate-500">No logs found.</div>
               )}
             </div>
          )}

        </div>
      </main>
    </div>
  );
};