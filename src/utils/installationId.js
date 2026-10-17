// EN: Returns one stable per-installation identifier and coalesces concurrent first-use reads so only one UUID is persisted.
// UK: Повертає стабільний ID інсталяції та обʼєднує паралельні перші читання, щоб зберігався лише один UUID.
const STORAGE_KEY = 'appInstallationId';
let pendingId;

/** EN: Loads or creates the installation UUID while sharing one in-flight promise across concurrent callers. UK: Завантажує або створює UUID інсталяції, спільно використовуючи один активний Promise між паралельними викликами. */
export function getInstallationId(storage, randomUUID) {
  if (!pendingId) {
    pendingId = storage.getItem(STORAGE_KEY).then(/* EN: Reuses a valid stored UUID or persists a newly generated installation identifier. UK: Повторно використовує коректний збережений UUID або записує новий ідентифікатор інсталяції. */ async (saved) => {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved || '')) {
        return saved;
      }
      const id = randomUUID();
      await storage.setItem(STORAGE_KEY, id);
      return id;
    }).catch(/* EN: Clears the shared promise after failure so a later caller can retry initialization. UK: Очищає спільний Promise після помилки, щоб наступний виклик міг повторити ініціалізацію. */ (error) => {
      pendingId = null;
      throw error;
    });
  }
  return pendingId;
}
