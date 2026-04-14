requireStudent();

const logoutButton = document.getElementById("logoutButton");
const welcomeText = document.getElementById("welcomeText");

const progressPercentage = document.getElementById("progressPercentage");
const progressSummary = document.getElementById("progressSummary");
const courseProgressFill = document.getElementById("courseProgressFill");

const nextLessonTitle = document.getElementById("nextLessonTitle");
const nextLessonModule = document.getElementById("nextLessonModule");
const goToCourseButton = document.getElementById("goToCourseButton");

const moduleProgressList = document.getElementById("moduleProgressList");

const totalLessonsValue = document.getElementById("totalLessonsValue");
const completedLessonsValue = document.getElementById("completedLessonsValue");
const pendingLessonsValue = document.getElementById("pendingLessonsValue");
const pdfCountValue = document.getElementById("pdfCountValue");

const profileName = document.getElementById("profileName");
const profileLastName = document.getElementById("profileLastName");
const profileEmail = document.getElementById("profileEmail");
const profileRole = document.getElementById("profileRole");

const profileViewMode = document.getElementById("profileViewMode");
const profileEditForm = document.getElementById("profileEditForm");
const editProfileButton = document.getElementById("editProfileButton");
const cancelProfileEditButton = document.getElementById("cancelProfileEditButton");
const saveProfileButton = document.getElementById("saveProfileButton");
const profileFeedback = document.getElementById("profileFeedback");

const editName = document.getElementById("editName");
const editLastName = document.getElementById("editLastName");
const editEmail = document.getElementById("editEmail");

let currentUser = null;

logoutButton?.addEventListener("click", logout);

function formatRole(role) {
  if (role === "student") return "Aluno";
  if (role === "admin") return "Administrador";
  return role || "-";
}

function getStoredCourseId() {
  return localStorage.getItem("course_id");
}

async function resolveCourseId() {
  const courseIdFromStorage = getStoredCourseId();
  if (courseIdFromStorage) return courseIdFromStorage;

  const courses = await apiRequest("/student/courses");

  if (!Array.isArray(courses) || courses.length === 0) {
    throw new Error("Nenhum curso encontrado para este aluno.");
  }

  const firstCourse = courses[0];
  localStorage.setItem("course_id", firstCourse.id);
  return firstCourse.id;
}

function computeModuleProgress(modules) {
  return (modules || []).map((module) => {
    const lessons = module.lessons || [];
    const total = lessons.length;
    const completed = lessons.filter((lesson) => lesson.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: module.id,
      title: module.title,
      total,
      completed,
      percentage,
    };
  });
}

function findNextPendingLesson(modules) {
  for (const module of modules || []) {
    for (const lesson of module.lessons || []) {
      if (!lesson.completed) {
        return {
          lesson,
          module,
        };
      }
    }
  }

  return null;
}

function countAllPdfs(modules) {
  let total = 0;

  for (const module of modules || []) {
    for (const lesson of module.lessons || []) {
      if (Array.isArray(lesson.pdfs) && lesson.pdfs.length > 0) {
        total += lesson.pdfs.length;
      } else if (lesson.pdf_url) {
        total += 1;
      }
    }
  }

  return total;
}

function renderProgress(progress) {
  const completed = progress?.completed_lessons || 0;
  const total = progress?.total_lessons || 0;
  const percentage = progress?.percentage || 0;

  progressPercentage.textContent = `${percentage}%`;
  progressSummary.textContent = `${completed} de ${total} aulas concluídas`;
  courseProgressFill.style.width = `${percentage}%`;

  totalLessonsValue.textContent = total;
  completedLessonsValue.textContent = completed;
  pendingLessonsValue.textContent = Math.max(total - completed, 0);
}

