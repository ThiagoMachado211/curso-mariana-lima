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

/*
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

  if (response.status === 401) {
    removeToken();
    window.location.href = "login.html";
    return null;
  }

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
*/

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

  console.log("API URL:", `${API_BASE_URL}${path}`);
  console.log("API options:", { ...options, headers });

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  console.log("Status:", response.status);

  const contentType = response.headers.get("content-type") || "";
  console.log("Content-Type:", contentType);

  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { detail: text };
  }

  console.log("Resposta da API:", data);

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