document.addEventListener("DOMContentLoaded", async () => {
  const messageBox = document.getElementById("messageBox");
  const form = document.getElementById("lessonForm");
  const courseSelect = document.getElementById("course_id");
  const moduleSelect = document.getElementById("module_id");
  const titleInput = document.getElementById("title");
  const orderInput = document.getElementById("order");
  const videoInput = document.getElementById("video_embed_url");
  const pdfInput = document.getElementById("pdf_url");
  const cancelEditButton = document.getElementById("cancelEditButton");
  const lessonsList = document.getElementById("lessonsList");
  const submitButton = form?.querySelector('button[type="submit"]');

  let editingLessonId = null;
  let coursesCache = [];
  let modulesCache = [];
  let lessonsCache = [];

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
    form.reset();
    moduleSelect.innerHTML = `<option value="">Selecione um módulo</option>`;
    moduleSelect.disabled = true;
    submitButton.textContent = "Salvar aula";
    cancelEditButton.classList.add("hidden");
  }

  function fillModules(courseId, selected = "") {
    const filtered = modulesCache.filter(
      (module) => String(module.course_id) === String(courseId)
    );

    moduleSelect.innerHTML = `
      <option value="">Selecione um módulo</option>
      ${filtered
        .map(
          (module) => `
            <option value="${module.id}" ${String(module.id) === String(selected) ? "selected" : ""}>
              ${module.title}
            </option>
          `
        )
        .join("")}
    `;

    moduleSelect.disabled = filtered.length === 0;
  }

  function fillForm(lesson) {
    editingLessonId = lesson.id;
    courseSelect.value = lesson.course_id ?? "";
    fillModules(lesson.course_id, lesson.module_id);
    titleInput.value = lesson.title ?? "";
    orderInput.value = lesson.order ?? "";
    videoInput.value = lesson.video_embed_url ?? "";
    pdfInput.value = lesson.pdf_url ?? "";
    submitButton.textContent = "Atualizar aula";
    cancelEditButton.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadCourses() {
    const courses = await apiRequest("/admin/directory/courses");
    coursesCache = Array.isArray(courses) ? courses : [];

    courseSelect.innerHTML = `
      <option value="">Selecione um curso</option>
      ${coursesCache
        .map((course) => `<option value="${course.id}">${course.title}</option>`)
        .join("")}
    `;
  }

  async function loadModules() {
    const modules = await apiRequest("/admin/modules");
    modulesCache = Array.isArray(modules) ? modules : [];
  }

  async function loadLessons() {
    const lessons = await apiRequest("/admin/lessons");
    lessonsCache = Array.isArray(lessons) ? lessons : [];

    if (lessonsCache.length === 0) {
      lessonsList.innerHTML = `<p class="empty-state">Nenhuma aula encontrada.</p>`;
      return;
    }

    lessonsList.innerHTML = lessonsCache
      .map((lesson) => {
        const moduleObj = modulesCache.find(
          (module) => String(module.id) === String(lesson.module_id)
        );

        const moduleTitle = lesson.module_title || moduleObj?.title || "-";

        const courseTitle =
          lesson.course_title ||
          coursesCache.find((course) =>
            String(course.id) === String(lesson.course_id || moduleObj?.course_id)
          )?.title ||
          "-";

        return `
          <div class="admin-list-card">
            <div class="admin-list-card-title">${lesson.title ?? ""}</div>

            <div class="admin-list-card-meta">
              <div><strong>Curso:</strong> ${courseTitle}</div>
              <div><strong>Módulo:</strong> ${moduleTitle}</div>
              <div><strong>Ordem:</strong> ${lesson.order ?? "-"}</div>
              <div><strong>Vídeo:</strong> ${
                lesson.video_embed_url
                  ? `<a href="${lesson.video_embed_url}" target="_blank" rel="noopener noreferrer">Abrir vídeo</a>`
                  : "Não informado"
              }</div>
              <div><strong>PDF:</strong> ${
                lesson.pdf_url
                  ? `<a href="${lesson.pdf_url}" target="_blank" rel="noopener noreferrer">Abrir PDF</a>`
                  : "Não informado"
              }</div>
            </div>

            <div style="margin-top:12px;">
              <span class="admin-soft-badge purple">Aula</span>
            </div>

            <div class="admin-list-card-actions">
              <button type="button" data-action="edit" data-id="${lesson.id}">Editar</button>
              <button type="button" class="danger" data-action="delete" data-id="${lesson.id}">Excluir</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessage();

    const payload = {
      module_id: moduleSelect.value,
      title: titleInput.value.trim(),
      order: Number(orderInput.value || 0),
      video_embed_url: videoInput.value.trim() || null,
      pdf_url: pdfInput.value.trim() || null,
    };

    if (!courseSelect.value || !payload.module_id || !payload.title) {
      showMessage("error", "Selecione curso, módulo e informe o título da aula.");
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.textContent = editingLessonId ? "Atualizando..." : "Salvando...";

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
      showMessage("error", error.message || "Erro ao salvar aula.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = editingLessonId ? "Atualizar aula" : "Salvar aula";
    }
  }

  async function handleListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") {
      const lesson = lessonsCache.find((item) => String(item.id) === String(id));

      if (!lesson) {
        showMessage("error", "Aula não encontrada para edição.");
        return;
      }

      fillForm(lesson);
      return;
    }

    if (action === "delete") {
      if (!window.confirm("Tem certeza que deseja excluir esta aula?")) return;

      try {
        await apiRequest(`/admin/lessons/${id}`, { method: "DELETE" });

        if (editingLessonId === id) resetForm();

        showMessage("success", "Aula excluída com sucesso.");
        await loadLessons();
      } catch (error) {
        showMessage("error", error.message || "Erro ao excluir aula.");
      }
    }
  }

  try {
    await requireAdmin();

    form.addEventListener("submit", handleSubmit);

    courseSelect.addEventListener("change", () => {
      const selectedCourseId = courseSelect.value;

      if (!selectedCourseId) {
        moduleSelect.innerHTML = `<option value="">Selecione um módulo</option>`;
        moduleSelect.disabled = true;
        return;
      }

      fillModules(selectedCourseId);
    });

    cancelEditButton.addEventListener("click", resetForm);
    lessonsList.addEventListener("click", handleListClick);

    resetForm();
    await loadCourses();
    await loadModules();
    await loadLessons();
  } catch (error) {
    showMessage("error", error.message || "Erro ao carregar a página.");
  }
});