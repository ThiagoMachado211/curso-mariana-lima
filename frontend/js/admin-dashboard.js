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

    if (coursesCount) coursesCount.textContent = String((courses || []).length);
    if (modulesCount) modulesCount.textContent = String((modules || []).length);
    if (lessonsCount) lessonsCount.textContent = String((lessons || []).length);
    if (activeUsersCount) activeUsersCount.textContent = String(activeUsers.length);
    if (blockedUsersCount) blockedUsersCount.textContent = String(blockedUsers.length);
  } catch (error) {
    console.error("Erro ao carregar estatísticas do dashboard:", error);
  }
}

loadDashboardStats();