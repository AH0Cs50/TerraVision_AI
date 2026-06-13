export const validateSignup = (data) => {
  const errors = {};

  // Check name
  if (!data.name || !data.name.trim()) {
    errors.name = "Full Name";
  } else if (data.name.trim().length < 3) {
    errors.name = "The name must be at least 3 letters long.";
  }

  // Check Email
  if (!data.email || !data.email.trim()) {
    errors.email = "Email address required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "The email format is incorrect";
  }

  // Check Password
  if (!data.password) {
    errors.password = "Password required";
  } else if (data.password.length < 6) {
    errors.password = "The password must be at least 6 characters long.";
  }

  // Password matching check
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  // Terms and Conditions Approval Check
  if (!data.agreed) {
    errors.agreed = "You must agree to the Terms and Privacy Policy";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
