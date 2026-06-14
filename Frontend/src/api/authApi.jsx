
// Signup Request
export const signupRequest = async (userData) => {
  const response = await fetch("/api/v1/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error(
      "Sorry, this email address is already in use or the data is incomplete",
    );
  }
  return response.json();
};


// Login Request
export const loginRequest = async (credentials) => {
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error("The email or password is incorrect");
  }
  return response.json();
};



// Refresh Token Request
export const refreshRequest = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("The current session has expired");
  }
  return response.json();
};