const memoryStorage = new Map<string, string>();

export const safeSessionStorage = {
  getItem(key: string) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },
  setItem(key: string, value: string) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },
  removeItem(key: string) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
  },
};

export const safeLocalStorage: Storage = {
  get length() {
    try {
      return window.localStorage.length;
    } catch {
      return memoryStorage.size;
    }
  },
  clear() {
    try {
      window.localStorage.clear();
    } catch {
      memoryStorage.clear();
    }
  },
  getItem(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },
  key(index: number) {
    try {
      return window.localStorage.key(index);
    } catch {
      return Array.from(memoryStorage.keys())[index] ?? null;
    }
  },
  removeItem(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
  },
  setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },
};

export const clearAuthRecoveryState = () => {
  safeSessionStorage.removeItem('password_recovery_active');
  safeSessionStorage.removeItem('intro_seen');
};
