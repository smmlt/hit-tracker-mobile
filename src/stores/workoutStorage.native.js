// EN: Selects AsyncStorage as the persisted-workout adapter on iOS and Android so preparation survives application restarts.
// UK: Використовує AsyncStorage як адаптер збереження workout на iOS/Android, щоб підготовка переживала перезапуск застосунку.
// EN: Native persistence uses AsyncStorage for the prepared/active workout snapshot consumed during app restart.
// UK: Нативне сховище використовує AsyncStorage для знімка підготовленого/активного тренування, потрібного після перезапуску застосунку.
import AsyncStorage from '@react-native-async-storage/async-storage';

export default AsyncStorage;
