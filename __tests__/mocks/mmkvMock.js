const mockStorage = new Map();

export const createMMKV = () => ({
  getString: (key) => mockStorage.get(key) ?? null,
  set: (key, value) => {
    mockStorage.set(key, String(value));
  },
  remove: (key) => {
    mockStorage.delete(key);
  },
  clearAll: () => {
    mockStorage.clear();
  },
});
