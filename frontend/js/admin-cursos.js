const API_BASE = "http://localhost:8000";

let editingCourseId = null;
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

function getFormData() {
  return {
    title: document.getElementById("title").value.trim(),
    slug: document.getElementById("slug").value.trim(),
    description: document.getElementById("description").value.trim(),
    price_cents: Number(document.getElementById("price_cents").value || 0),
    currency: document.getElementById("currency").value.trim() || "BRL",
    is_active: document.getElementById("is_active").checked,
    is_published: document.getElementById("is_published").checked,
  };
}

function resetForm() {
  editingCourseId = null;

  document.getElementById("form-title").textContent = "Novo curso";
  document.getElementById("title").value = "";
  document.getElementById("slug").value = "";
  document.getElementById("description").value = "";
  document.getElementById("price_cents").value = "";
  document.getElementById("currency").value = "BRL";
  document.getElementById("is_active").checked = true;
  document.getElementById("is_published").checked = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fillForm(course) {
  editingCourseId = course.id;

  document.getElementById("form-title").textContent = "Editar curso";
  document.getElementById("title").value = course.title || "";
  document.getElementById("slug").value = course.slug || "";
  document.getElementById("description").value = course.description || "";
  document.getElementById("price_cents").value = course.price_cents ?? 0;
  document.getElementById("currency").value = course.currency || "BRL";
  document.getElementById("is_active").checked = !!course.is_active;
  document.getElementById("is_published").checked = !!course.is_published;

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
  const result = await fetchJson(`${API_BASE}/admin/courses`);
  coursesCache = result.data;
  renderCourses(coursesCache);
}

function renderCourses(courses) {
  const container = document.getElementById("courses-container");
  const emptyState = document.getElementById("empty-state");

  container.innerHTML = "";

  if (!courses || courses.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  courses.forEach(course => {
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

  document.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", (event) => {
      const courseId = event.target.dataset.id;
      const course = coursesCache.find(item => item.id === courseId);
      if (course) fillForm(course);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", async (event) => {
      const courseId = event.target.dataset.id;

      if (!confirm("Deseja excluir este curso?")) {
        return;
      }

      try {
        await fetchJson(`${API_BASE}/admin/courses/${courseId}`, {
          method: "DELETE",
        });

        showMessage("Curso excluído com sucesso.");
        if (editingCourseId === courseId) {
          resetForm();
        }
        await loadCourses();
      } catch (error) {
        showMessage(error.message, "error");
      }
    });
  });
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
      await fetchJson(`${API_BASE}/admin/courses/${editingCourseId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      showMessage("Curso atualizado com sucesso.");
    } else {
      await fetchJson(`${API_BASE}/admin/courses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showMessage("Curso criado com sucesso.");
    }

    resetForm();
    await loadCourses();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function init() {

  document.getElementById("title").addEventListener("input", () => {
    if (!editingCourseId) {
      document.getElementById("slug").value = slugify(
        document.getElementById("title").value
      );
    }
  });

  const user = await requireAdmin();
  if (!user) return;

  try {
    document.getElementById("save-btn").addEventListener("click", saveCourse);
    document.getElementById("cancel-edit-btn").addEventListener("click", resetForm);

    await loadCourses();
    resetForm();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", init);