export enum UserRole {
  USER = 0,
  ROOT_ADMIN = 1,
  ADMIN = 2,
  STAFF = 3,
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  township?: string;
  avatar?: string;
  active: boolean;
  createdAt: string;
  lastSeen?: string;
  lastLoginAt?: string;
  dailyLoginCount?: number;
  lastLoginDate?: string;
  dailyLoginLimit?: number;
}

export interface DataRow {
  id: string | number;
  [key: string]: any;
}

export interface StatusState {
  message: string;
  type: 'success' | 'error' | '';
}

export interface QRSettings {
  size: number;
  logoUrl: string;
  selectedColumns: string[];
}

export interface OnlineUser {
  _id: string;
  name: string;
  township?: string;
  lastSeen: string;
}
