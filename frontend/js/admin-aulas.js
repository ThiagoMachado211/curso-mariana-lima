let editingLessonId = null;
let lessonsCache = [];
let modulesCache = [];

function showMessage(message, type = "success") {
  const container = document.getElementById("message-container");
  if (container) {
    container.innerHTML = `<div class="message ${type}">${message}</div>`;

    setTimeout(() => {
      container.innerHTML = "";
    }, 4000);
  }
}

async function loadModules() {
  const modules = await apiRequest("/admin/modules");
  modulesCache = modules;

  const select = document.getElementById("module_id");
  if (!select) return;

  select.innerHTML = `<option value="">Selecione um módulo</option>`;

  modulesCache.forEach((module) => {
    const option = document.createElement("option");
    option.value = module.id;
    option.textContent = `${module.title} (ordem ${module.order})`;
    select.appendChild(option);
  });
}

function findModuleTitle(moduleId) {
  const module = modulesCache.find((item) => item.id === moduleId);
  return module ? module.title : moduleId;
}

function getFormData() {
  return {
    module_id: document.getElementById("module_id")?.value || "",
    title: document.getElementById("title")?.value.trim() || "",
    order: Number(document.getElementById("order")?.value || 0),
    video_embed_url: document.getElementById("video_embed_url")?.value.trim() || null,
    pdf_url: document.getElementById("pdf_url")?.value.trim() || null,
  };
}

function resetForm() {
  editingLessonId = null;

  const formTitle = document.getElementById("form-title");
  const moduleId = document.getElementById("module_id");
  const title = document.getElementById("title");
  const order = document.getElementById("order");
  const videoUrl = document.getElementById("video_embed_url");
  const pdfUrl = document.getElementById("pdf_url");

  if (formTitle) formTitle.textContent = "Nova aula";
  if (moduleId) moduleId.value = "";
  if (title) title.value = "";
  if (order) order.value = "";
  if (videoUrl) videoUrl.value = "";
  if (pdfUrl) pdfUrl.value = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fillForm(lesson) {
  editingLessonId = lesson.id;

  const formTitle = document.getElementById("form-title");
  const moduleId = document.getElementById("module_id");
  const title = document.getElementById("title");
  const order = document.getElementById("order");
  const videoUrl = document.getElementById("video_embed_url");
  const pdfUrl = document.getElementById("pdf_url");

  if (formTitle) formTitle.textContent = "Editar aula";
  if (moduleId) moduleId.value = lesson.module_id || "";
  if (title) title.value = lesson.title || "";
  if (order) order.value = lesson.order ?? 0;
  if (videoUrl) videoUrl.value = lesson.video_embed_url || "";
  if (pdfUrl) pdfUrl.value = lesson.pdf_url || "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadLessons() {
  const lessons = await apiRequest("/admin/lessons");
  lessonsCache = lessons;
  renderLessons(lessonsCache);
}

function renderLessons(lessons) {
  const container = document.getElementById("lessons-container");
  const emptyState = document.getElementById("empty-state");

  if (!container) return;

  container.innerHTML = "";

  if (!lessons || lessons.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  lessons.forEach((lesson) => {
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

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const lessonId = event.target.dataset.id;
      const lesson = lessonsCache.find((item) => item.id === lessonId);
      if (lesson) fillForm(lesson);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const lessonId = event.target.dataset.id;

      if (!confirm("Deseja excluir esta aula?")) {
        return;
      }

      try {
        await apiRequest(`/admin/lessons/${lessonId}`, {
          method: "DELETE",
        });

        showMessage("Aula excluída com sucesso.");

        if (editingLessonId === lessonId) {
          resetForm();
        }

        await loadLessons();
      } catch (error) {
        showMessage(error.message || "Erro ao excluir aula.", "error");
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
      await apiRequest(`/admin/lessons/${editingLessonId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      showMessage("Aula atualizada com sucesso.");
    } else {
      await apiRequest("/admin/lessons", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showMessage("Aula criada com sucesso.");
    }

    resetForm();
    await loadLessons();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showMessage(error.message || "Erro ao salvar aula.", "error");
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
    saveBtn.addEventListener("click", saveLesson);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetForm);
  }

  try {
    await loadModules();
    await loadLessons();
    resetForm();
  } catch (error) {
    showMessage(error.message || "Erro ao carregar dados da página.", "error");
  }


});