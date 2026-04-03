requireAuth();

const modulesList = document.getElementById("modulesList");
const lessonPlayer = document.getElementById("lessonPlayer");
const lessonTitle = document.getElementById("lessonTitle");
const lessonMeta = document.getElementById("lessonMeta");
const lessonDescription = document.getElementById("lessonDescription");
const lessonPdfButton = document.getElementById("lessonPdfButton");
const markCompletedButton = document.getElementById("markCompletedButton");
const feedbackMessage = document.getElementById("feedbackMessage");
const courseProgressText = document.getElementById("courseProgressText");
const logoutButton = document.getElementById("logoutButton");
const courseProgressFill = document.getElementById("courseProgressFill");

let currentCourse = null;
let currentLesson = null;

logoutButton?.addEventListener("click", logout);

function showFeedback(message, type = "success") {
  feedbackMessage.textContent = message;
  feedbackMessage.className = `feedback ${type}`;
  feedbackMessage.classList.remove("hidden");

  setTimeout(() => {
    feedbackMessage.classList.add("hidden");
  }, 4000);
}

function getCourseId() {
  const params = new URLSearchParams(window.location.search);
  const courseIdFromQuery = params.get("course_id");
  const courseIdFromStorage = localStorage.getItem("course_id");
  return courseIdFromQuery || courseIdFromStorage;
}

function normalizeEmbedUrl(url) {
  if (!url) return "";

  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url;
}

function findLessonById(lessonId) {
  if (!currentCourse?.modules) return null;

  for (const module of currentCourse.modules) {
    for (const lesson of module.lessons || []) {
      if (lesson.id === lessonId) {
        return lesson;
      }
    }
  }

  return null;
}

function updateProgressUI(progress) {
  if (!progress) {
    courseProgressText.textContent = "0/0 aulas concluídas • 0%";
    if (courseProgressFill) courseProgressFill.style.width = "0%";
    return;
  }

  courseProgressText.textContent =
    `${progress.completed_lessons}/${progress.total_lessons} aulas concluídas • ${progress.percentage}%`;

  if (courseProgressFill) {
    courseProgressFill.style.width = `${progress.percentage}%`;
  }
}

function updateCompleteButtonState() {
  if (!currentLesson) {
    markCompletedButton.classList.add("hidden");
    return;
  }

  markCompletedButton.classList.remove("hidden");

  if (currentLesson.completed) {
    markCompletedButton.textContent = "Aula concluída";
    markCompletedButton.disabled = true;
  } else {
    markCompletedButton.textContent = "Marcar como concluída";
    markCompletedButton.disabled = false;
  }
}

function selectLesson(lesson) {
  currentLesson = lesson;

  document.querySelectorAll(".lesson-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.lessonId === lesson.id);
  });

  lessonPlayer.src = normalizeEmbedUrl(lesson.video_embed_url || "");
  lessonTitle.textContent = lesson.title || "Aula sem título";
  lessonMeta.textContent = lesson.completed ? "Aula concluída ✔" : "Aula em andamento";
  lessonDescription.textContent =
    lesson.description || "Esta aula não possui descrição cadastrada.";

  if (lesson.pdf_url) {
    lessonPdfButton.href = lesson.pdf_url;
    lessonPdfButton.classList.remove("hidden");
  } else {
    lessonPdfButton.classList.add("hidden");
    lessonPdfButton.removeAttribute("href");
  }

  updateCompleteButtonState();
}

function renderModules(modules) {
  if (!modules || modules.length === 0) {
    modulesList.innerHTML = `<div class="sidebar-loading">Nenhum módulo encontrado.</div>`;
    return;
  }

  modulesList.innerHTML = modules
    .sort((a, b) => a.order - b.order)
    .map((module, moduleIndex) => {
      const lessonsHtml = (module.lessons || [])
        .sort((a, b) => a.order - b.order)
        .map((lesson, lessonIndex) => `
          <div 
            class="lesson-item" 
            data-lesson-id="${lesson.id}"
            data-module-id="${module.id}"
          >
            <div class="lesson-item-title">
              ${lessonIndex + 1}. ${lesson.title}
            </div>
            <div class="lesson-item-meta ${lesson.completed ? "completed" : ""}">
              ${lesson.completed ? "Concluída ✔" : "Não concluída"}
            </div>
          </div>
        `)
        .join("");

      return `
        <div class="module-card">
          <button class="module-header" type="button">
            <div>
              <strong>${moduleIndex + 1}. ${module.title}</strong>
              <span>${(module.lessons || []).length} aula(s)</span>
            </div>
            <span>▼</span>
          </button>
          <div class="lessons-list">
            ${lessonsHtml || `<div class="lesson-item">Nenhuma aula cadastrada.</div>`}
          </div>
        </div>
      `;
    })
    .join("");

  const lessonItems = document.querySelectorAll(".lesson-item[data-lesson-id]");
  lessonItems.forEach((item) => {
    item.addEventListener("click", () => {
      const lessonId = item.dataset.lessonId;
      const lesson = findLessonById(lessonId);
      if (lesson) {
        selectLesson(lesson);
      }
    });
  });
}

function autoSelectFirstLesson(course) {
  const firstModuleWithLessons = (course.modules || []).find(
    (module) => module.lessons && module.lessons.length > 0
  );

  if (!firstModuleWithLessons) return;

  const firstLesson = [...firstModuleWithLessons.lessons].sort((a, b) => a.order - b.order)[0];
  if (firstLesson) {
    selectLesson(firstLesson);
  }
}

async function loadCourse() {
  const courseId = getCourseId();

  if (!courseId) {
    modulesList.innerHTML = `<div class="sidebar-loading">Curso não encontrado.</div>`;
    showFeedback("Nenhum course_id foi informado.", "error");
    return;
  }

  try {
    const course = await apiRequest(`/student/courses/${courseId}`);
    currentCourse = course;

    document.title = `${course.title} | Plataforma`;
    const brand = document.querySelector(".brand");
    if (brand) brand.textContent = course.title;

    renderModules(course.modules || []);
    updateProgressUI(course.progress);
    autoSelectFirstLesson(course);
  } catch (error) {
    modulesList.innerHTML = `<div class="sidebar-loading">Erro ao carregar o curso.</div>`;
    showFeedback(error.message || "Erro ao carregar curso.", "error");
  }
}

markCompletedButton?.addEventListener("click", async () => {
  if (!currentLesson) return;

  try {
    markCompletedButton.disabled = true;
    markCompletedButton.textContent = "Salvando...";

    await apiRequest(`/student/lessons/${currentLesson.id}/complete`, {
      method: "POST"
    });

    if (currentCourse?.modules) {
      for (const module of currentCourse.modules) {
        for (const lesson of module.lessons || []) {
          if (lesson.id === currentLesson.id) {
            lesson.completed = true;
            currentLesson = lesson;
          }
        }
      }
    }

    renderModules(currentCourse.modules || []);
    selectLesson(currentLesson);

    const allLessons = (currentCourse.modules || []).flatMap((module) => module.lessons || []);
    const completedLessons = allLessons.filter((lesson) => lesson.completed).length;
    const totalLessons = allLessons.length;
    const percentage = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    updateProgressUI({
      completed_lessons: completedLessons,
      total_lessons: totalLessons,
      percentage: percentage
    });

    showFeedback("Aula marcada como concluída com sucesso.", "success");
  } catch (error) {
    showFeedback(error.message || "Erro ao concluir aula.", "error");
    updateCompleteButtonState();
  }
});

loadCourse();