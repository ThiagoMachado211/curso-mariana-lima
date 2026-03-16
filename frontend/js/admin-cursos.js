document.addEventListener("DOMContentLoaded", () => {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  const form = document.getElementById("courseForm");
  const feedback = document.getElementById("adminFeedback");
  const tbody = document.getElementById("coursesTableBody");

  const titleInput = document.getElementById("courseTitle");
  const slugInput = document.getElementById("courseSlug");
  const descriptionInput = document.getElementById("courseDescription");
  const priceCentsInput = document.getElementById("coursePriceCents");
  const currencyInput = document.getElementById("courseCurrency");
  const isActiveInput = document.getElementById("courseIsActive");
  const isPublishedInput = document.getElementById("courseIsPublished");

  const submitButton = document.getElementById("courseSubmitButton");
  const cancelButton = document.getElementById("courseCancelButton");

  let editingCourseId = null;

  function setError(message) {
    feedback.textContent = message;
    feedback.classList.remove("admin-success");
  }

  function setSuccess(message) {
    feedback.textContent = message;
    feedback.classList.add("admin-success");
  }

  function clearFeedback() {
    feedback.textContent = "";
    feedback.classList.remove("admin-success");
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function resetForm() {
    form.reset();
    currencyInput.value = "BRL";
    isActiveInput.checked = true;
    isPublishedInput.checked = false;
    editingCourseId = null;
    submitButton.textContent = "Salvar Curso";
    cancelButton.style.display = "none";
  }

  function fillForm(course) {
    titleInput.value = course.title || "";
    slugInput.value = course.slug || "";
    descriptionInput.value = course.description || "";
    priceCentsInput.value = course.price_cents ?? 0;
    currencyInput.value = course.currency || "BRL";
    isActiveInput.checked = !!course.is_active;
    isPublishedInput.checked = !!course.is_published;

    editingCourseId = course.id;
    submitButton.textContent = "Atualizar Curso";
    cancelButton.style.display = "inline-flex";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatPrice(cents, currency) {
    const value = (Number(cents || 0) / 100).toFixed(2);
    return `${value} ${currency || "BRL"}`;
  }

  async function loadCourses() {
    clearFeedback();

    try {
      const courses = await apiRequest("/admin/courses", {
        method: "GET",
      });

      tbody.innerHTML = "";

      if (!courses.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">Nenhum curso cadastrado.</td>
          </tr>
        `;
        return;
      }

      courses.forEach((course) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${course.id}</td>
          <td>${course.title}</td>
          <td>${course.slug}</td>
          <td>${formatPrice(course.price_cents, course.currency)}</td>
          <td>${course.currency}</td>
          <td>${course.is_active ? "Sim" : "Não"}</td>
          <td>${course.is_published ? "Sim" : "Não"}</td>
          <td>
            <div class="admin-actions">
              <button type="button" class="btn btn--green edit-course" data-id="${course.id}">Editar</button>
              <button type="button" class="btn btn--red delete-course" data-id="${course.id}">Excluir</button>
            </div>
          </td>
        `;

        row.querySelector(".edit-course").addEventListener("click", () => {
          fillForm(course);
        });

        row.querySelector(".delete-course").addEventListener("click", async () => {
          const confirmed = window.confirm(`Deseja excluir o curso "${course.title}"?`);
          if (!confirmed) return;

          try {
            await apiRequest(`/admin/courses/${course.id}`, {
              method: "DELETE",
            });

            setSuccess("Curso excluído com sucesso.");
            if (editingCourseId === course.id) {
              resetForm();
            }
            await loadCourses();
          } catch (error) {
            setError(error.message || "Erro ao excluir curso.");
          }
        });

        tbody.appendChild(row);
      });
    } catch (error) {
      setError(error.message || "Erro ao carregar cursos.");
    }
  }

  titleInput.addEventListener("blur", () => {
    if (!slugInput.value.trim()) {
      slugInput.value = slugify(titleInput.value);
    }
  });

  cancelButton.addEventListener("click", () => {
    resetForm();
    clearFeedback();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback();

    const payload = {
      title: titleInput.value.trim(),
      slug: slugInput.value.trim().toLowerCase(),
      description: descriptionInput.value.trim() || null,
      price_cents: Number(priceCentsInput.value || 0),
      is_active: isActiveInput.checked,
      is_published: isPublishedInput.checked,
      currency: currencyInput.value.trim().toUpperCase() || "BRL",
    };

    if (!payload.title || !payload.slug) {
      setError("Preencha pelo menos título e slug.");
      return;
    }

    try {
      if (editingCourseId) {
        await apiRequest(`/admin/courses/${editingCourseId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setSuccess("Curso atualizado com sucesso.");
      } else {
        await apiRequest("/admin/courses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Curso criado com sucesso.");
      }

      resetForm();
      await loadCourses();
    } catch (error) {
      setError(error.message || "Erro ao salvar curso.");
    }
  });

  loadCourses();
});