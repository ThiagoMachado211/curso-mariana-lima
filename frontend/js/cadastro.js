document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const errorBox = document.getElementById("registerError");
  const successBox = document.getElementById("registerSuccess");

  const nameInput = document.getElementById("name");
  const lastNameInput = document.getElementById("last_name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm_password");

  const submitButton = form?.querySelector('button[type="submit"]');

  if (
    !form ||
    !errorBox ||
    !successBox ||
    !nameInput ||
    !lastNameInput ||
    !emailInput ||
    !passwordInput ||
    !confirmPasswordInput ||
    !submitButton
  ) {
    console.error("Elementos do formulário de cadastro não encontrados.");
    return;
  }

  try {
    if (typeof isAuthenticated === "function" && isAuthenticated()) {
      window.location.href = "dashboard.html";
      return;
    }
  } catch (error) {
    console.warn("Falha ao verificar autenticação existente:", error);
  }

  fetch("https://curso-mariana-lima.onrender.com/health")
    .then(() => console.log("Backend prewarmed com sucesso."))
    .catch(() => console.log("Backend ainda não respondeu ao prewarm."));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorBox.textContent = "";
    successBox.textContent = "";

    const name = nameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!name || !lastName || !email || !password || !confirmPassword) {
      errorBox.textContent = "Preencha todos os campos.";
      return;
    }

    if (password !== confirmPassword) {
      errorBox.textContent = "As senhas não coincidem.";
      return;
    }

    if (password.length < 6) {
      errorBox.textContent = "A senha deve ter pelo menos 6 caracteres.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Criando conta...";

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          last_name: lastName,
          email,
          password,
        }),
      });

      successBox.textContent = "Conta criada com sucesso! Redirecionando para o login...";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (error) {
      console.error("Erro no cadastro:", error);
      errorBox.textContent = error.message || "Erro ao criar conta.";
      submitButton.disabled = false;
      submitButton.textContent = "Criar conta";
    }
  });
});