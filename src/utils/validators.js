export const isValidEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

export const isValidPhone = (phone) => {
  if (!phone) return true; // Assuming phone is optional unless checked specifically
  // Allows optional +, digits, spaces, hyphens, and parens
  const re = /^\+?[0-9\s\-()]{7,15}$/;
  return re.test(String(phone));
};

export const isPositiveNumber = (val) => {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  return !isNaN(num) && num >= 0;
};

export const isValidAge = (val) => {
  if (val === null || val === undefined || val === '') return true; // Optional
  const num = Number(val);
  return !isNaN(num) && num >= 0 && num < 40; // Reasonable pet age
};
