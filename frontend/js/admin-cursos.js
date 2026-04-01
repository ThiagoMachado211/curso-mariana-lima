document.addEventListener("DOMContentLoaded", async () => {
  const messageBox = document.getElementById("messageBox");
  const form = document.getElementById("courseForm");
  const titleInput = document.getElementById("title");
  const slugInput = document.getElementById("slug");
  const descriptionInput = document.getElementById("description");
  const priceInput = document.getElementById("price_cents");
  const currencyInput = document.getElementById("currency");
  const isActiveInput = document.getElementById("is_active");
  const isPublishedInput = document.getElementById("is_published");
  const cancelEditButton = document.getElementById("cancelEditButton");
  const coursesList = document.getElementById("coursesList");
  const submitButton = form?.querySelector('button[type="submit"]');

  let editingCourseId = null;

  function showMessage(type, text) {
    if (!messageBox) return;
    messageBox.innerHTML = `<div class="message ${type}">${text}</div>`;
  }

  function clearMessage() {
    if (!messageBox) return;
    messageBox.innerHTML = "";
  }

  function formatPrice(priceCents) {
    const value = Number(priceCents || 0) / 100;
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function resetForm() {
    editingCourseId = null;

    if (form) form.reset();
    if (currencyInput) currencyInput.value = "BRL";
    if (isActiveInput) isActiveInput.checked = true;
    if (isPublishedInput) isPublishedInput.checked = false;
    if (submitButton) submitButton.textContent = "Salvar curso";
    if (cancelEditButton) cancelEditButton.classList.add("hidden");
  }

  function fillForm(course) {
    editingCourseId = course.id;

    titleInput.value = course.title ?? "";
    slugInput.value = course.slug ?? "";
    descriptionInput.value = course.description ?? "";
    priceInput.value = course.price_cents ?? 0;
    currencyInput.value = course.currency ?? "BRL";
    isActiveInput.checked = Boolean(course.is_active);
    isPublishedInput.checked = Boolean(course.is_published);

    if (submitButton) submitButton.textContent = "Atualizar curso";
    if (cancelEditButton) cancelEditButton.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadCourses() {
    clearMessage();

    try {
      const courses = await apiRequest("/admin/courses");

      if (!Array.isArray(courses) || courses.length === 0) {
        coursesList.innerHTML = `<p class="empty-state">Nenhum curso encontrado.</p>`;
        return;
      }

      coursesList.innerHTML = courses
        .map(
          (course) => `
            <div class="admin-list-card">
              <div class="admin-list-card-top">
                <div>
                  <div class="admin-list-card-title">${course.title ?? ""}</div>
                  <div class="admin-list-card-text">${course.description || "Sem descrição."}</div>

                  <div class="admin-list-card-meta">
                    <div><strong>Slug:</strong> ${course.slug ?? ""}</div>
                    <div><strong>Preço:</strong> ${formatPrice(course.price_cents)}</div>
                    <div><strong>Moeda:</strong> ${course.currency ?? "BRL"}</div>
                  </div>

                  <div style="margin-top: 12px;">
                    <span class="admin-soft-badge ${course.is_active ? "green" : "gray"}">
                      ${course.is_active ? "Ativo" : "Inativo"}
                    </span>

                    <span class="admin-soft-badge ${course.is_published ? "blue" : "gray"}">
                      ${course.is_published ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                </div>
              </div>

              <div class="admin-list-card-actions">
                <button type="button" data-action="edit" data-id="${course.id}">Editar</button>
                <button type="button" class="danger" data-action="delete" data-id="${course.id}">Excluir</button>
              </div>
            </div>
          `
        )
        .join("");
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      coursesList.innerHTML = `<div class="message error">Erro ao carregar cursos.</div>`;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessage();

    const payload = {
      title: titleInput.value.trim(),
      slug: slugInput.value.trim(),
      description: descriptionInput.value.trim(),
      price_cents: Number(priceInput.value || 0),
      currency: currencyInput.value.trim() || "BRL",
      is_active: isActiveInput.checked,
      is_published: isPublishedInput.checked,
    };

    if (!payload.title) {
      showMessage("error", "Informe o título do curso.");
      return;
    }

    if (!payload.slug) {
      showMessage("error", "Informe o slug do curso.");
      return;
    }

    if (!Number.isInteger(payload.price_cents) || payload.price_cents < 0) {
      showMessage("error", "Informe um preço válido em centavos.");
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = editingCourseId ? "Atualizando..." : "Salvando...";
      }

      if (editingCourseId) {
        await apiRequest(`/admin/courses/${editingCourseId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        showMessage("success", "Curso atualizado com sucesso.");
      } else {
        await apiRequest("/admin/courses", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        showMessage("success", "Curso criado com sucesso.");
      }

      resetForm();
      await loadCourses();
    } catch (error) {
      console.error("Erro ao salvar curso:", error);
      showMessage("error", error.message || "Erro ao salvar curso.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = editingCourseId ? "Atualizar curso" : "Salvar curso";
      }
    }
  }

  async function handleListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const courseId = button.dataset.id;
    if (!courseId) return;

    if (action === "edit") {
      try {
        clearMessage();
        const course = await apiRequest(`/admin/courses/${courseId}`);
        fillForm(course);
      } catch (error) {
        console.error("Erro ao carregar curso para edição:", error);
        showMessage("error", error.message || "Erro ao carregar curso.");
      }
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm("Tem certeza que deseja excluir este curso?");
      if (!confirmed) return;

      try {
        clearMessage();
        await apiRequest(`/admin/courses/${courseId}`, {
          method: "DELETE",
        });

        if (editingCourseId === courseId) {
          resetForm();
        }

        showMessage("success", "Curso excluído com sucesso.");
        await loadCourses();
      } catch (error) {
        console.error("Erro ao excluir curso:", error);
        showMessage("error", error.message || "Erro ao excluir curso.");
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

    if (coursesList) {
      coursesList.addEventListener("click", handleListClick);
    }

    resetForm();
    await loadCourses();
  } catch (error) {
    console.error("Erro ao inicializar página de cursos:", error);
    showMessage("error", "Você não tem permissão para acessar esta página.");
  }
});