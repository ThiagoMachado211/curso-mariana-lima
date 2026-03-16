document.addEventListener("DOMContentLoaded", async () => {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  const logoutButton = document.getElementById("logoutButton");
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const userRole = document.getElementById("userRole");
  const tokenPreview = document.getElementById("tokenPreview");
  const dashboardError = document.getElementById("dashboardError");

  if (tokenPreview) {
    const token = getToken();
    tokenPreview.textContent = token ? `${token.slice(0, 50)}...` : "Sem token";
  }

  try {
    const me = await apiRequest("/auth/me", {
      method: "GET",
    });

    if (userName) userName.textContent = me.name;
    if (userEmail) userEmail.textContent = me.email;
    if (userRole) userRole.textContent = me.role;
  } catch (error) {
    if (dashboardError) {
      dashboardError.textContent = "Sua sessão expirou. Faça login novamente.";
    }

    removeToken();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);

    return;
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      removeToken();
      window.location.href = "login.html";
    });
  }
});