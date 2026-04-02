document.addEventListener("DOMContentLoaded", async () => {
  const messageBox = document.getElementById("messageBox");
  const logoutButton = document.getElementById("logoutButton");
  const courseContent = document.getElementById("courseContent");
  const lessonVideo = document.getElementById("lessonVideo");
  const lessonTitle = document.getElementById("lessonTitle");
  const lessonDescription = document.getElementById("lessonDescription");

  let modulesCache = [];
  let lessonsCache = [];

  function showMessage(type, text) {
    if (!messageBox) return;
    messageBox.innerHTML = `<div class="message ${type}">${text}</div>`;
  }

  function setLesson(lesson) {
    lessonTitle.textContent = lesson.title ?? "Aula";
    lessonDescription.textContent = lesson.description || "Sem descrição disponível.";
    lessonVideo.src = lesson.video_embed_url || "";
  }

  function renderCourseContent() {
    if (!modulesCache.length) {
      courseContent.innerHTML = `<p class="empty-state">Nenhum módulo encontrado.</p>`;
      return;
    }

    courseContent.innerHTML = modulesCache
      .map((module) => {
        const moduleLessons = lessonsCache
          .filter((lesson) => String(lesson.module_id) === String(module.id))
          .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

        return `
          <div class="student-section">
            <div class="student-section-title">${module.title}</div>

            <div class="student-lesson-list">
              ${
                moduleLessons.length
                  ? moduleLessons
                      .map(
                        (lesson) => `
                          <a href="#" class="student-lesson-item" data-lesson-id="${lesson.id}">
                            <div class="student-lesson-item-title">${lesson.title}</div>
                            <div class="student-lesson-item-meta">Aula ${lesson.order ?? "-"}</div>
                          </a>
                        `
                      )
                      .join("")
                  : `<p class="empty-state">Nenhuma aula neste módulo.</p>`
              }
            </div>
          </div>
        `;
      })
      .join("");
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  try {
    await requireStudent();

    // Ajuste aqui se você quiser escolher um curso específico
    const courses = await apiRequest("/student/courses");
    const firstCourse = Array.isArray(courses) && courses.length ? courses[0] : null;

    if (!firstCourse) {
      courseContent.innerHTML = `<p class="empty-state">Nenhum curso encontrado para este aluno.</p>`;
      return;
    }

    const modules = await apiRequest(`/student/courses/${firstCourse.id}/modules`);
    modulesCache = Array.isArray(modules) ? modules : [];

    const lessonsResults = await Promise.all(
      modulesCache.map((module) => apiRequest(`/student/modules/${module.id}/lessons`))
    );

    lessonsCache = lessonsResults.flatMap((result) => (Array.isArray(result) ? result : []));

    renderCourseContent();

    if (lessonsCache.length > 0) {
      const firstLesson = [...lessonsCache].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))[0];
      setLesson(firstLesson);

      const firstLink = courseContent.querySelector(`[data-lesson-id="${firstLesson.id}"]`);
      if (firstLink) firstLink.classList.add("active");
    }
  } catch (error) {
    console.error(error);
    showMessage("error", error.message || "Erro ao carregar o curso.");
  }

  courseContent.addEventListener("click", (event) => {
    const lessonLink = event.target.closest("[data-lesson-id]");
    if (!lessonLink) return;

    event.preventDefault();

    const lessonId = lessonLink.dataset.lessonId;
    const lesson = lessonsCache.find((item) => String(item.id) === String(lessonId));
    if (!lesson) return;

    courseContent
      .querySelectorAll(".student-lesson-item")
      .forEach((item) => item.classList.remove("active"));

    lessonLink.classList.add("active");
    setLesson(lesson);
  });
});