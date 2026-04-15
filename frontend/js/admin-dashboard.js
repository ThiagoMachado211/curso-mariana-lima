requireAuth();

const logoutButton = document.getElementById("logoutButton");

const coursesCount = document.getElementById("coursesCount");
const modulesCount = document.getElementById("modulesCount");
const lessonsCount = document.getElementById("lessonsCount");
const activeUsersCount = document.getElementById("activeUsersCount");
const blockedUsersCount = document.getElementById("blockedUsersCount");

logoutButton?.addEventListener("click", logout);

async function loadDashboardStats() {
  try {
    const [courses, modules, lessons, users] = await Promise.all([
      apiRequest("/admin/courses"),
      apiRequest("/admin/modules"),
      apiRequest("/admin/lessons"),
      apiRequest("/admin/users"),
    ]);

    const activeUsers = (users || []).filter((user) => user.is_active);
    const blockedUsers = (users || []).filter((user) => !user.is_active);

    coursesCount.textContent = String((courses || []).length);
    modulesCount.textContent = String((modules || []).length);
    lessonsCount.textContent = String((lessons || []).length);
    activeUsersCount.textContent = String(activeUsers.length);
    blockedUsersCount.textContent = String(blockedUsers.length);
  } catch (error) {
    console.error("Erro ao carregar estatísticas do dashboard:", error);
  }
}

loadDashboardStats();