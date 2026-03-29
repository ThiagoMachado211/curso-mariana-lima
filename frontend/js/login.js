document.addEventListener("DOMContentLoaded", () => {
  console.log("1. DOM carregado");

  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");

  console.log("2. form:", form);
  console.log("3. errorBox:", errorBox);
  console.log("4. isAuthenticated existe?", typeof isAuthenticated);
  console.log("5. apiRequest existe?", typeof apiRequest);

  if (!form) {
    console.error("Form não encontrado");
    return;
  }

  try {
    if (isAuthenticated()) {
      window.location.href = "dashboard.html";
      return;
    }
  } catch (err) {
    console.error("Erro em isAuthenticated():", err);
  }

  form.addEventListener("submit", async (event) => {
    console.log("7. Submit disparado");
    event.preventDefault();

    errorBox.textContent = "";

    const email = document.getElementById("email")?.value.trim().toLowerCase() || "";
    const password = document.getElementById("password")?.value.trim() || "";

    console.log("EMAIL FINAL:", JSON.stringify(email));
    console.log("PASSWORD FINAL:", JSON.stringify(password));

    if (!email || !password) {
      errorBox.textContent = "Preencha email e senha.";
      return;
    }

    localStorage.removeItem("access_token");

    try {
      console.log("9. Antes do apiRequest");

      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      console.log("LOGIN OK:", data);

      localStorage.setItem("access_token", data.access_token);
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Erro no login:", err);
      errorBox.textContent = err.message || "Erro ao fazer login.";
    }
  });
});