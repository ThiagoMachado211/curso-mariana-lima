document.addEventListener("DOMContentLoaded", async () => {
  const messageBox = document.getElementById("messageBox");
  const form = document.getElementById("moduleForm");
  const courseSelect = document.getElementById("course_id");
  const titleInput = document.getElementById("title");
  const orderInput = document.getElementById("order_index");
  const cancelEditButton = document.getElementById("cancelEditButton");
  const modulesList = document.getElementById("modulesList");
  const submitButton = form?.querySelector('button[type="submit"]');

  let editingModuleId = null;
  let coursesCache = [];

  if (!modulesList) {
    console.error("Elemento #modulesList não encontrado no HTML");
    return;
  }

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

    if (form) form.reset();
    if (submitButton) submitButton.textContent = "Salvar módulo";
    if (cancelEditButton) cancelEditButton.classList.add("hidden");
  }

  function fillForm(module) {
    editingModuleId = module.id;

    courseSelect.value = module.course_id ?? "";
    titleInput.value = module.title ?? "";
    orderInput.value = module.order_index ?? "";

    if (submitButton) submitButton.textContent = "Atualizar módulo";
    if (cancelEditButton) cancelEditButton.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadCourses() {
    try {
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
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      showMessage("error", "Erro ao carregar cursos.");
    }
  }

  async function loadModules() {
    clearMessage();

    try {
      const modules = await apiRequest("/admin/modules");

      if (!Array.isArray(modules) || modules.length === 0) {
        modulesList.innerHTML = `<p class="empty-state">Nenhum módulo encontrado.</p>`;
        return;
      }

      modulesList.innerHTML = modules
        .map((module) => {
          const courseTitle =
            module.course_title ||
            coursesCache.find((course) => course.id === module.course_id)?.title ||
            "-";

          return `
            <div class="admin-list-card">
              <div class="admin-list-card-top">
                <div>
                  <div class="admin-list-card-title">${module.title ?? ""}</div>

                  <div class="admin-list-card-meta">
                    <div><strong>Curso:</strong> ${courseTitle}</div>
                    <div><strong>Ordem:</strong> ${module.order_index ?? "-"}</div>
                  </div>

                  <div style="margin-top: 12px;">
                    <span class="admin-soft-badge blue">Módulo</span>
                  </div>
                </div>
              </div>

              <div class="admin-list-card-actions">
                <button type="button" data-action="edit" data-id="${module.id}">Editar</button>
                <button type="button" class="danger" data-action="delete" data-id="${module.id}">Excluir</button>
              </div>
            </div>
          `;
        })
        .join("");
    } catch (error) {
      console.error("Erro ao carregar módulos:", error);
      modulesList.innerHTML = `<div class="message error">Erro ao carregar módulos.</div>`;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessage();

    const payload = {
      course_id: courseSelect.value,
      title: titleInput.value.trim(),
      order_index: Number(orderInput.value || 0),
    };

    if (!payload.course_id) {
      showMessage("error", "Selecione um curso.");
      return;
    }

    if (!payload.title) {
      showMessage("error", "Informe o título do módulo.");
      return;
    }

    if (!Number.isInteger(payload.order_index) || payload.order_index < 0) {
      showMessage("error", "Informe uma ordem válida.");
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = editingModuleId ? "Atualizando..." : "Salvando...";
      }

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
      console.error("Erro ao salvar módulo:", error);
      showMessage("error", error.message || "Erro ao salvar módulo.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = editingModuleId ? "Atualizar módulo" : "Salvar módulo";
      }
    }
  }

  async function handleListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const moduleId = button.dataset.id;
    if (!moduleId) return;

    if (action === "edit") {
      try {
        clearMessage();
        const module = await apiRequest(`/admin/modules/${moduleId}`);
        fillForm(module);
      } catch (error) {
        console.error("Erro ao carregar módulo para edição:", error);
        showMessage("error", error.message || "Erro ao carregar módulo.");
      }
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm("Tem certeza que deseja excluir este módulo?");
      if (!confirmed) return;

      try {
        clearMessage();

        await apiRequest(`/admin/modules/${moduleId}`, {
          method: "DELETE",
        });

        if (editingModuleId === moduleId) {
          resetForm();
        }

        showMessage("success", "Módulo excluído com sucesso.");
        await loadModules();
      } catch (error) {
        console.error("Erro ao excluir módulo:", error);
        showMessage("error", error.message || "Erro ao excluir módulo.");
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

    if (cancelEditButton) {
      cancelEditButton.addEventListener("click", () => {
        resetForm();
        clearMessage();
      });
    }

    if (modulesList) {
      modulesList.addEventListener("click", handleListClick);
    }

    resetForm();
    await loadCourses();
    await loadModules();
  } catch (error) {
    console.error("Erro ao inicializar página de módulos:", error);
    showMessage("error", "Você não tem permissão para acessar esta página.");
  }
});