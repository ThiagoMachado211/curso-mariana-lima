document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("email");
  const button = document.getElementById("forgotPasswordButton");
  const messageBox = document.getElementById("forgotPasswordMessage");
  const errorBox = document.getElementById("forgotPasswordError");

  if (!form || !emailInput || !button || !messageBox || !errorBox) {
    console.error("Elementos da página de recuperação de senha não encontrados.");
    return;
  }

  function clearMessages() {
    messageBox.textContent = "";
    errorBox.textContent = "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();

    const email = emailInput.value.trim().toLowerCase();

    if (!email) {
      errorBox.textContent = "Informe seu email.";
      return;
    }

    button.disabled = true;
    button.textContent = "Enviando...";

    try {
      const response = await fetch("https://curso-mariana-lima.onrender.com/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Erro ao solicitar redefinição.");
      }

      messageBox.textContent =
        data?.message || "Se o email existir, você receberá instruções para redefinir a senha.";

      form.reset();
    } catch (error) {
      console.error("Erro ao solicitar redefinição:", error);
      errorBox.textContent = error.message || "Erro ao solicitar redefinição.";
    } finally {
      button.disabled = false;
      button.textContent = "Enviar instruções";
    }
  });
});