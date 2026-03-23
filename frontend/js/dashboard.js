document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logout-btn");

  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  logoutBtn?.addEventListener("click", () => {
    removeToken();
    window.location.href = "login.html";
  });

  try {
    const user = await apiRequest("/auth/me");

    renderWelcome(user);
    renderDashboardByRole(user.role);
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    removeToken();
    window.location.href = "login.html";
  }
});

function renderWelcome(user) {
  const welcomeTitle = document.getElementById("welcome-title");
  const welcomeSubtitle = document.getElementById("welcome-subtitle");

  welcomeTitle.textContent = `Olá, ${user.name}!`;

  if (user.role === "admin") {
    welcomeSubtitle.textContent = "Você está acessando a área administrativa da plataforma.";
  } else {
    welcomeSubtitle.textContent = "Continue seus estudos acessando seus cursos disponíveis.";
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
    adminCards.forEach(id => {
      document.getElementById(id)?.classList.remove("hidden");
    });
  }

  if (role !== "student" && studentCard) {
    studentCard.classList.add("hidden");
  }
}