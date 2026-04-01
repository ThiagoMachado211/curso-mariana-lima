document.addEventListener("DOMContentLoaded", async () => {
  const messageBox = document.getElementById("messageBox");
  const form = document.getElementById("lessonForm");

  const courseSelect = document.getElementById("course_id");
  const moduleSelect = document.getElementById("module_id");
  const titleInput = document.getElementById("title");
  const orderInput = document.getElementById("order_index");
  const videoUrlInput = document.getElementById("video_url");
  const pdfUrlInput = document.getElementById("pdf_url");

  const cancelEditButton = document.getElementById("cancelEditButton");
  const lessonsList = document.getElementById("lessonsList");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!lessonsList) {
    console.error("Elemento #lessonsList não encontrado");
    return;
  }

  let editingLessonId = null;
  let coursesCache = [];
  let modulesCache = [];

  function showMessage(type, text) {
    if (!messageBox) return;
    messageBox.innerHTML = `<div class="message ${type}">${text}</div>`;
  }

  function clearMessage() {
    if (!messageBox) return;
    messageBox.innerHTML = "";
  }

  function resetForm() {
    editingLessonId = null;

    if (form) form.reset();

    if (courseSelect) {
      courseSelect.value = "";
    }

    if (moduleSelect) {
      moduleSelect.innerHTML = `<option value="">Selecione um módulo</option>`;
      moduleSelect.disabled = true;
    }

    if (submitButton) submitButton.textContent = "Salvar aula";
    if (cancelEditButton) cancelEditButton.classList.add("hidden");
  }

  function fillModulesOptions(courseId, selectedModuleId = "") {
    const filteredModules = modulesCache.filter(
      (module) => String(module.course_id) === String(courseId)
    );

    moduleSelect.innerHTML = `
      <option value="">Selecione um módulo</option>
      ${filteredModules
        .map(
          (module) => `
            <option value="${module.id}" ${
              String(module.id) === String(selectedModuleId) ? "selected" : ""
            }>
              ${module.title}
            </option>
          `
        )
        .join("")}
    `;

    moduleSelect.disabled = filteredModules.length === 0;
  }

  function fillForm(lesson) {
    editingLessonId = lesson.id;

    courseSelect.value = lesson.course_id ?? "";
    fillModulesOptions(lesson.course_id, lesson.module_id);

    titleInput.value = lesson.title ?? "";
    orderInput.value = lesson.order_index ?? "";
    videoUrlInput.value = lesson.video_url ?? "";
    pdfUrlInput.value = lesson.pdf_url ?? "";

    if (submitButton) submitButton.textContent = "Atualizar aula";
    if (cancelEditButton) cancelEditButton.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadCourses() {
    const courses = await apiRequest("/admin/directory/courses");
    coursesCache = Array.isArray(courses) ? courses : [];

    courseSelect.innerHTML = `
      <option value="">Selecione um curso</option>
      ${coursesCache
        .map(
          (course) => `
            <option value="${course.id}">${course.title}</option>
          `
        )
        .join("")}
    `;
  }

  async function loadModules() {
    const modules = await apiRequest("/admin/modules");
    modulesCache = Array.isArray(modules) ? modules : [];
  }

  async function loadLessons() {
    clearMessage();

    try {
      const lessons = await apiRequest("/admin/lessons");

      if (!Array.isArray(lessons) || lessons.length === 0) {
        lessonsList.innerHTML = `<p class="empty-state">Nenhuma aula encontrada.</p>`;
        return;
      }

      lessonsList.innerHTML = lessons
        .map((lesson) => {
          const courseTitle =
            lesson.course_title ||
            coursesCache.find((course) => String(course.id) === String(lesson.course_id))
              ?.title ||
            "-";

          const moduleTitle =
            lesson.module_title ||
            modulesCache.find((module) => String(module.id) === String(lesson.module_id))
              ?.title ||
            "-";

          return `
            <div class="admin-list-card">
              <div class="admin-list-card-top">
                <div>
                  <div class="admin-list-card-title">${lesson.title ?? ""}</div>

                  <div class="admin-list-card-meta">
                    <div><strong>Curso:</strong> ${courseTitle}</div>
                    <div><strong>Módulo:</strong> ${moduleTitle}</div>
                    <div><strong>Ordem:</strong> ${lesson.order_index ?? "-"}</div>
                    <div><strong>Vídeo:</strong> ${
                      lesson.video_url
                        ? `<a href="${lesson.video_url}" target="_blank" rel="noopener noreferrer">Abrir vídeo</a>`
                        : "Não informado"
                    }</div>
                    <div><strong>PDF:</strong> ${
                      lesson.pdf_url
                        ? `<a href="${lesson.pdf_url}" target="_blank" rel="noopener noreferrer">Abrir PDF</a>`
                        : "Não informado"
                    }</div>
                  </div>

                  <div style="margin-top: 12px;">
                    <span class="admin-soft-badge purple">Aula</span>
                  </div>
                </div>
              </div>

              <div class="admin-list-card-actions">
                <button type="button" data-action="edit" data-id="${lesson.id}">Editar</button>
                <button type="button" class="danger" data-action="delete" data-id="${lesson.id}">Excluir</button>
              </div>
            </div>
          `;
        })
        .join("");
    } catch (error) {
      console.error("Erro ao carregar aulas:", error);
      lessonsList.innerHTML = `<div class="message error">Erro ao carregar aulas.</div>`;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessage();

    const payload = {
      module_id: moduleSelect.value,
      title: titleInput.value.trim(),
      order_index: Number(orderInput.value || 0),
      video_url: videoUrlInput.value.trim() || null,
      pdf_url: pdfUrlInput.value.trim() || null,
    };

    if (!courseSelect.value) {
      showMessage("error", "Selecione um curso.");
      return;
    }

    if (!payload.module_id) {
      showMessage("error", "Selecione um módulo.");
      return;
    }

    if (!payload.title) {
      showMessage("error", "Informe o título da aula.");
      return;
    }

    if (!Number.isInteger(payload.order_index) || payload.order_index < 0) {
      showMessage("error", "Informe uma ordem válida.");
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = editingLessonId ? "Atualizando..." : "Salvando...";
      }

      if (editingLessonId) {
        await apiRequest(`/admin/lessons/${editingLessonId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        showMessage("success", "Aula atualizada com sucesso.");
      } else {
        await apiRequest("/admin/lessons", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        showMessage("success", "Aula criada com sucesso.");
      }

      resetForm();
      await loadLessons();
    } catch (error) {
      console.error("Erro ao salvar aula:", error);
      showMessage("error", error.message || "Erro ao salvar aula.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = editingLessonId ? "Atualizar aula" : "Salvar aula";
      }
    }
  }

  async function handleListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const lessonId = button.dataset.id;
    if (!lessonId) return;

    if (action === "edit") {
      try {
        clearMessage();
        const lesson = await apiRequest(`/admin/lessons/${lessonId}`);
        fillForm(lesson);
      } catch (error) {
        console.error("Erro ao carregar aula para edição:", error);
        showMessage("error", error.message || "Erro ao carregar aula.");
      }
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm("Tem certeza que deseja excluir esta aula?");
      if (!confirmed) return;

      try {
        clearMessage();

        await apiRequest(`/admin/lessons/${lessonId}`, {
          method: "DELETE",
        });

        if (editingLessonId === lessonId) {
          resetForm();
        }

        showMessage("success", "Aula excluída com sucesso.");
        await loadLessons();
      } catch (error) {
        console.error("Erro ao excluir aula:", error);
        showMessage("error", error.message || "Erro ao excluir aula.");
      }
    }
  }

  try {
    if (typeof requireAdmin === "function") {
      await requireAdmin();
    }

    if (form) {
      form.addEventListener("submit", handleSubmit);
    }

    if (courseSelect) {
      courseSelect.addEventListener("change", () => {
        const selectedCourseId = courseSelect.value;

        if (!selectedCourseId) {
          moduleSelect.innerHTML = `<option value="">Selecione um módulo</option>`;
          moduleSelect.disabled = true;
          return;
        }

        fillModulesOptions(selectedCourseId);
      });
    }

    if (cancelEditButton) {
      cancelEditButton.addEventListener("click", () => {
        resetForm();
        clearMessage();
      });
    }

    if (lessonsList) {
      lessonsList.addEventListener("click", handleListClick);
    }

    resetForm();
    await loadCourses();
    await loadModules();
    await loadLessons();
  } catch (error) {
    console.error("Erro ao inicializar página de aulas:", error);
    showMessage("error", "Você não tem permissão para acessar esta página.");
  }
});