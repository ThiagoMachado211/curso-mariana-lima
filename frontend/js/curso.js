requireStudent();

const modulesList = document.getElementById("modulesList");
const lessonTitle = document.getElementById("lessonTitle");
const lessonMeta = document.getElementById("lessonMeta");
const lessonDescription = document.getElementById("lessonDescription");
const markCompletedButton = document.getElementById("markCompletedButton");
const feedbackMessage = document.getElementById("feedbackMessage");
const courseProgressText = document.getElementById("courseProgressText");
const logoutButton = document.getElementById("logoutButton");
const courseProgressFill = document.getElementById("courseProgressFill");

const videoMode = document.getElementById("videoMode");
const pdfMode = document.getElementById("pdfMode");
const lessonPlayer = document.getElementById("lessonPlayer");

const pdfLessonTitle = document.getElementById("pdfLessonTitle");
const pdfLessonMeta = document.getElementById("pdfLessonMeta");
const pdfLessonDescription = document.getElementById("pdfLessonDescription");
const pdfButtonsContainer = document.getElementById("pdfButtonsContainer");
const courseMainContent = document.getElementById("courseMainContent");

let currentCourse = null;
let currentLesson = null;

logoutButton?.addEventListener("click", logout);

function showFeedback(message, type = "success") {
  if (!feedbackMessage) return;

  feedbackMessage.textContent = message;
  feedbackMessage.className = `feedback ${type}`;
  feedbackMessage.classList.remove("hidden");

  setTimeout(() => {
    feedbackMessage.classList.add("hidden");
  }, 4000);
}

function getCourseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("course_id");
}

async function resolveCourseId() {
  const courseIdFromUrl = getCourseIdFromUrl();
  if (courseIdFromUrl) {
    localStorage.setItem("course_id", courseIdFromUrl);
    return courseIdFromUrl;
  }

  const courseIdFromStorage = localStorage.getItem("course_id");
  if (courseIdFromStorage) {
    return courseIdFromStorage;
  }

  const courses = await apiRequest("/student/courses");

  if (!Array.isArray(courses) || courses.length === 0) {
    throw new Error("Nenhum curso encontrado para este aluno.");
  }

  const firstCourse = courses[0];
  localStorage.setItem("course_id", firstCourse.id);
  return firstCourse.id;
}

function normalizeEmbedUrl(url) {
  if (!url) return "";

  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url;
}

function findLessonById(lessonId) {
  if (!currentCourse?.modules) return null;

  for (const module of currentCourse.modules) {
    for (const lesson of module.lessons || []) {
      if (String(lesson.id) === String(lessonId)) {
        return lesson;
      }
    }
  }

  return null;
}

function updateProgressUI(progress) {
  if (!courseProgressText) return;

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

function renderPdfButtons(lesson) {
  if (!pdfButtonsContainer) return;

  pdfButtonsContainer.innerHTML = "";

  if (lesson.pdf_url && (!lesson.pdfs || lesson.pdfs.length === 0)) {
    const link = document.createElement("a");
    link.href = lesson.pdf_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "pdf-action-btn";
    link.textContent = "Abrir PDF";
    pdfButtonsContainer.appendChild(link);
    return;
  }

  if (Array.isArray(lesson.pdfs) && lesson.pdfs.length > 0) {
    lesson.pdfs
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((pdf, index) => {
        const link = document.createElement("a");
        link.href = pdf.pdf_url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "pdf-action-btn";
        link.textContent = pdf.title?.trim() || `PDF ${index + 1}`;
        pdfButtonsContainer.appendChild(link);
      });
    return;
  }

  const emptyMessage = document.createElement("p");
  emptyMessage.className = "pdf-empty-message";
  emptyMessage.textContent = "Nenhum PDF disponível para esta aula.";
  pdfButtonsContainer.appendChild(emptyMessage);
}

function updateCompleteButtonState() {
  if (!markCompletedButton) return;

  if (!currentLesson) {
    markCompletedButton.classList.add("hidden");
    return;
  }

  const hasVideo = !!(currentLesson.video_embed_url && currentLesson.video_embed_url.trim() !== "");

  markCompletedButton.classList.remove("hidden");
  markCompletedButton.disabled = false;

  if (hasVideo) {
    markCompletedButton.textContent = currentLesson.completed
      ? "Desmarcar aula concluída"
      : "Marcar como concluída";
  } else {
    markCompletedButton.textContent = currentLesson.completed
      ? "Desmarcar material estudado"
      : "Marcar material como estudado";
  }
}

function renderLesson(lesson) {
  const hasVideo = !!(lesson.video_embed_url && lesson.video_embed_url.trim() !== "");

  if (lessonTitle) {
    lessonTitle.textContent = lesson.title || "Sem título";
  }

  if (lessonMeta) {
    if (hasVideo) {
      lessonMeta.textContent = lesson.completed ? "Aula concluída ✔" : "Aula em andamento";
    } else {
      lessonMeta.textContent = lesson.completed ? "Material estudado ✔" : "Material pendente";
    }
  }

  if (lessonDescription) {
    lessonDescription.textContent = "";
    lessonDescription.classList.add("hidden");
  }

  if (hasVideo) {
    videoMode?.classList.remove("hidden");
    pdfMode?.classList.add("hidden");
    courseMainContent?.classList.remove("pdf-only");

    if (lessonPlayer) {
      lessonPlayer.src = normalizeEmbedUrl(lesson.video_embed_url);
    }
  } else {
    videoMode?.classList.add("hidden");
    pdfMode?.classList.remove("hidden");
    courseMainContent?.classList.add("pdf-only");

    if (lessonPlayer) {
      lessonPlayer.src = "";
    }

    if (pdfLessonTitle) {
      pdfLessonTitle.textContent = lesson.title || "Sem título";
    }

    if (pdfLessonMeta) {
      pdfLessonMeta.textContent = lesson.completed ? "Material estudado ✔" : "Material pendente";
      pdfLessonMeta.classList.remove("hidden");
    }

    if (pdfLessonDescription) {
      pdfLessonDescription.textContent = "";
      pdfLessonDescription.classList.add("hidden");
    }

    renderPdfButtons(lesson);
  }

  updateCompleteButtonState();
}

function selectLesson(lesson) {
  currentLesson = lesson;

  document.querySelectorAll(".lesson-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.lessonId == lesson.id);
  });

  renderLesson(lesson);
}

