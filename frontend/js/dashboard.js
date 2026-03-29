document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await apiRequest("/auth/me");

    if (user.role !== "student") {
      window.location.href = "admin-dashboard.html";
      return;
    }

  } catch (error) {
    localStorage.removeItem("access_token");
    window.location.href = "login.html";
    return;
  }

  console.log("dashboard.js carregado");

  const user = await requireAuth();
  console.log("user:", user);

  if (!user) return;

  const logoutButton = document.getElementById("logoutButton");
  console.log("logoutButton:", logoutButton);

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      console.log("CLIQUE NO LOGOUT");
      logout();
    });
  }

  try {
    renderWelcome(user);
    renderDashboardByRole(user.role);
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    logout();
  }
});

function renderWelcome(user) {
  const welcomeTitle = document.getElementById("welcome-title");
  const welcomeSubtitle = document.getElementById("welcome-subtitle");

  if (welcomeTitle) {
    welcomeTitle.textContent = `Olá, ${user.name}!`;
  }

  if (welcomeSubtitle) {
    if (user.role === "admin") {
      welcomeSubtitle.textContent =
        "Você está acessando a área administrativa da plataforma.";
    } else {
      welcomeSubtitle.textContent =
        "Continue seus estudos acessando seus cursos disponíveis.";
    }
  }
}

function renderDashboardByRole(role) {
  const adminCards = [
    "card-admin-courses",
    "card-admin-modules",
    "card-admin-lessons",
    "card-admin-enrollments",
  ];

  const studentCard = document.getElementById("card-student-courses");

  if (role === "admin") {
    adminCards.forEach((id) => {
      document.getElementById(id)?.classList.remove("hidden");
    });
  }

  if (role !== "student" && studentCard) {
    studentCard.classList.add("hidden");
  }
}