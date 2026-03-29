document.addEventListener("DOMContentLoaded", async () => {
  const logoutButton = document.getElementById("logoutButton");
  const countCourses = document.getElementById("countCourses");
  const countModules = document.getElementById("countModules");
  const countLessons = document.getElementById("countLessons");
  const countUsers = document.getElementById("countUsers");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      if (typeof logout === "function") {
        logout();
      } else {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
      }
    });
  }

  try {
    if (typeof requireAdmin === "function") {
      await requireAdmin();
    }

    const [courses, modules, lessons, users] = await Promise.all([
      apiRequest("/admin/courses"),
      apiRequest("/admin/modules"),
      apiRequest("/admin/lessons"),
      apiRequest("/admin/directory/users"),
    ]);

    countCourses.textContent = Array.isArray(courses) ? courses.length : 0;
    countModules.textContent = Array.isArray(modules) ? modules.length : 0;
    countLessons.textContent = Array.isArray(lessons) ? lessons.length : 0;
    countUsers.textContent = Array.isArray(users) ? users.length : 0;
  } catch (error) {
    console.error("Erro ao carregar dashboard admin:", error);

    countCourses.textContent = "-";
    countModules.textContent = "-";
    countLessons.textContent = "-";
    countUsers.textContent = "-";
  }
});