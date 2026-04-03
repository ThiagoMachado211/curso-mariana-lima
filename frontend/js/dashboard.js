requireStudent();

const logoutButton = document.getElementById("logoutButton");
const welcomeText = document.getElementById("welcomeText");

logoutButton?.addEventListener("click", logout);

async function loadDashboard() {
  try {
    const user = await apiRequest("/auth/me");

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    const fullName = `${user.name} ${user.last_name || ""}`.trim();

    if (welcomeText) {
      welcomeText.textContent = `Bem-vindo, ${fullName}! Esta é a sua área do aluno.`;
    }

  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);

    if (welcomeText) {
      welcomeText.textContent = "Erro ao carregar dados do usuário.";
    }
  }
}

loadDashboard();