# Zustand state migration / Перенесення стану до Zustand

## English

Workout and library state now live in `src/stores/workoutStore.js` and `src/stores/libraryStore.js`. Zustand selectors let the banner watch only workout status and plan, and let library cards watch only the catalog fields they use. The old Context providers sent every update to every consumer; the new stores also remove provider nesting from `App.js`.

The workout store persists the prepared plan, active workout, logged sets, and owning user ID. Web uses `localStorage`; iOS and Android use the already installed AsyncStorage. Tokens are kept out of persisted state. Auth initialization checks the saved owner before showing the navigator, and logout clears the saved workout. A successful active-workout fetch reconciles local state with the server; a network failure leaves the saved workout available until retry.

The store also tracks an unpersisted `activeVerified` flag, false on rehydrate and on a user change (`setSession` for a new user, or `reset`), and set once `checkActiveWorkout` settles (success or failure) for the current session. A same-user token refresh (`setSession` called again for the same user, e.g. the ~5-minute access-token refresh) does not reset it, so the banner isn't re-hidden every few minutes while already verified. The active-workout banner treats `activeWorkout` as absent until `activeVerified` is true, so a workout finished or cancelled on another device never flashes on this one before the server check confirms it; `preparedWorkout` is local-only and still renders immediately. This keeps app startup off the network path (`storesReady` does not wait on it) while gating only the UI that surfaces the rehydrated `activeWorkout`.

`logout` always clears local auth and workout/library store state in its `finally` block, even when the server-side revoke call fails (e.g. offline): leaving stale tokens or workout data on the device would be worse than a session outliving an already best-effort server logout.

To demo: sign in, prepare a workout in Workshop, reload, and see the prepared banner and session plan. Start it, record a set, reload, and confirm the active session returns. Pause and resume, finish or cancel, then reload to confirm the banner is gone. Log out, sign in as another account, and confirm the previous plan never appears. Switch language and inspect localized exercise and program names in the library.

## Українською

Стан тренувань і бібліотеки тепер міститься в `src/stores/workoutStore.js` та `src/stores/libraryStore.js`. Селектори Zustand дозволяють банеру стежити лише за статусом і планом тренування, а карткам бібліотеки — лише за потрібними полями каталогу. Старі Context-провайдери надсилали кожне оновлення всім споживачам; нові сховища також прибрали зайве вкладення провайдерів з `App.js`.

Сховище тренування зберігає підготовлений план, активне тренування, записані підходи та ідентифікатор користувача-власника. Вебверсія використовує `localStorage`, а iOS і Android — уже встановлений AsyncStorage. Токени не потрапляють до збереженого стану. Ініціалізація автентифікації перевіряє власника перед показом навігатора, а вихід очищає збережене тренування. Успішне завантаження активного тренування узгоджує локальний стан із сервером; помилка мережі залишає збережене тренування доступним до наступної спроби.

Сховище також тримає незбережуваний прапорець `activeVerified`. Він має значення `false` після відновлення стану або зміни користувача й встановлюється після завершення `checkActiveWorkout` для поточної сесії — незалежно від успіху чи помилки. Оновлення токена того самого користувача не скидає прапорець, тому банер не зникає кожні кілька хвилин. Банер не вважає відновлене `activeWorkout` дійсним до перевірки, отже тренування, завершене або скасоване на іншому пристрої, не зʼявиться навіть на мить. Локальний `preparedWorkout` показується одразу. Так запуск застосунку не залежить від мережі, а перевірка обмежується інтерфейсом, який показує відновлене активне тренування.

`logout` завжди очищає локальну автентифікацію та стан тренування й бібліотеки в блоці `finally`, навіть якщо серверне відкликання сесії не вдалося через відсутність мережі. Залишити на пристрої старі токени або дані іншого користувача небезпечніше, ніж тимчасово залишити серверну сесію, відкликання якої є найкращою можливою спробою.

Для демонстрації: увійдіть, підготуйте тренування у Workshop, перезавантажте застосунок і покажіть банер та план. Запустіть тренування, запишіть підхід, перезавантажте й підтвердьте відновлення активної сесії. Поставте її на паузу та продовжте, завершіть або скасуйте, а після перезавантаження покажіть, що банер зник. Вийдіть, увійдіть під іншим обліковим записом і підтвердьте, що попередній план не зʼявляється. Змініть мову та покажіть локалізовані назви вправ і програм у бібліотеці.
