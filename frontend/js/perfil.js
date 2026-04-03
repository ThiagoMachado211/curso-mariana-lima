requireStudent();

const logoutButton = document.getElementById("logoutButton");
const courseNavLink = document.getElementById("courseNavLink");

const nameField = document.getElementById("profileName");
const lastNameField = document.getElementById("profileLastName");
const emailField = document.getElementById("profileEmail");
const roleField = document.getElementById("profileRole");

logoutButton?.addEventListener("click", logout);

async function loadProfile() {
  try {
    const user = await apiRequest("/auth/me");

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    if (nameField) nameField.textContent = user.name || "-";
    if (lastNameField) lastNameField.textContent = user.last_name || "-";
    if (emailField) emailField.textContent = user.email || "-";
    if (roleField) roleField.textContent = user.role === "student" ? "Aluno" : user.role || "-";

    await ensureCourseLink();
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);

    if (nameField) nameField.textContent = "-";
    if (lastNameField) lastNameField.textContent = "-";
    if (emailField) emailField.textContent = "-";
    if (roleField) roleField.textContent = "-";
  }
}

async function ensureCourseLink() {
  try {
    let courseId = localStorage.getItem("course_id");

    if (!courseId) {
      const courses = await apiRequest("/student/courses");

      if (Array.isArray(courses) && courses.length > 0 && courses[0]?.id) {
        courseId = courses[0].id;
        localStorage.setItem("course_id", courseId);
      }
    }

    if (courseNavLink) {
      courseNavLink.href = courseId
        ? `./curso.html?course_id=${courseId}`
        : "./curso.html";
    }
  } catch (error) {
    console.error("Erro ao preparar link do curso:", error);

    if (courseNavLink) {
      courseNavLink.href = "./curso.html";
    }
  }
}

loadProfile();