document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const errorBox = document.getElementById("registerError");
  const successBox = document.getElementById("registerSuccess");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";
    successBox.textContent = "";

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!nome || !email || !telefone || !cpf || !password || !confirmPassword) {
      errorBox.textContent = "Preencha todos os campos.";
      return;
    }

    if (password !== confirmPassword) {
      errorBox.textContent = "As senhas não coincidem.";
      return;
    }

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nome,
          email,
          telefone,
          cpf,
          password,
        }),
      });

      successBox.textContent = "Conta criada com sucesso. Redirecionando...";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } catch (error) {
      errorBox.textContent = error.message;
    }
  });
});