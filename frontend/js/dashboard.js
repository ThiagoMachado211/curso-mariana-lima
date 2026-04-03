requireStudent();

const logoutButton = document.getElementById("logoutButton");
const welcomeText = document.getElementById("welcomeText");
const courseNavLink = document.getElementById("courseNavLink");

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

    await loadStudentCourses();
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);

    if (welcomeText) {
      welcomeText.textContent = "Erro ao carregar dados do usuário.";
    }
  }
}

async function loadStudentCourses() {
  try {
    const courses = await apiRequest("/student/courses");

    if (!Array.isArray(courses) || courses.length === 0) {
      localStorage.removeItem("course_id");
      if (courseNavLink) {
        courseNavLink.href = "./curso.html";
      }
      return;
    }

    const firstCourse = courses[0];

    if (firstCourse?.id) {
      localStorage.setItem("course_id", firstCourse.id);

      if (courseNavLink) {
        courseNavLink.href = `./curso.html?course_id=${firstCourse.id}`;
      }
    }
  } catch (error) {
    console.error("Erro ao carregar cursos do aluno:", error);

    if (courseNavLink) {
      courseNavLink.href = "./curso.html";
    }
  }
}

loadDashboard();