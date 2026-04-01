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
    form.reset();
    moduleSelect.innerHTML = `<option value="">Selecione um módulo</option>`;
    moduleSelect.disabled = true;
    submitButton.textContent = "Salvar aula";
    cancelEditButton.classList.add("hidden");
  }

  function fillModules(courseId, selected = "") {
    const filtered = modulesCache.filter((m) => String(m.course_id) === String(courseId));
    moduleSelect.innerHTML = `
      <option value="">Selecione um módulo</option>
      ${filtered.map((m) => `<option value="${m.id}" ${String(m.id) === String(selected) ? "selected" : ""}>${m.title}</option>`).join("")}
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
    courseSelect.innerHTML = `
      <option value="">Selecione um curso</option>
      ${courses.map((course) => `<option value="${course.id}">${course.title}</option>`).join("")}
    `;
  }

  async function loadModules() {
    const modules = await apiRequest("/admin/modules");
    modulesCache = Array.isArray(modules) ? modules : [];
  }

  async function loadLessons() {
    const lessons = await apiRequest("/admin/lessons");

    if (!Array.isArray(lessons) || lessons.length === 0) {
      lessonsList.innerHTML = `<p class="empty-state">Nenhuma aula encontrada.</p>`;
      return;
    }

    lessonsList.innerHTML = lessons.map((lesson) => `
      <div class="admin-list-card">
        <div class="admin-list-card-title">${lesson.title ?? ""}</div>

        <div class="admin-list-card-meta">
          <div><strong>Curso:</strong> ${lesson.course_title || "-"}</div>
          <div><strong>Módulo:</strong> ${lesson.module_title || "-"}</div>
          <div><strong>Ordem:</strong> ${lesson.order ?? "-"}</div>
          <div><strong>Vídeo:</strong> ${lesson.video_embed_url ? `<a href="${lesson.video_embed_url}" target="_blank" rel="noopener noreferrer">Abrir vídeo</a>` : "Não informado"}</div>
          <div><strong>PDF:</strong> ${lesson.pdf_url ? `<a href="${lesson.pdf_url}" target="_blank" rel="noopener noreferrer">Abrir PDF</a>` : "Não informado"}</div>
        </div>

        <div style="margin-top:12px;">
          <span class="admin-soft-badge purple">Aula</span>
        </div>

        <div class="admin-list-card-actions">
          <button type="button" data-action="edit" data-id="${lesson.id}">Editar</button>
          <button type="button" class="danger" data-action="delete" data-id="${lesson.id}">Excluir</button>
        </div>
      </div>
    `).join("");
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
      const lesson = await apiRequest(`/admin/lessons/${id}`);
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