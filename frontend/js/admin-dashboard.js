requireAdmin();

const logoutButton = document.getElementById("logoutButton");
const totalCoursesEl = document.getElementById("totalCourses");
const totalModulesEl = document.getElementById("totalModules");
const totalLessonsEl = document.getElementById("totalLessons");
const totalUsersEl = document.getElementById("totalUsers");

logoutButton?.addEventListener("click", logout);

async function safeCount(endpoint, fallback = 0) {
  try {
    const data = await apiRequest(endpoint);

    if (Array.isArray(data)) {
      return data.length;
    }

    if (data && Array.isArray(data.items)) {
      return data.items.length;
    }

    return fallback;
  } catch (error) {
    console.error(`Erro ao carregar ${endpoint}:`, error);
    return fallback;
  }
}

async function loadAdminDashboard() {
  try {
    const [coursesCount, modulesCount, lessonsCount, usersCount] = await Promise.all([
      safeCount("/admin/courses", 0),
      safeCount("/admin/modules", 0),
      safeCount("/admin/lessons", 0),
      safeCount("/admin/users", 0),
    ]);

    if (totalCoursesEl) totalCoursesEl.textContent = coursesCount;
    if (totalModulesEl) totalModulesEl.textContent = modulesCount;
    if (totalLessonsEl) totalLessonsEl.textContent = lessonsCount;
    if (totalUsersEl) totalUsersEl.textContent = usersCount;
  } catch (error) {
    console.error("Erro ao carregar dashboard admin:", error);
  }
}

loadAdminDashboard();