document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const token =
        data.access_token || data.token || data.jwt || data.accessToken;

      if (!token) {
        throw new Error("Token não retornado pelo backend.");
      }

      saveToken(token);
      window.location.href = "dashboard.html";
    } catch (error) {
      errorBox.textContent = error.message;
    }
  });
});