function renderNextLesson(course) {
  const nextPending = findNextPendingLesson(course.modules || []);

  if (!nextPending) {
    nextLessonTitle.textContent = "Parabéns! Você concluiu todas as aulas.";
    nextLessonModule.textContent = "";
    goToCourseButton.textContent = "Ver curso";
    goToCourseButton.href = `curso.html?course_id=${course.id}`;
    return;
  }

  nextLessonTitle.textContent = nextPending.lesson.title;
  nextLessonModule.textContent = `Módulo: ${nextPending.module.title}`;
  goToCourseButton.textContent = "Continuar estudando";
  goToCourseButton.href = `curso.html?course_id=${course.id}`;
}

function renderModuleProgress(course) {
  const modules = computeModuleProgress(course.modules || []);

  if (!modules.length) {
    moduleProgressList.innerHTML = `<p class="dashboard-muted">Nenhum módulo encontrado.</p>`;
    return;
  }

  moduleProgressList.innerHTML = modules
    .map((module) => {
      return `
        <div class="module-progress-item">
          <div class="module-progress-item__top">
            <strong>${module.title}</strong>
            <span>${module.percentage}%</span>
          </div>

          <div class="module-progress-item__meta">
            ${module.completed}/${module.total} aulas concluídas
          </div>

          <div class="progress-bar small">
            <div class="progress-bar-fill" style="width: ${module.percentage}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderProfile(user) {
  profileName.textContent = user.name || "-";
  profileLastName.textContent = user.last_name || "-";
  profileEmail.textContent = user.email || "-";
  profileRole.textContent = formatRole(user.role);
}

function fillProfileForm(user) {
  editName.value = user.name || "";
  editLastName.value = user.last_name || "";
  editEmail.value = user.email || "";
}

function renderWelcome(user) {
  const fullName = [user.name, user.last_name].filter(Boolean).join(" ");
  welcomeText.textContent = `Bem-vindo, ${fullName || "aluno"}! Acompanhe seu progresso e continue seus estudos.`;
}

function showProfileFeedback(message, type = "success") {
  profileFeedback.textContent = message;
  profileFeedback.className = `feedback ${type}`;
  profileFeedback.classList.remove("hidden");
}

function hideProfileFeedback() {
  profileFeedback.classList.add("hidden");
}

function enterProfileEditMode() {
  if (!currentUser) return;

  fillProfileForm(currentUser);
  hideProfileFeedback();
  profileViewMode.classList.add("hidden");
  profileEditForm.classList.remove("hidden");
}

function exitProfileEditMode() {
  hideProfileFeedback();
  profileEditForm.classList.add("hidden");
  profileViewMode.classList.remove("hidden");
}

editProfileButton?.addEventListener("click", enterProfileEditMode);
cancelProfileEditButton?.addEventListener("click", exitProfileEditMode);

profileEditForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    saveProfileButton.disabled = true;
    saveProfileButton.textContent = "Salvando...";

    const payload = {
      name: editName.value.trim(),
      last_name: editLastName.value.trim(),
      email: editEmail.value.trim(),
    };

    if (!payload.name || !payload.last_name || !payload.email) {
      throw new Error("Preencha todos os campos do perfil.");
    }

    const updatedUser = await apiRequest("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    currentUser = updatedUser;

    renderProfile(updatedUser);
    renderWelcome(updatedUser);
    showProfileFeedback("Perfil atualizado com sucesso.", "success");

    setTimeout(() => {
      exitProfileEditMode();
    }, 1000);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    showProfileFeedback(error.message || "Erro ao atualizar perfil.", "error");
  } finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = "Salvar alterações";
  }
});

async function loadDashboard() {
  try {
    const [user, courseId] = await Promise.all([
      apiRequest("/auth/me"),
      resolveCourseId(),
    ]);

    currentUser = user;

    const course = await apiRequest(`/student/courses/${courseId}`);

    renderWelcome(user);
    renderProfile(user);
    renderProgress(course.progress);
    renderNextLesson(course);
    renderModuleProgress(course);

    pdfCountValue.textContent = countAllPdfs(course.modules || []);
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    welcomeText.textContent = "Não foi possível carregar os dados do dashboard.";
  }
}

loadDashboard();