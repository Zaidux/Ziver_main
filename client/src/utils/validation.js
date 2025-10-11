export const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must include uppercase, lowercase, number, and special character'
  },
  twoFactorCode: {
    pattern: /^\d{6}$/,
    message: 'Please enter a valid 6-digit code'
  }
};

export const validateField = (field, value) => {
  const rules = validationRules[field];
  if (!rules) return { isValid: true };
  
  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, message: rules.message };
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    return { isValid: false, message: rules.message };
  }
  
  return { isValid: true };
};

export const validateForm = (fields) => {
  const errors = {};
  
  Object.keys(fields).forEach(field => {
    const validation = validateField(field, fields[field]);
    if (!validation.isValid) {
      errors[field] = validation.message;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const passwordStrength = (password) => {
  if (!password) return { strength: 0, label: '' };
  
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[@$!%*?&]/.test(password)) strength += 1;
  
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const classes = ['', 'strength-weak', 'strength-weak', 'strength-medium', 'strength-strong', 'strength-strong'];
  
  return {
    strength,
    label: labels[strength],
    class: classes[strength]
  };
};