// Redux store configuration will be implemented here.
// This file will set up the Redux store for the FitVibes app.

import { create } from 'zustand';

// Example Zustand store for FitVibes
// You can expand this store or create new ones in the store/ folder as needed

type UserState = {
  name: string;
  setName: (name: string) => void;
};

export const useUserStore = create<UserState>((set) => ({
  name: '',
  setName: (name) => set({ name }),
}));
