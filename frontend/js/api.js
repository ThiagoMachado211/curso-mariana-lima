const API_BASE_URL = "https://curso-mariana-lima.onrender.com";

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch (networkError) {
    console.error("Erro de rede/fetch:", networkError);
    throw new Error("Falha de conexão com o servidor.");
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (parseError) {
    console.error("Erro ao interpretar resposta:", parseError);
    data = null;
  }

  if (!response.ok) {
    console.error("Resposta de erro da API:", {
      endpoint,
      status: response.status,
      data
    });

    const message =
      data?.detail ||
      data?.message ||
      (typeof data === "string" && data.trim()) ||
      `Erro ${response.status} na requisição.`;

    throw new Error(message);
  }

  return data;
}