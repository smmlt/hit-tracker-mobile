const STORAGE_KEY = 'appInstallationId';
let pendingId;

export function getInstallationId(storage, randomUUID) {
  if (!pendingId) {
    pendingId = storage.getItem(STORAGE_KEY).then(async (saved) => {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved || '')) {
        return saved;
      }
      const id = randomUUID();
      await storage.setItem(STORAGE_KEY, id);
      return id;
    }).catch((error) => {
      pendingId = null;
      throw error;
    });
  }
  return pendingId;
}
