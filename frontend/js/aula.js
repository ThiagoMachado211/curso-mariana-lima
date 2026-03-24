let currentCourse = null;
let currentModule = null;
let currentModuleName = "Módulo";

let currentLesson = null;
let moduleLessons = [];

function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function showMessage(message) {
  const container = document.getElementById("message-container");
  if (container) {
    container.innerHTML = `<div class="message">${message}</div>`;
  }
}

function normalizeVideoUrl(url) {
  if (!url) return "";

  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  if (url.includes("youtu.be/")) {
    const id = url.split("/").pop();
    return `https://www.youtube.com/embed/${id}`;
  }

  if (url.includes("vimeo.com/") && !url.includes("player.vimeo.com/video/")) {
    const id = url.split("/").pop();
    return `https://player.vimeo.com/video/${id}`;
  }

  return url;
}

async function loadCourseContext(courseId) {
  if (!courseId) return null;

  try {
    const course = await apiRequest(`/student/courses/${courseId}`);
    currentCourse = course;
    return course;
  } catch (error) {
    console.error("Erro ao carregar curso:", error);
    return null;
  }
}

async function loadModuleContext(moduleId) {
  if (!moduleId) return null;

  try {
    const module = await apiRequest(`/student/modules/${moduleId}`);
    currentModule = module;
    currentModuleName = module?.title || "Módulo";
    return module;
  } catch (error) {
    console.error("Erro ao carregar módulo:", error);
    return null;
  }
}

async function loadLessonPage() {
  const lessonId = getQueryParam("id");
  const moduleId = getQueryParam("module_id");
  const courseId = getQueryParam("course_id");

  if (!lessonId) {
    showMessage("ID da aula não informado.");
    return;
  }

  try {
    if (courseId) {
      await loadCourseContext(courseId);
    }

    if (moduleId) {
      await loadModuleContext(moduleId);
    }

    currentLesson = await apiRequest(`/student/lessons/${lessonId}`);
    if (!currentLesson) return;

    renderLesson(currentLesson);
    bindTopButtons(moduleId, courseId);

    if (moduleId) {
      moduleLessons = await apiRequest(`/student/modules/${moduleId}/lessons`);

      if (moduleLessons) {
        renderSidebarLessons(moduleLessons, lessonId, moduleId, courseId);
        bindPrevNextButtons(moduleLessons, lessonId, moduleId, courseId);
      }
    } else {
      renderSidebarWithoutModule();
    }

    renderLessonHeader(currentLesson);
    renderBreadcrumb(courseId, moduleId, currentLesson);
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Erro ao carregar aula.");
  }
}

function renderLessonHeader(lesson) {
  const topEl = document.getElementById("lesson-context-top");
  const titleEl = document.getElementById("lesson-context-title");
  const oldTitleEl = document.getElementById("lesson-title");
  const oldMetaEl = document.getElementById("lesson-meta");

  const topParts = [];

  if (currentCourse?.title) {
    topParts.push(`Curso: ${currentCourse.title}`);
  }

  if (currentModuleName) {
    topParts.push(`Módulo: ${currentModuleName}`);
  }

  if (lesson?.order !== undefined && lesson?.order !== null) {
    topParts.push(`Aula ${lesson.order}`);
  }

  if (topEl) {
    topEl.textContent = topParts.join(" • ");
  }

  if (titleEl) {
    titleEl.textContent = lesson?.title || "Aula";
  }

  if (oldTitleEl) {
    oldTitleEl.style.display = "none";
  }

  if (oldMetaEl) {
    oldMetaEl.style.display = "none";
  }
}

function renderLesson(lesson) {
  const titleEl = document.getElementById("lesson-title");
  const metaEl = document.getElementById("lesson-meta");

  if (titleEl) {
    titleEl.textContent = lesson.title || "Aula";
  }

  if (metaEl) {
    metaEl.textContent = `Ordem da aula: ${lesson.order ?? "-"}`;
  }

  renderVideo(lesson.video_embed_url);
  renderPdf(lesson.pdf_url);
}

function renderBreadcrumb(courseId, moduleId, lesson) {
  const el = document.getElementById("breadcrumb");
  if (!el) return;

  const courseLabel = currentCourse?.title || "Curso";
  const moduleLabel = currentModuleName || "Módulo";
  const lessonLabel = lesson?.title || "Aula";

  el.innerHTML = `
    <span style="cursor:pointer" onclick="goToCursos()">Cursos</span>
    >
    <span style="cursor:pointer" onclick="goToCurso('${courseId}')">${courseLabel}</span>
    >
    <span style="cursor:pointer" onclick="goToModulo('${moduleId}', '${courseId}')">${moduleLabel}</span>
    >
    <strong>${lessonLabel}</strong>
  `;
}

