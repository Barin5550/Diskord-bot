import React from 'react';

export interface FeatureItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface StatItem {
  label: string;
  value: string;
  trend?: string;
}

export enum BotCommandStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface CommandResponse {
  command: string;
  explanation: string;
}

// Auth & Dashboard Types
export interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  active: boolean;
}

export interface BotConfig {
  prefix: string;
  autoMod: boolean;
  welcomeMessage: boolean;
  auditLog: boolean;
  musicQuality: 'std' | 'hq';
  language: string;
}

export interface LogEntry {
  id: string;
  time: string;
  action: string;
  user: string;
  details: string;
  type: 'info' | 'warning' | 'error';
}