document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const button = document.getElementById("resetPasswordButton");
  const messageBox = document.getElementById("resetPasswordMessage");
  const errorBox = document.getElementById("resetPasswordError");

  if (!form || !passwordInput || !confirmPasswordInput || !button || !messageBox || !errorBox) {
    console.error("Elementos da página de reset de senha não encontrados.");
    return;
  }

  function clearMessages() {
    messageBox.textContent = "";
    errorBox.textContent = "";
  }

  function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();

    const token = getTokenFromUrl();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!token) {
      errorBox.textContent = "Token de redefinição não encontrado.";
      return;
    }

    if (!password || !confirmPassword) {
      errorBox.textContent = "Preencha todos os campos.";
      return;
    }

    if (password.length < 6) {
      errorBox.textContent = "A nova senha deve ter pelo menos 6 caracteres.";
      return;
    }

    if (password !== confirmPassword) {
      errorBox.textContent = "As senhas não coincidem.";
      return;
    }

    button.disabled = true;
    button.textContent = "Salvando...";

    try {
      const response = await fetch("https://curso-mariana-lima.onrender.com/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Erro ao redefinir senha.");
      }

      messageBox.textContent = data?.message || "Senha redefinida com sucesso.";
      form.reset();

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1800);
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      errorBox.textContent = error.message || "Erro ao redefinir senha.";
    } finally {
      button.disabled = false;
      button.textContent = "Redefinir senha";
    }
  });
});