document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");

  if (!form) return;

  if (isAuthenticated()) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorBox.textContent = "";

    const email = document.getElementById("email")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";

    if (!email || !password) {
      errorBox.textContent = "Preencha email e senha.";
      return;
    }

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      saveToken(data.access_token);
      window.location.href = "dashboard.html";
    } catch (error) {
      errorBox.textContent = error.message || "Falha ao fazer login.";
      console.error("Erro no login:", error);
    }
  });
});