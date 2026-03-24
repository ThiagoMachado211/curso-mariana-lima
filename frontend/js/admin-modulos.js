let editingModuleId = null;
let modulesCache = [];
let coursesCache = [];

function showMessage(message, type = "success") {
  const container = document.getElementById("message-container");
  if (container) {
    container.innerHTML = `<div class="message ${type}">${message}</div>`;

    setTimeout(() => {
      container.innerHTML = "";
    }, 4000);
  }
}

async function loadCourses() {
  const courses = await apiRequest("/admin/courses");
  coursesCache = courses;

  const select = document.getElementById("course_id");
  if (!select) return;

  select.innerHTML = `<option value="">Selecione um curso</option>`;

  coursesCache.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.title;
    select.appendChild(option);
  });
}

function findCourseTitle(courseId) {
  const course = coursesCache.find((item) => item.id === courseId);
  return course ? course.title : courseId;
}

function getFormData() {
  return {
    course_id: document.getElementById("course_id")?.value || "",
    title: document.getElementById("title")?.value.trim() || "",
    order: Number(document.getElementById("order")?.value || 0),
  };
}

function resetForm() {
  editingModuleId = null;

  const formTitle = document.getElementById("form-title");
  const courseId = document.getElementById("course_id");
  const title = document.getElementById("title");
  const order = document.getElementById("order");

  if (formTitle) formTitle.textContent = "Novo módulo";
  if (courseId) courseId.value = "";
  if (title) title.value = "";
  if (order) order.value = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fillForm(module) {
  editingModuleId = module.id;

  const formTitle = document.getElementById("form-title");
  const courseId = document.getElementById("course_id");
  const title = document.getElementById("title");
  const order = document.getElementById("order");

  if (formTitle) formTitle.textContent = "Editar módulo";
  if (courseId) courseId.value = module.course_id || "";
  if (title) title.value = module.title || "";
  if (order) order.value = module.order ?? 0;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadModules() {
  const modules = await apiRequest("/admin/modules");
  modulesCache = modules;
  renderModules(modulesCache);
}

function renderModules(modules) {
  const container = document.getElementById("modules-container");
  const emptyState = document.getElementById("empty-state");

  if (!container) return;

  container.innerHTML = "";

  if (!modules || modules.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  modules.forEach((module) => {
    const div = document.createElement("div");
    div.className = "module-card";

    div.innerHTML = `
      <div class="module-card-top">
        <div>
          <div class="module-title">${module.title}</div>
          <div class="module-meta">
            <div><strong>Curso:</strong> ${findCourseTitle(module.course_id)}</div>
            <div><strong>Ordem:</strong> ${module.order}</div>
          </div>
          <span class="badge">Módulo</span>
        </div>

        <div class="module-actions">
          <button class="secondary edit-btn" data-id="${module.id}">Editar</button>
          <button class="danger delete-btn" data-id="${module.id}">Excluir</button>
        </div>
      </div>
    `;

    container.appendChild(div);
  });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const moduleId = event.target.dataset.id;
      const module = modulesCache.find((item) => item.id === moduleId);
      if (module) fillForm(module);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const moduleId = event.target.dataset.id;

      if (!confirm("Deseja excluir este módulo?")) {
        return;
      }

      try {
        await apiRequest(`/admin/modules/${moduleId}`, {
          method: "DELETE",
        });

        showMessage("Módulo excluído com sucesso.");

        if (editingModuleId === moduleId) {
          resetForm();
        }

        await loadModules();
      } catch (error) {
        showMessage(error.message || "Erro ao excluir módulo.", "error");
      }
    });
  });
}

async function saveModule() {
  const payload = getFormData();

  if (!payload.course_id) {
    showMessage("Selecione o curso do módulo.", "error");
    return;
  }

  if (!payload.title) {
    showMessage("Informe o título do módulo.", "error");
    return;
  }

  if (payload.order < 0) {
    showMessage("A ordem do módulo não pode ser negativa.", "error");
    return;
  }

  try {
    if (editingModuleId) {
      await apiRequest(`/admin/modules/${editingModuleId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      showMessage("Módulo atualizado com sucesso.");
    } else {
      await apiRequest("/admin/modules", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showMessage("Módulo criado com sucesso.");
    }

    resetForm();
    await loadModules();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showMessage(error.message || "Erro ao salvar módulo.", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAdmin();
  if (!user) return;

  const saveBtn = document.getElementById("save-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      logout();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveModule);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetForm);
  }

  try {
    await loadCourses();
    await loadModules();
    resetForm();
  } catch (error) {
    showMessage(error.message || "Erro ao carregar dados da página.", "error");
  }
});