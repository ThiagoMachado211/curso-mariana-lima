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
const editProfileButton = document.getElementById("editProfileButton");

logoutButton?.addEventListener("click", logout);

editProfileButton?.addEventListener("click", () => {
  alert("A edição de perfil será conectada aqui.");
});

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

function renderWelcome(user) {
  const fullName = [user.name, user.last_name].filter(Boolean).join(" ");
  welcomeText.textContent = `Bem-vindo, ${fullName || "aluno"}! Acompanhe seu progresso e continue seus estudos.`;
}

async function loadDashboard() {
  try {
    const [user, courseId] = await Promise.all([
      apiRequest("/auth/me"),
      resolveCourseId(),
    ]);

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