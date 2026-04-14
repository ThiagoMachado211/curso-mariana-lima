requireAdmin();

const logoutButton = document.getElementById("logoutButton");
const lessonForm = document.getElementById("lessonForm");
const lessonIdInput = document.getElementById("lessonId");
const moduleSelect = document.getElementById("moduleSelect");
const lessonTitleInput = document.getElementById("lessonTitle");
const lessonOrderInput = document.getElementById("lessonOrder");
const videoEmbedUrlInput = document.getElementById("videoEmbedUrl");
const addPdfButton = document.getElementById("addPdfButton");
const pdfList = document.getElementById("pdfList");
const lessonsList = document.getElementById("lessonsList");
const formTitle = document.getElementById("formTitle");
const cancelEditButton = document.getElementById("cancelEditButton");
const formError = document.getElementById("formError");
const formSuccess = document.getElementById("formSuccess");
const saveLessonButton = document.getElementById("saveLessonButton");

let allModules = [];
let allLessons = [];

logoutButton?.addEventListener("click", logout);

function showMessage(type, message) {
  formError.classList.add("hidden");
  formSuccess.classList.add("hidden");

  if (type === "error") {
    formError.textContent = message;
    formError.classList.remove("hidden");
  } else {
    formSuccess.textContent = message;
    formSuccess.classList.remove("hidden");
  }
}

function clearMessages() {
  formError.classList.add("hidden");
  formSuccess.classList.add("hidden");
}

function createPdfRow(pdf = { title: "", pdf_url: "", order: "" }) {
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-item-admin";

  wrapper.innerHTML = `
    <div class="form-group">
      <label>Título do PDF</label>
      <input type="text" class="pdf-title-input" maxlength="255" value="${escapeHtml(pdf.title || "")}" />
    </div>

    <div class="form-group">
      <label>URL do PDF</label>
      <input type="url" class="pdf-url-input" value="${escapeHtml(pdf.pdf_url || "")}" />
    </div>

    <div class="form-group">
      <label>Ordem</label>
      <input type="number" class="pdf-order-input" min="1" value="${escapeHtml(String(pdf.order || ""))}" />
    </div>

    <div class="form-group pdf-remove-group">
      <label>&nbsp;</label>
      <button type="button" class="secondary-btn remove-pdf-button">Remover</button>
    </div>
  `;

  const removeButton = wrapper.querySelector(".remove-pdf-button");
  removeButton.addEventListener("click", () => {
    wrapper.remove();
    syncVideoAndPdfState();
  });

  const titleInput = wrapper.querySelector(".pdf-title-input");
  const urlInput = wrapper.querySelector(".pdf-url-input");
  const orderInput = wrapper.querySelector(".pdf-order-input");

  [titleInput, urlInput, orderInput].forEach((input) => {
    input.addEventListener("input", syncVideoAndPdfState);
  });

  pdfList.appendChild(wrapper);
  syncVideoAndPdfState();
}

function getPdfRows() {
  return [...pdfList.querySelectorAll(".pdf-item-admin")];
}

function collectPdfs() {
  return getPdfRows()
    .map((row, index) => {
      const title = row.querySelector(".pdf-title-input").value.trim();
      const pdfUrl = row.querySelector(".pdf-url-input").value.trim();
      const orderRaw = row.querySelector(".pdf-order-input").value.trim();

      if (!title && !pdfUrl) return null;

      return {
        title,
        pdf_url: pdfUrl,
        order: orderRaw ? Number(orderRaw) : index + 1,
      };
    })
    .filter(Boolean);
}

function syncVideoAndPdfState() {
  const hasVideo = videoEmbedUrlInput.value.trim() !== "";
  const pdfs = collectPdfs();
  const hasPdfs = pdfs.length > 0;

  if (hasVideo) {
    addPdfButton.disabled = true;
    getPdfRows().forEach((row) => {
      row.querySelectorAll("input, button").forEach((el) => {
        if (!el.classList.contains("remove-pdf-button")) {
          el.disabled = true;
        }
      });
    });
  } else {
    addPdfButton.disabled = getPdfRows().length >= 25;
    getPdfRows().forEach((row) => {
      row.querySelectorAll("input, button").forEach((el) => {
        el.disabled = false;
      });
    });
  }

  if (hasPdfs) {
    videoEmbedUrlInput.disabled = true;
  } else {
    videoEmbedUrlInput.disabled = false;
  }

  if (getPdfRows().length >= 25) {
    addPdfButton.disabled = true;
  }
}

function resetForm() {
  lessonForm.reset();
  lessonIdInput.value = "";
  pdfList.innerHTML = "";
  formTitle.textContent = "Nova aula";
  cancelEditButton.classList.add("hidden");
  clearMessages();
  videoEmbedUrlInput.disabled = false;
  addPdfButton.disabled = false;
  syncVideoAndPdfState();
}

function validateFormData(payload) {
  const hasVideo = !!payload.video_embed_url;
  const pdfCount = payload.pdfs.length;

  if (hasVideo && pdfCount > 0) {
    throw new Error("A aula pode ter vídeo ou PDFs, mas não ambos.");
  }

  if (!hasVideo && pdfCount === 0) {
    throw new Error("A aula deve ter um vídeo ou pelo menos um PDF.");
  }

  if (pdfCount > 25) {
    throw new Error("A aula pode ter no máximo 25 PDFs.");
  }

  for (const pdf of payload.pdfs) {
    if (!pdf.title) {
      throw new Error("Todos os PDFs precisam ter título.");
    }
    if (!pdf.pdf_url) {
      throw new Error("Todos os PDFs precisam ter URL.");
    }
  }
}