function goToCursos() {
  window.location.href = "cursos.html";
}

function goToCurso(courseId) {
  window.location.href = `curso.html?id=${courseId}`;
}

function goToModulo(moduleId, courseId) {
  window.location.href = `aulas.html?module_id=${moduleId}&course_id=${courseId}`;
}

function renderVideo(videoUrl) {
  const container = document.getElementById("video-container");
  if (!container) return;

  const embedUrl = normalizeVideoUrl(videoUrl);

  if (!embedUrl) {
    container.innerHTML = `<div class="empty-video">Nenhum vídeo disponível para esta aula.</div>`;
    return;
  }

  container.innerHTML = `
    <iframe
      src="${embedUrl}"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      title="Vídeo da aula">
    </iframe>
  `;
}

function renderPdf(pdfUrl) {
  const container = document.getElementById("pdf-container");
  if (!container) return;

  if (!pdfUrl) {
    container.innerHTML = `<p>Nenhum PDF disponível para esta aula.</p>`;
    return;
  }

  container.innerHTML = `
    <a class="pdf-link" href="${pdfUrl}" target="_blank" rel="noopener noreferrer">
      📄 Baixar material da aula
    </a>
  `;
}

function renderSidebarLessons(lessons, currentLessonId, moduleId, courseId) {
  const container = document.getElementById("sidebar-lessons");
  if (!container) return;

  if (!lessons || lessons.length === 0) {
    container.innerHTML = "<p>Nenhuma aula cadastrada neste módulo.</p>";
    return;
  }

  container.innerHTML = lessons.map(lesson => {
    const activeClass = lesson.id === currentLessonId ? "active" : "";
    return `
      <a
        class="lesson-item ${activeClass}"
        href="aula.html?id=${lesson.id}&module_id=${moduleId}&course_id=${courseId || ""}">
        <div class="lesson-item-order">Aula ${lesson.order}</div>
        <div class="lesson-item-title">${lesson.title}</div>
      </a>
    `;
  }).join("");
}

function renderSidebarWithoutModule() {
  const container = document.getElementById("sidebar-lessons");
  if (!container) return;

  container.innerHTML =
    "<p>Lista lateral indisponível porque o module_id não foi informado.</p>";
}

function bindTopButtons(moduleId, courseId) {
  const backModuleBtn = document.getElementById("btn-back-module");
  const backCourseBtn = document.getElementById("btn-back-course");

  if (backModuleBtn) {
    backModuleBtn.addEventListener("click", () => {
      if (moduleId) {
        window.location.href = `aulas.html?module_id=${moduleId}&course_id=${courseId || ""}`;
      } else {
        window.history.back();
      }
    });
  }

  if (backCourseBtn) {
    backCourseBtn.addEventListener("click", () => {
      if (courseId) {
        window.location.href = `curso.html?id=${courseId}`;
      } else {
        window.location.href = "cursos.html";
      }
    });
  }
}

function bindPrevNextButtons(lessons, currentLessonId, moduleId, courseId) {
  const prevBtn = document.getElementById("btn-prev-lesson");
  const nextBtn = document.getElementById("btn-next-lesson");

  const currentIndex = lessons.findIndex(lesson => lesson.id === currentLessonId);

  if (prevBtn) {
    if (currentIndex <= 0) {
      prevBtn.disabled = true;
      prevBtn.style.opacity = "0.5";
      prevBtn.style.cursor = "not-allowed";
    } else {
      prevBtn.addEventListener("click", () => {
        const prevLesson = lessons[currentIndex - 1];
        window.location.href = `aula.html?id=${prevLesson.id}&module_id=${moduleId}&course_id=${courseId || ""}`;
      });
    }
  }

  if (nextBtn) {
    if (currentIndex === -1 || currentIndex >= lessons.length - 1) {
      nextBtn.disabled = true;
      nextBtn.style.opacity = "0.5";
      nextBtn.style.cursor = "not-allowed";
    } else {
      nextBtn.addEventListener("click", () => {
        const nextLesson = lessons[currentIndex + 1];
        window.location.href = `aula.html?id=${nextLesson.id}&module_id=${moduleId}&course_id=${courseId || ""}`;
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireStudent();
  if (!user) return;

  loadLessonPage();
});