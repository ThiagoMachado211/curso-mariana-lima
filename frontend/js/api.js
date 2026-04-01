const API_BASE_URL = "https://curso-mariana-lima.onrender.com";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
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
    return null;
  }

  // tenta ler JSON
  if (contentType.includes("application/json")) {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } else {
    const text = await response.text();
    data = text ? { detail: text } : null;
  }

  if (!response.ok) {
    let errorMessage = `Erro ${response.status}`;

    if (data) {
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail
          .map((item) => {
            const field = Array.isArray(item.loc) ? item.loc.join(" > ") : "campo";
            return `${field}: ${item.msg}`;
          })
          .join(" | ");
      } else if (typeof data.detail === "object") {
        errorMessage = JSON.stringify(data.detail);
      } else if (typeof data === "string") {
        errorMessage = data;
      }
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function getToken() {
  return localStorage.getItem("access_token");
}

function isAuthenticated() {
  return !!getToken();
}

function logout() {
  localStorage.removeItem("access_token");
  window.location.href = "login.html";
}

async function requireAuth() {
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";
    throw new Error("Usuário não autenticado.");
  }

  try {
    return await apiRequest("/auth/me");
  } catch (error) {
    localStorage.removeItem("access_token");
    window.location.href = "login.html";
    throw error;
  }
}

async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== "admin") {
    window.location.href = "dashboard.html";
    throw new Error("Apenas administradores podem acessar esta página.");
  }

  return user;
}

async function requireStudent() {
  const user = await requireAuth();

  if (user.role !== "student") {
    window.location.href = "admin-dashboard.html";
    throw new Error("Apenas alunos podem acessar esta página.");
  }

  return user;
}