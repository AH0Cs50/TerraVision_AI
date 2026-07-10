export const validateSignup = (data) => {
  const errors = {};

  // 1. تحقق من حقل الاسم
  if (!data.name || !data.name.trim()) {
    errors.name = "Full Name is required";
  } else if (data.name.trim().length < 3) {
    errors.name = "The name must be at least 3 letters long.";
  }

  // 2. تحقق من البريد الإلكتروني
  if (!data.email || !data.email.trim()) {
    errors.email = "Email address required";
// استبدل السطر القديم بهذا السطر بالظبط:
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "The email format is incorrect";
  }

  // 3. تحقق من كلمة المرور
/*   if (!data.password) {
    errors.password = "Password required";
  } else if (data.password.length < 6) {
    errors.password = "The password must be at least 6 characters long.";
  } */

    const password = data.password;

if (!password) {
  errors.password = "Password required";
} else if (password.length < 8) {
  errors.password = "Password must be at least 8 characters";
} else if (!/[a-z]/.test(password)) {
  errors.password = "Password must contain at least one lowercase letter";
} else if (!/[A-Z]/.test(password)) {
  errors.password = "Password must contain at least one uppercase letter";
} else if (!/\d/.test(password)) {
  errors.password = "Password must contain at least one number";
}

  // 4. تحقق من حقل الموقع (Location) ليتوافق مع الباكيند والفرونتند
  if (!data.location || !data.location.trim()) {
    errors.location = "Location is required";
  }

  // 5. تحقق من الموافقة على الشروط
  if (!data.agreed) {
    errors.agreed = "You must agree to the Terms and Privacy Policy";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };







};





  // أضف هذه الدالة في ملف authValidator.jsx الحالي لديك

export const validateChangePassword = (data) => {
  const errors = {};

  // 1. التحقق من كلمة المرور الحالية
  if (!data.currentPassword) {
    errors.currentPassword = "Current password is required";
  }

  // 2. التحقق من كلمة المرور الجديدة (بنفس شروط الحماية القوية في مشروعك)
  const newPassword = data.newPassword;

  if (!newPassword) {
    errors.newPassword = "New password required";
  } else if (newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters";
  } else if (!/[a-z]/.test(newPassword)) {
    errors.newPassword = "Password must contain at least one lowercase letter";
  } else if (!/[A-Z]/.test(newPassword)) {
    errors.newPassword = "Password must contain at least one uppercase letter";
  } else if (!/\d/.test(newPassword)) {
    errors.newPassword = "Password must contain at least one number";
  }

  // 3. التحقق من تأكيد كلمة المرور الجديدة ومطابقتها
  if (!data.confirmPassword) {
    errors.confirmPassword = "Confirm password is required";
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = "New password and confirm password do not match";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};