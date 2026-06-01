/** Shared User interface used across frontend and backend. */
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export * from './settingsTypes.js';

