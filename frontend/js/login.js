document.addEventListener("DOMContentLoaded", () => {
  console.log("Login carregado");

  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");

  const passwordInput = document.getElementById("password");
  const togglePasswordButton = document.getElementById("togglePassword");

  if (!form) {
    console.error("Form não encontrado");
    return;
  }

  // 🔐 Toggle senha com ícone
  if (passwordInput && togglePasswordButton) {
    const eyeIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#a855f7" viewBox="0 0 24 24">
        <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
        <circle cx="12" cy="12" r="2.5"/>
      </svg>
    `;

    const eyeOffIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#a855f7" viewBox="0 0 24 24">
        <path d="M2 4l20 16-1.5 1.5-3.2-2.5A11.7 11.7 0 0 1 12 19c-7 0-10-7-10-7a18.9 18.9 0 0 1 5.3-5.9L.5 5.5 2 4zm10 3a5 5 0 0 1 5 5c0 .7-.1 1.3-.4 1.9l-6.5-5.2c.6-.4 1.3-.7 1.9-.7zm0 10a5 5 0 0 1-5-5c0-.7.1-1.3.4-1.9l6.5 5.2c-.6.4-1.3.7-1.9.7z"/>
      </svg>
    `;

    togglePasswordButton.innerHTML = eyeIcon;

    togglePasswordButton.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";

      passwordInput.type = isHidden ? "text" : "password";
      togglePasswordButton.innerHTML = isHidden ? eyeOffIcon : eyeIcon;
    });
  }  


  // 🔁 Se já estiver logado, redireciona
  try {
    if (typeof isAuthenticated === "function" && isAuthenticated()) {
      window.location.href = "dashboard.html";
      return;
    }
  } catch (err) {
    console.warn("Erro ao verificar autenticação:", err);
  }

  // 🚀 Submit login
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorBox.textContent = "";

    const email =
      document.getElementById("email")?.value.trim().toLowerCase() || "";
    const password =
      document.getElementById("password")?.value.trim() || "";

    if (!email || !password) {
      errorBox.textContent = "Preencha email e senha.";
      return;
    }

    // limpa token antigo
    localStorage.removeItem("access_token");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("access_token", data.access_token);

      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Erro no login:", err);
      errorBox.textContent = err.message || "Erro ao fazer login.";
    }
  });
});