// Проверка формата Email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Проверка критериев пароля
export const getPasswordCriteria = (password) => {
  return {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUpper: /[A-Z]/.test(password),
  };
};

// Полная проверка валидности пароля
export const isValidPassword = (password) => {
  const criteria = getPasswordCriteria(password);
  return criteria.minLength && criteria.hasNumber && criteria.hasUpper;
};