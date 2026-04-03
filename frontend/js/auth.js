function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getUserRole() {
  return localStorage.getItem("user_role");
}

function isAuthenticated() {
  return Boolean(getAccessToken());
}

function redirectToLogin() {
  window.location.href = "./login.html";
}

function requireAuth() {
  if (!isAuthenticated()) {
    redirectToLogin();
    return false;
  }

  return true;
}

function requireStudent() {
  const ok = requireAuth();
  if (!ok) return false;

  const role = getUserRole();

  if (role !== "student") {
    redirectToLogin();
    return false;
  }

  return true;
}

function requireAdmin() {
  const ok = requireAuth();
  if (!ok) return false;

  const role = getUserRole();

  if (role !== "admin") {
    redirectToLogin();
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