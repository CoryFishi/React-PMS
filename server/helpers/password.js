const bcrpyt = require("bcrypt");

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrpyt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrpyt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
};

const comparePassword = (password, hashed) => {
  return bcrpyt.compare(password, hashed);
};

const passwordValidator = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!password) {
    return "Password is required.";
  }
  if (password.length < minLength) {
    return `Password should be at least ${minLength} characters long.`;
  }
  if (!hasUpperCase) {
    return "Password should contain at least one uppercase letter.";
  }
  if (!hasLowerCase) {
    return "Password should contain at least one lowercase letter.";
  }
  if (!hasNumber) {
    return "Password should contain at least one number.";
  }
  if (!hasSpecialChar) {
    return "Password should contain at least one special character.";
  }

  return null;
};

module.exports = {
  hashPassword,
  comparePassword,
  passwordValidator,
};
