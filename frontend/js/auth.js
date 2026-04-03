function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getUserRole() {
  return localStorage.getItem("user_role");
}

function redirectToLogin() {
  window.location.href = "./login.html";
}

function requireAuth() {
  const token = getAccessToken();

  if (!token) {
    redirectToLogin();
    return false;
  }

  return true;
}

function requireStudent() {
  const isAuthenticated = requireAuth();
  if (!isAuthenticated) return false;

  const role = getUserRole();

  if (role !== "student") {
    window.location.href = "./login.html";
    return false;
  }

  return true;
}

function requireAdmin() {
  const isAuthenticated = requireAuth();
  if (!isAuthenticated) return false;

  const role = getUserRole();

  if (role !== "admin") {
    window.location.href = "./login.html";
    return false;
  }

  return true;
}

function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("course_id");
  window.location.href = "./login.html";
}