function buildPayload() {
  const payload = {
    module_id: moduleSelect.value,
    title: lessonTitleInput.value.trim(),
    order: Number(lessonOrderInput.value),
    video_embed_url: videoEmbedUrlInput.value.trim() || null,
    pdfs: collectPdfs(),
  };

  validateFormData(payload);
  return payload;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderModulesOptions() {
  moduleSelect.innerHTML = `<option value="">Selecione um módulo</option>`;

  allModules
    .sort((a, b) => a.order - b.order)
    .forEach((module) => {
      const option = document.createElement("option");
      option.value = module.id;
      option.textContent = `${module.title}`;
      moduleSelect.appendChild(option);
    });
}

function renderLessonsList() {
  if (!allLessons.length) {
    lessonsList.innerHTML = `<div class="sidebar-loading">Nenhuma aula cadastrada.</div>`;
    return;
  }

  lessonsList.innerHTML = allLessons
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((lesson) => {
      const hasVideo = !!lesson.video_embed_url;
      const pdfCount = Array.isArray(lesson.pdfs)
        ? lesson.pdfs.length
        : lesson.pdf_url
          ? 1
          : 0;

      return `
        <div class="admin-item-card">
          <div class="admin-item-card__content">
            <strong>${escapeHtml(lesson.title)}</strong>
            <div>Módulo: ${escapeHtml(findModuleTitle(lesson.module_id))}</div>
            <div>Ordem: ${lesson.order}</div>
            <div>
              Tipo:
              ${hasVideo ? "Vídeo" : "PDF(s)"}
              ${!hasVideo ? `• ${pdfCount} PDF(s)` : ""}
            </div>
          </div>

          <div class="admin-item-card__actions">
            <button type="button" class="secondary-btn edit-lesson-btn" data-id="${lesson.id}">
              Editar
            </button>
            <button type="button" class="danger-btn delete-lesson-btn" data-id="${lesson.id}">
              Excluir
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".edit-lesson-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const lesson = allLessons.find((item) => String(item.id) === String(button.dataset.id));
      if (lesson) populateFormForEdit(lesson);
    });
  });

  document.querySelectorAll(".delete-lesson-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const confirmed = window.confirm("Deseja excluir esta aula?");
      if (!confirmed) return;

      try {
        await apiRequest(`/admin/lessons/${button.dataset.id}`, {
          method: "DELETE",
        });

        showMessage("success", "Aula excluída com sucesso.");
        await loadInitialData();
        resetForm();
      } catch (error) {
        showMessage("error", error.message || "Erro ao excluir aula.");
      }
    });
  });
}

function findModuleTitle(moduleId) {
  const module = allModules.find((item) => String(item.id) === String(moduleId));
  return module ? module.title : "Módulo não encontrado";
}

function populateFormForEdit(lesson) {
  lessonIdInput.value = lesson.id;
  moduleSelect.value = lesson.module_id;
  lessonTitleInput.value = lesson.title || "";
  lessonOrderInput.value = lesson.order || "";
  videoEmbedUrlInput.value = lesson.video_embed_url || "";
  pdfList.innerHTML = "";

  if (Array.isArray(lesson.pdfs) && lesson.pdfs.length > 0) {
    lesson.pdfs
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((pdf) => createPdfRow(pdf));
  } else if (lesson.pdf_url) {
    createPdfRow({
      title: "Material da aula",
      pdf_url: lesson.pdf_url,
      order: 1,
    });
  }

  formTitle.textContent = "Editar aula";
  cancelEditButton.classList.remove("hidden");
  clearMessages();
  syncVideoAndPdfState();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadModules() {
  allModules = await apiRequest("/admin/modules");
  renderModulesOptions();
}

async function loadLessons() {
  allLessons = await apiRequest("/admin/lessons");
  renderLessonsList();
}

async function loadInitialData() {
  await Promise.all([loadModules(), loadLessons()]);
}

addPdfButton?.addEventListener("click", () => {
  if (getPdfRows().length >= 25) {
    showMessage("error", "Você pode adicionar no máximo 25 PDFs.");
    return;
  }

  createPdfRow({
    title: "",
    pdf_url: "",
    order: getPdfRows().length + 1,
  });
});

videoEmbedUrlInput?.addEventListener("input", syncVideoAndPdfState);

cancelEditButton?.addEventListener("click", resetForm);

lessonForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  try {
    saveLessonButton.disabled = true;
    saveLessonButton.textContent = "Salvando...";

    const payload = buildPayload();
    const lessonId = lessonIdInput.value.trim();

    if (!payload.module_id) {
      throw new Error("Selecione um módulo.");
    }

    if (!payload.title) {
      throw new Error("Informe o título da aula.");
    }

    if (!payload.order || Number.isNaN(payload.order)) {
      throw new Error("Informe uma ordem válida para a aula.");
    }

    if (lessonId) {
      await apiRequest(`/admin/lessons/${lessonId}`, {
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

    await loadLessons();
    resetForm();
  } catch (error) {
    showMessage("error", error.message || "Erro ao salvar aula.");
  } finally {
    saveLessonButton.disabled = false;
    saveLessonButton.textContent = "Salvar aula";
  }
});

loadInitialData().catch((error) => {
  console.error("Erro ao carregar dados do admin de aulas:", error);
  showMessage("error", "Erro ao carregar módulos e aulas.");
});