function renderModules(modules) {
  if (!modulesList) return;

  if (!modules || modules.length === 0) {
    modulesList.innerHTML = `<div class="sidebar-loading">Nenhum módulo encontrado.</div>`;
    return;
  }

  modulesList.innerHTML = modules
    .sort((a, b) => a.order - b.order)
    .map((module) => {
      const lessonsHtml = (module.lessons || [])
        .sort((a, b) => a.order - b.order)
        .map((lesson, lessonIndex) => `
          <div class="lesson-item" data-lesson-id="${lesson.id}" data-module-id="${module.id}">
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
              <strong>${module.title}</strong>
              <span>${(module.lessons || []).length} aula(s)</span>
            </div>
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

function recomputeAndRenderProgressFromCurrentCourse() {
  const allLessons = (currentCourse?.modules || []).flatMap((module) => module.lessons || []);
  const completedLessons = allLessons.filter((lesson) => lesson.completed).length;
  const totalLessons = allLessons.length;
  const percentage = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  updateProgressUI({
    completed_lessons: completedLessons,
    total_lessons: totalLessons,
    percentage,
  });
}

async function loadCourse() {
  try {
    const courseId = await resolveCourseId();
    const course = await apiRequest(`/student/courses/${courseId}`);

    currentCourse = course;
    document.title = `${course.title} | Plataforma`;

    renderModules(course.modules || []);
    updateProgressUI(course.progress);
    autoSelectFirstLesson(course);
  } catch (error) {
    console.error("Erro ao carregar curso:", error);

    if (modulesList) {
      modulesList.innerHTML = `<div class="sidebar-loading">Erro ao carregar o curso.</div>`;
    }

    showFeedback(error.message || "Erro ao carregar curso.", "error");
  }
}

markCompletedButton?.addEventListener("click", async () => {
  if (!currentLesson) return;

  try {
    markCompletedButton.disabled = true;
    markCompletedButton.textContent = "Salvando...";

    const endpoint = currentLesson.completed
      ? `/student/lessons/${currentLesson.id}/uncomplete`
      : `/student/lessons/${currentLesson.id}/complete`;

    await apiRequest(endpoint, {
      method: "POST",
    });

    if (currentCourse?.modules) {
      for (const module of currentCourse.modules) {
        for (const lesson of module.lessons || []) {
          if (String(lesson.id) === String(currentLesson.id)) {
            lesson.completed = !lesson.completed;
            currentLesson = lesson;
          }
        }
      }
    }

    renderModules(currentCourse.modules || []);
    selectLesson(currentLesson);
    recomputeAndRenderProgressFromCurrentCourse();

    const hasVideo = !!(currentLesson.video_embed_url && currentLesson.video_embed_url.trim() !== "");
    const successMessage = hasVideo
      ? (currentLesson.completed ? "Aula marcada como concluída." : "Aula desmarcada com sucesso.")
      : (currentLesson.completed ? "Material marcado como estudado." : "Material desmarcado com sucesso.");

    showFeedback(successMessage, "success");
  } catch (error) {
    console.error("Erro ao atualizar status da aula:", error);
    showFeedback(error.message || "Erro ao atualizar status da aula.", "error");
    updateCompleteButtonState();
  } finally {
    if (markCompletedButton) {
      markCompletedButton.disabled = false;
      updateCompleteButtonState();
    }
  }
});

loadCourse();