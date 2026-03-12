document.addEventListener("DOMContentLoaded", () => {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  const logoutButton = document.getElementById("logoutButton");
  const tokenPreview = document.getElementById("tokenPreview");

  if (tokenPreview) {
    const token = getToken();
    tokenPreview.textContent = token ? `${token.substring(0, 40)}...` : "Sem token";
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      removeToken();
      window.location.href = "login.html";
    });
  }
});