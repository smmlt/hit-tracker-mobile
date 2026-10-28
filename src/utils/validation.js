// EN: Provides client-side email and password checks used for immediate form feedback before server validation.
// UK: Надає client-side перевірки email і password для миттєвого feedback форми перед server validation.
/** EN: Checks a trimmed email value against the basic address shape accepted by the form. UK: Перевіряє очищену електронну адресу за базовим форматом, який приймає форма. */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/** EN: Evaluates each password rule separately so the interface can show live requirement feedback. UK: Окремо перевіряє кожну вимогу до пароля, щоб інтерфейс показував поточний стан правил. */
export const getPasswordCriteria = (password) => {
  return {
    minLength: password.length >= 12,
    hasNumber: /\d/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
};

/** EN: Accepts a password only when all client-side criteria pass. UK: Приймає пароль лише тоді, коли виконано всі клієнтські вимоги. */
export const isValidPassword = (password) => {
  const criteria = getPasswordCriteria(password);
  return Object.values(criteria).every(Boolean);
};
