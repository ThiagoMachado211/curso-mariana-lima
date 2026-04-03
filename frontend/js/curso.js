requireStudent();

const modulesList = document.getElementById("modulesList");
const lessonPlayer = document.getElementById("lessonPlayer");
const lessonTitle = document.getElementById("lessonTitle");
const logoutButton = document.getElementById("logoutButton");

logoutButton?.addEventListener("click", logout);

let currentCourse = null;

// ==========================
// 🔑 RESOLVER COURSE ID
// ==========================
function getCourseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("course_id");
}

async function resolveCourseId() {
  // 1. URL
  let courseId = getCourseIdFromUrl();
  if (courseId) {
    localStorage.setItem("course_id", courseId);
    return courseId;
  }

  // 2. localStorage
  courseId = localStorage.getItem("course_id");
  if (courseId) return courseId;

  // 3. backend (fallback)
  const courses = await apiRequest("/student/courses");

  if (!courses || courses.length === 0) {
    throw new Error("Nenhum curso encontrado para este aluno.");
  }

  courseId = courses[0].id;
  localStorage.setItem("course_id", courseId);

  return courseId;
}

// ==========================
// 🎥 PLAYER
// ==========================
function normalizeEmbedUrl(url) {
  if (!url) return "";

  if (url.includes("watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1];
    return `https://www.youtube.com/embed/${id}`;
  }

  return url;
}

function selectLesson(lesson) {
  if (!lesson) return;

  if (lessonPlayer) {
    lessonPlayer.src = normalizeEmbedUrl(lesson.video_embed_url);
  }

  if (lessonTitle) {
    lessonTitle.textContent = lesson.title;
  }
}

// ==========================
// 📚 RENDER
// ==========================
function renderModules(modules) {
  if (!modulesList) return;

  if (!modules || modules.length === 0) {
    modulesList.innerHTML = `<p>Nenhum módulo encontrado.</p>`;
    return;
  }

  modulesList.innerHTML = modules
    .map((module) => {
      const lessons = (module.lessons || [])
        .map(
          (lesson) => `
          <div class="lesson-item" data-id="${lesson.id}">
            ${lesson.title}
          </div>
        `
        )
        .join("");

      return `
        <div class="module">
          <h4>${module.title}</h4>
          ${lessons}
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".lesson-item").forEach((item) => {
    item.addEventListener("click", () => {
      const lessonId = item.dataset.id;

      const lesson = currentCourse.modules
        .flatMap((m) => m.lessons)
        .find((l) => l.id === lessonId);

      selectLesson(lesson);
    });
  });
}

// ==========================
// 🚀 LOAD COURSE
// ==========================
async function loadCourse() {
  try {
    const courseId = await resolveCourseId();

    console.log("course_id usado:", courseId);

    const course = await apiRequest(`/student/courses/${courseId}`);

    currentCourse = course;

    renderModules(course.modules);

    // auto selecionar primeira aula
    const firstLesson = course.modules
      ?.flatMap((m) => m.lessons)
      ?.sort((a, b) => a.order - b.order)[0];

    if (firstLesson) {
      selectLesson(firstLesson);
    }

  } catch (error) {
    console.error("Erro ao carregar curso:", error);

    if (modulesList) {
      modulesList.innerHTML = `<p>Erro ao carregar curso.</p>`;
    }
  }
}

loadCourse();