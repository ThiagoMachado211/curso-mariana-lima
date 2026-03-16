document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const errorBox = document.getElementById("registerError");
  const successBox = document.getElementById("registerSuccess");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorBox.textContent = "";
    successBox.textContent = "";

    const nameInput = document.getElementById("name") || document.getElementById("nome");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    const name = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";

    if (!name || !email || !password || !confirmPassword) {
      errorBox.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }

    if (password !== confirmPassword) {
      errorBox.textContent = "As senhas não coincidem.";
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erro ao cadastrar.");
      }

      successBox.textContent = "Cadastro realizado com sucesso. Redirecionando para o login...";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } catch (error) {
      errorBox.textContent = error.message || "Falha na comunicação com o servidor.";
      console.error("Erro no cadastro:", error);
    }
  });
});
