const API_BASE = "http://localhost:8000";

let editingLessonId = null;
let lessonsCache = [];
let modulesCache = [];

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

async function loadModules() {
  const result = await fetchJson(`${API_BASE}/admin/modules`);
  modulesCache = result.data;

  const select = document.getElementById("module_id");
  select.innerHTML = `<option value="">Selecione um módulo</option>`;

  modulesCache.forEach(module => {
    const option = document.createElement("option");
    option.value = module.id;
    option.textContent = `${module.title} (ordem ${module.order})`;
    select.appendChild(option);
  });
}

function findModuleTitle(moduleId) {
  const module = modulesCache.find(item => item.id === moduleId);
  return module ? module.title : moduleId;
}

function getFormData() {
  return {
    module_id: document.getElementById("module_id").value,
    title: document.getElementById("title").value.trim(),
    order: Number(document.getElementById("order").value || 0),
    video_embed_url: document.getElementById("video_embed_url").value.trim() || null,
    pdf_url: document.getElementById("pdf_url").value.trim() || null,
  };
}

function resetForm() {
  editingLessonId = null;

  document.getElementById("form-title").textContent = "Nova aula";
  document.getElementById("module_id").value = "";
  document.getElementById("title").value = "";
  document.getElementById("order").value = "";
  document.getElementById("video_embed_url").value = "";
  document.getElementById("pdf_url").value = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fillForm(lesson) {
  editingLessonId = lesson.id;

  document.getElementById("form-title").textContent = "Editar aula";
  document.getElementById("module_id").value = lesson.module_id || "";
  document.getElementById("title").value = lesson.title || "";
  document.getElementById("order").value = lesson.order ?? 0;
  document.getElementById("video_embed_url").value = lesson.video_embed_url || "";
  document.getElementById("pdf_url").value = lesson.pdf_url || "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadLessons() {
  const result = await fetchJson(`${API_BASE}/admin/lessons`);
  lessonsCache = result.data;
  renderLessons(lessonsCache);
}

function renderLessons(lessons) {
  const container = document.getElementById("lessons-container");
  const emptyState = document.getElementById("empty-state");

  container.innerHTML = "";

  if (!lessons || lessons.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  lessons.forEach(lesson => {
    const hasVideo = lesson.video_embed_url
      ? `<span class="badge">Vídeo</span>`
      : "";

    const hasPdf = lesson.pdf_url
      ? `<span class="badge">PDF</span>`
      : "";

    const videoLink = lesson.video_embed_url
      ? `<a href="${lesson.video_embed_url}" target="_blank" rel="noopener noreferrer">Abrir vídeo</a>`
      : "";

    const pdfLink = lesson.pdf_url
      ? `<a href="${lesson.pdf_url}" target="_blank" rel="noopener noreferrer">Abrir PDF</a>`
      : "";

    const div = document.createElement("div");
    div.className = "lesson-card";

    div.innerHTML = `
      <div class="lesson-card-top">
        <div>
          <div class="lesson-title">${lesson.title}</div>
          <div class="lesson-meta">
            <div><strong>Módulo:</strong> ${findModuleTitle(lesson.module_id)}</div>
            <div><strong>Ordem:</strong> ${lesson.order}</div>
          </div>

          <div>
            ${hasVideo}
            ${hasPdf}
          </div>

          <div class="links-block" style="margin-top:10px;">
            ${videoLink}
            ${pdfLink}
          </div>
        </div>

        <div class="lesson-actions">
          <button class="secondary edit-btn" data-id="${lesson.id}">Editar</button>
          <button class="danger delete-btn" data-id="${lesson.id}">Excluir</button>
        </div>
      </div>
    `;

    container.appendChild(div);
  });

  document.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", (event) => {
      const lessonId = event.target.dataset.id;
      const lesson = lessonsCache.find(item => item.id === lessonId);
      if (lesson) fillForm(lesson);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", async (event) => {
      const lessonId = event.target.dataset.id;

      if (!confirm("Deseja excluir esta aula?")) {
        return;
      }

      try {
        await fetchJson(`${API_BASE}/admin/lessons/${lessonId}`, {
          method: "DELETE",
        });

        showMessage("Aula excluída com sucesso.");
        if (editingLessonId === lessonId) {
          resetForm();
        }
        await loadLessons();
      } catch (error) {
        showMessage(error.message, "error");
      }
    });
  });
}

async function saveLesson() {
  const payload = getFormData();

  if (!payload.module_id) {
    showMessage("Selecione o módulo da aula.", "error");
    return;
  }

  if (!payload.title) {
    showMessage("Informe o título da aula.", "error");
    return;
  }

  if (payload.order < 0) {
    showMessage("A ordem da aula não pode ser negativa.", "error");
    return;
  }

  try {
    if (editingLessonId) {
      await fetchJson(`${API_BASE}/admin/lessons/${editingLessonId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      showMessage("Aula atualizada com sucesso.");
    } else {
      await fetchJson(`${API_BASE}/admin/lessons`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showMessage("Aula criada com sucesso.");
    }

    resetForm();
    await loadLessons();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function init() {

  const user = await requireAdmin();
  if (!user) return;

  try {
    document.getElementById("save-btn").addEventListener("click", saveLesson);
    document.getElementById("cancel-edit-btn").addEventListener("click", resetForm);

    await loadModules();
    await loadLessons();
    resetForm();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", init);