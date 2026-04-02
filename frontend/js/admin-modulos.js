document.addEventListener("DOMContentLoaded", async () => {
  const messageBox = document.getElementById("messageBox");
  const form = document.getElementById("moduleForm");
  const courseSelect = document.getElementById("course_id");
  const titleInput = document.getElementById("title");
  const orderInput = document.getElementById("order");
  const cancelEditButton = document.getElementById("cancelEditButton");
  const modulesList = document.getElementById("modulesList");
  const submitButton = form?.querySelector('button[type="submit"]');

  let editingModuleId = null;
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
    editingModuleId = null;
    form.reset();
    submitButton.textContent = "Salvar módulo";
    cancelEditButton.classList.add("hidden");
  }

  function fillForm(module) {
    editingModuleId = module.id;
    courseSelect.value = module.course_id ?? "";
    titleInput.value = module.title ?? "";
    orderInput.value = module.order ?? "";
    submitButton.textContent = "Atualizar módulo";
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

    if (modulesCache.length === 0) {
      modulesList.innerHTML = `<p class="empty-state">Nenhum módulo encontrado.</p>`;
      return;
    }

    modulesList.innerHTML = modulesCache
      .map((module) => {
        const courseTitle =
          module.course_title ||
          coursesCache.find((course) => String(course.id) === String(module.course_id))?.title ||
          "-";

        return `
          <div class="admin-list-card">
            <div class="admin-list-card-title">${module.title ?? ""}</div>

            <div class="admin-list-card-meta">
              <div><strong>Curso:</strong> ${courseTitle}</div>
              <div><strong>Ordem:</strong> ${module.order ?? "-"}</div>
            </div>

            <div style="margin-top:12px;">
              <span class="admin-soft-badge blue">Módulo</span>
            </div>

            <div class="admin-list-card-actions">
              <button type="button" data-action="edit" data-id="${module.id}">Editar</button>
              <button type="button" class="danger" data-action="delete" data-id="${module.id}">Excluir</button>
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
      course_id: courseSelect.value,
      title: titleInput.value.trim(),
      order: Number(orderInput.value || 0),
    };

    if (!payload.course_id || !payload.title) {
      showMessage("error", "Selecione um curso e informe o título do módulo.");
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.textContent = editingModuleId ? "Atualizando..." : "Salvando...";

      if (editingModuleId) {
        await apiRequest(`/admin/modules/${editingModuleId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showMessage("success", "Módulo atualizado com sucesso.");
      } else {
        await apiRequest("/admin/modules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showMessage("success", "Módulo criado com sucesso.");
      }

      resetForm();
      await loadModules();
    } catch (error) {
      showMessage("error", error.message || "Erro ao salvar módulo.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = editingModuleId ? "Atualizar módulo" : "Salvar módulo";
    }
  }

  async function handleListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") {
      const module = modulesCache.find((item) => String(item.id) === String(id));

      if (!module) {
        showMessage("error", "Módulo não encontrado para edição.");
        return;
      }

      fillForm(module);
      return;
    }

    if (action === "delete") {
      if (!window.confirm("Tem certeza que deseja excluir este módulo?")) return;

      try {
        await apiRequest(`/admin/modules/${id}`, { method: "DELETE" });

        if (editingModuleId === id) resetForm();

        showMessage("success", "Módulo excluído com sucesso.");
        await loadModules();
      } catch (error) {
        showMessage("error", error.message || "Erro ao excluir módulo.");
      }
    }
  }

  try {
    await requireAdmin();
    form.addEventListener("submit", handleSubmit);
    cancelEditButton.addEventListener("click", resetForm);
    modulesList.addEventListener("click", handleListClick);

    resetForm();
    await loadCourses();
    await loadModules();
  } catch (error) {
    showMessage("error", error.message || "Erro ao carregar a página.");
  }
});