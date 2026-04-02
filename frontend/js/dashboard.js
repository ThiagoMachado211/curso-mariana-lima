document.addEventListener("DOMContentLoaded", async () => {
  const welcomeText = document.getElementById("welcomeText");
  const logoutButton = document.getElementById("logoutButton");
  const messageBox = document.getElementById("messageBox");

  function showMessage(type, text) {
    if (!messageBox) return;
    messageBox.innerHTML = `<div class="message ${type}">${text}</div>`;
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      logout();
    });
  }

  try {
    const user = await requireStudent();
    welcomeText.textContent = `Bem-vindo, ${user.name}! Esta é a sua área do aluno.`;
  } catch (error) {
    console.error(error);
    showMessage("error", error.message || "Erro ao carregar dashboard.");
  }
});