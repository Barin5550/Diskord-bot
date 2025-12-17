import { BotConfig, DiscordUser, Guild, LogEntry } from "../types";

// Mock Data
const MOCK_USER: DiscordUser = {
  id: '123456789',
  username: 'NexusAdmin',
  discriminator: '0001',
  avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
};

const MOCK_GUILDS: Guild[] = [
  { id: '1', name: 'Nexus Support', icon: null, active: true },
  { id: '2', name: 'Gaming Lounge', icon: null, active: true },
  { id: '3', name: 'Test Server', icon: null, active: false },
];

const DEFAULT_CONFIG: BotConfig = {
  prefix: '!',
  autoMod: true,
  welcomeMessage: false,
  auditLog: true,
  musicQuality: 'hq',
  language: 'en-US'
};

const MOCK_LOGS: LogEntry[] = [
  { id: '1', time: '10:42 AM', action: 'Ban', user: 'Spammer#1234', details: 'Advertising via DM', type: 'error' },
  { id: '2', time: '10:30 AM', action: 'Config', user: 'Admin', details: 'Updated auto-mod settings', type: 'info' },
  { id: '3', time: '09:15 AM', action: 'Warn', user: 'Troll#9999', details: 'Inappropriate language', type: 'warning' },
];

// Service
export const DiscordService = {
  // Simulate OAuth2 Login
  login: (): Promise<DiscordUser> => {
    return new Promise((resolve) => {
      // In a real app, this would redirect to:
      // https://discord.com/api/oauth2/authorize?client_id=...&redirect_uri=...&response_type=code&scope=identify%20guilds
      setTimeout(() => {
        localStorage.setItem('nexus_auth_token', 'mock_token_123');
        localStorage.setItem('nexus_user', JSON.stringify(MOCK_USER));
        resolve(MOCK_USER);
      }, 800);
    });
  },

  logout: () => {
    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('nexus_user');
  },

  getCurrentUser: (): DiscordUser | null => {
    const stored = localStorage.getItem('nexus_user');
    return stored ? JSON.parse(stored) : null;
  },

  getGuilds: async (): Promise<Guild[]> => {
    // Simulate API call
    return new Promise(resolve => setTimeout(() => resolve(MOCK_GUILDS), 500));
  },

  getConfig: async (guildId: string): Promise<BotConfig> => {
    return new Promise(resolve => setTimeout(() => resolve(DEFAULT_CONFIG), 400));
  },

  saveConfig: async (guildId: string, config: BotConfig): Promise<boolean> => {
    console.log(`Saving config for guild ${guildId}:`, config);
    return new Promise(resolve => setTimeout(() => resolve(true), 600));
  },

  getLogs: async (guildId: string): Promise<LogEntry[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_LOGS), 400));
  }
};