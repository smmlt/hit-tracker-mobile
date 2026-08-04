// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Check password criteria
export const getPasswordCriteria = (password) => {
  return {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUpper: /[A-Z]/.test(password),
  };
};

// Full password validity check
export const isValidPassword = (password) => {
  const criteria = getPasswordCriteria(password);
  return criteria.minLength && criteria.hasNumber && criteria.hasUpper;
};