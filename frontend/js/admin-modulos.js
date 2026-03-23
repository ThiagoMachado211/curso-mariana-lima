const API_BASE = "http://localhost:8000";

let editingModuleId = null;
let modulesCache = [];
let coursesCache = [];

function getToken() {
  return localStorage.getItem("access_token");
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

function redirectToLogin() {
  localStorage.removeItem("access_token");
  window.location.href = "login.html";
}

function showMessage(message, type = "success") {
  const container = document.getElementById("message-container");
  container.innerHTML = `<div class="message ${type}">${message}</div>`;

  setTimeout(() => {
    container.innerHTML = "";
  }, 4000);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: authHeaders(),
  });

  if (response.status === 401) {
    redirectToLogin();
    return null;
  }

  if (response.status === 204) {
    return { ok: true, data: null };
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Erro na requisição.");
  }

  return { ok: true, data };
}

async function loadCourses() {
  const result = await fetchJson(`${API_BASE}/admin/courses`);
  coursesCache = result.data;

  const select = document.getElementById("course_id");
  select.innerHTML = `<option value="">Selecione um curso</option>`;

  coursesCache.forEach(course => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.title;
    select.appendChild(option);
  });
}

function findCourseTitle(courseId) {
  const course = coursesCache.find(item => item.id === courseId);
  return course ? course.title : courseId;
}

function getFormData() {
  return {
    course_id: document.getElementById("course_id").value,
    title: document.getElementById("title").value.trim(),
    order: Number(document.getElementById("order").value || 0),
  };
}

function resetForm() {
  editingModuleId = null;

  document.getElementById("form-title").textContent = "Novo módulo";
  document.getElementById("course_id").value = "";
  document.getElementById("title").value = "";
  document.getElementById("order").value = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fillForm(module) {
  editingModuleId = module.id;

  document.getElementById("form-title").textContent = "Editar módulo";
  document.getElementById("course_id").value = module.course_id || "";
  document.getElementById("title").value = module.title || "";
  document.getElementById("order").value = module.order ?? 0;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadModules() {
  const result = await fetchJson(`${API_BASE}/admin/modules`);
  modulesCache = result.data;
  renderModules(modulesCache);
}

function renderModules(modules) {
  const container = document.getElementById("modules-container");
  const emptyState = document.getElementById("empty-state");

  container.innerHTML = "";

  if (!modules || modules.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  modules.forEach(module => {
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

  document.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", (event) => {
      const moduleId = event.target.dataset.id;
      const module = modulesCache.find(item => item.id === moduleId);
      if (module) fillForm(module);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", async (event) => {
      const moduleId = event.target.dataset.id;

      if (!confirm("Deseja excluir este módulo?")) {
        return;
      }

      try {
        await fetchJson(`${API_BASE}/admin/modules/${moduleId}`, {
          method: "DELETE",
        });

        showMessage("Módulo excluído com sucesso.");
        if (editingModuleId === moduleId) {
          resetForm();
        }
        await loadModules();
      } catch (error) {
        showMessage(error.message, "error");
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
      await fetchJson(`${API_BASE}/admin/modules/${editingModuleId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      showMessage("Módulo atualizado com sucesso.");
    } else {
      await fetchJson(`${API_BASE}/admin/modules`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showMessage("Módulo criado com sucesso.");
    }

    resetForm();
    await loadModules();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function init() {

  const user = await requireAdmin();
  if (!user) return;

  try {
    document.getElementById("save-btn").addEventListener("click", saveModule);
    document.getElementById("cancel-edit-btn").addEventListener("click", resetForm);

    await loadCourses();
    await loadModules();
    resetForm();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", init);