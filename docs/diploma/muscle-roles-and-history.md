# Exercise muscle roles and workout history / Ролі мʼязів у вправах та історія тренувань

## English

### Why the model changed

An exercise no longer has one undifferentiated list of muscles. Each exercise-muscle relation has one of two roles:

- `primary` — the muscle is a main target of the exercise;
- `secondary` — the muscle assists the movement but is not its principal target.

The role belongs to the relation between an exercise and a muscle, not to the muscle itself. The same muscle can therefore be primary for one exercise and secondary for another.

### End-to-end contract

The mobile editor keeps `primaryMuscleIds` and `secondaryMuscleIds` as separate collections. A muscle can appear in only one collection at a time; moving it to one role removes it from the other. Create and update requests send both groups to the backend.

The backend validates the same invariant again. It rejects overlapping groups with `EXERCISE_MUSCLE_ROLE_CONFLICT`. During an update, both lists must be supplied together; this makes replacement atomic and avoids accidentally clearing or preserving half of the relation set.

PostgreSQL stores the role on `exercises_train_muscles`. Existing rows receive the default `primary` role during migration, preserving the meaning of data created before this feature. A database check constraint accepts only `primary` or `secondary`, so invalid roles cannot bypass application validation.

### Read path and history snapshots

Exercise reads return every muscle with its role. The client normalizes older responses that have no role as `primary`, which makes the new application compatible with legacy fixtures or cached data.

When a workout is read for history, the backend joins the exercise-muscle relation and includes the role in each set's `muscleGroups`. History therefore describes the classification used by the exercise data at the read boundary rather than forcing the UI to guess whether a muscle was primary or assisting.

### Defense explanation

A concise explanation is:

> “The role is an attribute of the many-to-many exercise-muscle relation. The UI prevents overlap for immediate feedback, the API validates it as a domain rule, and PostgreSQL constrains the stored values. Existing relations migrate to primary for backward compatibility. The history response carries the role to the presentation layer.”

The important point is the layered protection: client validation improves usability, server validation protects the API contract, and the database constraint protects persistent integrity.

## Українською

### Чому модель змінилася

Вправа більше не має одного нерозділеного списку мʼязів. Кожен звʼязок між вправою та мʼязом має одну з двох ролей:

- `primary` — мʼяз є основною ціллю вправи;
- `secondary` — мʼяз допомагає виконувати рух, але не є його головною ціллю.

Роль належить звʼязку між вправою та мʼязом, а не самому мʼязу. Тому той самий мʼяз може бути основним для однієї вправи й допоміжним для іншої.

### Наскрізний контракт

Мобільний редактор зберігає `primaryMuscleIds` і `secondaryMuscleIds` як окремі колекції. Мʼяз може перебувати лише в одній колекції одночасно; перенесення до однієї ролі видаляє його з іншої. Запити створення й оновлення надсилають backend обидві групи.

Backend повторно перевіряє ту саму незмінну умову. Якщо групи перетинаються, він повертає `EXERCISE_MUSCLE_ROLE_CONFLICT`. Під час оновлення обидва списки потрібно передати разом: завдяки цьому заміна є атомарною й не може випадково очистити або зберегти лише половину звʼязків.

PostgreSQL зберігає роль у таблиці `exercises_train_muscles`. Під час міграції наявні рядки отримують типову роль `primary`, тому зміст даних, створених до цієї функції, зберігається. Обмеження бази даних приймає лише `primary` або `secondary`, отже неправильна роль не може оминути перевірки застосунку.

### Читання даних і знімки історії

Під час читання вправи кожен мʼяз повертається разом із роллю. Клієнт нормалізує старі відповіді без ролі як `primary`, що забезпечує сумісність нового застосунку зі старими фікстурами або кешованими даними.

Під час читання тренування для історії backend приєднує звʼязок вправи з мʼязом і додає роль до `muscleGroups` кожного підходу. Отже, історія передає класифікацію через межу API, а інтерфейсу не потрібно здогадуватися, чи був мʼяз основним або допоміжним.

### Пояснення для захисту

Коротко це можна пояснити так:

> «Роль є атрибутом звʼязку “багато до багатьох” між вправою та мʼязом. Інтерфейс не допускає перетину для швидкого зворотного звʼязку, API перевіряє доменне правило, а PostgreSQL обмежує збережені значення. Наявні звʼязки мігрують до ролі primary для зворотної сумісності. Відповідь історії передає роль на рівень представлення».

Головна ідея — багаторівневий захист: перевірка на клієнті покращує зручність, перевірка на сервері захищає контракт API, а обмеження бази даних гарантує цілісність збережених даних.
