let editingCourseId = null;
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

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getFormData() {
  return {
    title: document.getElementById("title")?.value.trim() || "",
    slug: document.getElementById("slug")?.value.trim() || "",
    description: document.getElementById("description")?.value.trim() || "",
    price_cents: Number(document.getElementById("price_cents")?.value || 0),
    currency: document.getElementById("currency")?.value.trim() || "BRL",
    is_active: !!document.getElementById("is_active")?.checked,
    is_published: !!document.getElementById("is_published")?.checked,
  };
}

function resetForm() {
  editingCourseId = null;

  const formTitle = document.getElementById("form-title");
  const title = document.getElementById("title");
  const slug = document.getElementById("slug");
  const description = document.getElementById("description");
  const priceCents = document.getElementById("price_cents");
  const currency = document.getElementById("currency");
  const isActive = document.getElementById("is_active");
  const isPublished = document.getElementById("is_published");

  if (formTitle) formTitle.textContent = "Novo curso";
  if (title) title.value = "";
  if (slug) slug.value = "";
  if (description) description.value = "";
  if (priceCents) priceCents.value = "";
  if (currency) currency.value = "BRL";
  if (isActive) isActive.checked = true;
  if (isPublished) isPublished.checked = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fillForm(course) {
  editingCourseId = course.id;

  const formTitle = document.getElementById("form-title");
  const title = document.getElementById("title");
  const slug = document.getElementById("slug");
  const description = document.getElementById("description");
  const priceCents = document.getElementById("price_cents");
  const currency = document.getElementById("currency");
  const isActive = document.getElementById("is_active");
  const isPublished = document.getElementById("is_published");

  if (formTitle) formTitle.textContent = "Editar curso";
  if (title) title.value = course.title || "";
  if (slug) slug.value = course.slug || "";
  if (description) description.value = course.description || "";
  if (priceCents) priceCents.value = course.price_cents ?? 0;
  if (currency) currency.value = course.currency || "BRL";
  if (isActive) isActive.checked = !!course.is_active;
  if (isPublished) isPublished.checked = !!course.is_published;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatPrice(priceCents, currency = "BRL") {
  const value = (priceCents || 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(value);
}

async function loadCourses() {
  const courses = await apiRequest("/admin/courses");
  coursesCache = courses;
  renderCourses(coursesCache);
}

function renderCourses(courses) {
  const container = document.getElementById("courses-container");
  const emptyState = document.getElementById("empty-state");

  if (!container) return;

  container.innerHTML = "";

  if (!courses || courses.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  courses.forEach((course) => {
    const activeBadge = course.is_active
      ? `<span class="badge badge-active">Ativo</span>`
      : `<span class="badge badge-inactive">Inativo</span>`;

    const publishedBadge = course.is_published
      ? `<span class="badge badge-published">Publicado</span>`
      : `<span class="badge badge-draft">Rascunho</span>`;

    const div = document.createElement("div");
    div.className = "course-card";

    div.innerHTML = `
      <div class="course-card-top">
        <div>
          <div class="course-title">${course.title}</div>
          <div class="course-description">${course.description || "Sem descrição."}</div>
          <div><strong>Slug:</strong> ${course.slug}</div>
          <div><strong>Preço:</strong> ${formatPrice(course.price_cents, course.currency)}</div>
          <div class="course-meta">
            ${activeBadge}
            ${publishedBadge}
          </div>
        </div>

        <div class="course-actions">
          <button class="secondary edit-btn" data-id="${course.id}">Editar</button>
          <button class="danger delete-btn" data-id="${course.id}">Excluir</button>
        </div>
      </div>
    `;

    container.appendChild(div);
  });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const courseId = event.target.dataset.id;
      const course = coursesCache.find((item) => item.id === courseId);
      if (course) fillForm(course);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const courseId = event.target.dataset.id;

      if (!confirm("Deseja excluir este curso?")) {
        return;
      }

      try {
        await apiRequest(`/admin/courses/${courseId}`, {
          method: "DELETE",
        });

        showMessage("Curso excluído com sucesso.");

        if (editingCourseId === courseId) {
          resetForm();
        }

        await loadCourses();
      } catch (error) {
        showMessage(error.message || "Erro ao excluir curso.", "error");
      }
    });
  });
}

async function saveCourse() {
  const payload = getFormData();

  if (!payload.title) {
    showMessage("Informe o título do curso.", "error");
    return;
  }

  if (!payload.slug) {
    showMessage("Informe o slug do curso.", "error");
    return;
  }

  if (payload.price_cents < 0) {
    showMessage("O preço não pode ser negativo.", "error");
    return;
  }

  if (!payload.currency) {
    showMessage("Informe a moeda do curso.", "error");
    return;
  }

  try {
    if (editingCourseId) {
      await apiRequest(`/admin/courses/${editingCourseId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      showMessage("Curso atualizado com sucesso.");
    } else {
      await apiRequest("/admin/courses", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showMessage("Curso criado com sucesso.");
    }

    resetForm();
    await loadCourses();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showMessage(error.message || "Erro ao salvar curso.", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAdmin();
  if (!user) return;

  const saveBtn = document.getElementById("save-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const titleInput = document.getElementById("title");
  const slugInput = document.getElementById("slug");
  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      logout();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveCourse);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetForm);
  }

  if (titleInput && slugInput) {
    titleInput.addEventListener("input", () => {
      if (!editingCourseId) {
        slugInput.value = slugify(titleInput.value);
      }
    });
  }

  try {
    await loadCourses();
    resetForm();
  } catch (error) {
    showMessage(error.message || "Erro ao carregar dados da página.", "error");
  }
});