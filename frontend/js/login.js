document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePasswordButton = document.getElementById("togglePassword");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form || !errorBox || !emailInput || !passwordInput || !submitButton) {
    console.error("Elementos do formulário de login não encontrados.");
    return;
  }

  const eyeIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#a855f7" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
      <circle cx="12" cy="12" r="2.5"/>
    </svg>
  `;

  const eyeOffIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#a855f7" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 4l20 16-1.5 1.5-3.2-2.5A11.7 11.7 0 0 1 12 19c-7 0-10-7-10-7a18.9 18.9 0 0 1 5.3-5.9L.5 5.5 2 4zm10 3a5 5 0 0 1 5 5c0 .7-.1 1.3-.4 1.9l-6.5-5.2c.6-.4 1.3-.7 1.9-.7zm0 10a5 5 0 0 1-5-5c0-.7.1-1.3.4-1.9l6.5 5.2c-.6.4-1.3.7-1.9.7z"/>
    </svg>
  `;

  function resetSubmitButton() {
    submitButton.disabled = false;
    submitButton.textContent = "Entrar";
  }

  function setSubmittingState() {
    submitButton.disabled = true;
    submitButton.textContent = "Entrando...";
  }

  function clearSession() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("course_id");
  }

  if (togglePasswordButton) {
    togglePasswordButton.innerHTML = eyeIcon;
    togglePasswordButton.setAttribute("aria-label", "Mostrar senha");

    togglePasswordButton.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";

      passwordInput.type = isHidden ? "text" : "password";
      togglePasswordButton.innerHTML = isHidden ? eyeOffIcon : eyeIcon;
      togglePasswordButton.setAttribute(
        "aria-label",
        isHidden ? "Ocultar senha" : "Mostrar senha"
      );
    });
  }

  async function redirectIfAlreadyAuthenticated() {
    try {
      if (typeof isAuthenticated === "function" && isAuthenticated()) {
        const user = await apiRequest("/auth/me");

        if (!user?.role) {
          throw new Error("Usuário autenticado sem perfil definido.");
        }

        localStorage.setItem("user_role", user.role);

        if (user.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else {
          window.location.href = "dashboard.html";
        }

        return true;
      }
    } catch (error) {
      console.warn("Falha ao verificar autenticação existente:", error);
      clearSession();
    }

    return false;
  }

  redirectIfAlreadyAuthenticated();

  fetch("https://curso-mariana-lima.onrender.com/health")
    .then(() => console.log("Backend prewarmed com sucesso."))
    .catch(() => console.log("Backend ainda não respondeu ao prewarm."));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      errorBox.textContent = "Preencha email e senha.";
      return;
    }

    setSubmittingState();
    clearSession();

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!data?.access_token) {
        throw new Error("Token de acesso não retornado pelo servidor.");
      }

      localStorage.setItem("access_token", data.access_token);

      const user = await apiRequest("/auth/me");

      if (!user?.role) {
        throw new Error("Perfil do usuário não retornado pelo servidor.");
      }

      localStorage.setItem("user_role", user.role);

      if (user.role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }
    } catch (error) {
      console.error("Erro no login:", error);
      clearSession();
      errorBox.textContent = error.message || "Erro ao fazer login.";
      resetSubmitButton();
    }
  });
});