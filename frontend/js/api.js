const API_BASE_URL = "https://curso-mariana-lima.onrender.com";

/* =========================
   AUTH
========================= */

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

/* =========================
   REQUEST PADRÃO
========================= */


async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    ...(options.headers || {}),
  };

  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";

  let data = null;

  // 204 = sem conteúdo
  if (response.status === 204) {
    data = null;
  } else if (contentType.includes("application/json")) {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } else {
    const text = await response.text();
    data = text ? { detail: text } : null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || `Erro ${response.status}`);
  }

  return data;
}


/* =========================
   USER / ROLE
========================= */

async function getCurrentUser() {
  return await apiRequest("/auth/me");
}

async function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return null;
  }

  try {
    return await getCurrentUser();
  } catch {
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

/* =========================
   HELPERS
========================= */

function logout() {
  removeToken();
  window.location.href = "login.html";
}