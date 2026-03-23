const API_BASE_URL = "http://localhost:8000";

function saveToken(token) {
  localStorage.setItem("access_token", token);
}

function getToken() {
  return localStorage.getItem("access_token");
}

function removeToken() {
  localStorage.removeItem("access_token");
}

function isAuthenticated() {
  return !!getToken();
}

async function getCurrentUser() {
  return await apiRequest("/auth/me");
}

async function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return null;
  }

  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    removeToken();
    window.location.href = "login.html";
    return null;
  }
}

async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return null;

  if (user.role !== "admin") {
    window.location.href = "dashboard.html";
    return null;
  }

  return user;
}

async function requireStudent() {
  const user = await requireAuth();
  if (!user) return null;

  if (user.role !== "student") {
    window.location.href = "dashboard.html";
    return null;
  }

  return user;
}


async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null
        ? data.detail || JSON.stringify(data)
        : data;

    throw new Error(detail || "Erro na requisição.");
  }

  return data;
}