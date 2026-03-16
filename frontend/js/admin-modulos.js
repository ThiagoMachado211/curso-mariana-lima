document.addEventListener("DOMContentLoaded", () => {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  const form = document.getElementById("moduleForm");
  const feedback = document.getElementById("adminFeedback");
  const tbody = document.getElementById("modulesTableBody");

  const courseSelect = document.getElementById("moduleCourse");
  const orderInput = document.getElementById("moduleOrder");
  const titleInput = document.getElementById("moduleTitle");

  const submitButton = document.getElementById("moduleSubmitButton");
  const cancelButton = document.getElementById("moduleCancelButton");

  let editingModuleId = null;
  let coursesMap = new Map();

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

  function resetForm() {
    form.reset();
    editingModuleId = null;
    submitButton.textContent = "Salvar Módulo";
    cancelButton.style.display = "none";
  }

  function fillForm(module) {
    courseSelect.value = module.course_id;
    orderInput.value = module.order;
    titleInput.value = module.title;

    editingModuleId = module.id;
    submitButton.textContent = "Atualizar Módulo";
    cancelButton.style.display = "inline-flex";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadCourses() {
    const courses = await apiRequest("/admin/courses", {
      method: "GET",
    });

    coursesMap = new Map(courses.map((course) => [course.id, course]));
    courseSelect.innerHTML = "";

    if (!courses.length) {
      courseSelect.innerHTML = `<option value="">Nenhum curso cadastrado</option>`;
      return;
    }

    courses.forEach((course) => {
      const option = document.createElement("option");
      option.value = course.id;
      option.textContent = course.title;
      courseSelect.appendChild(option);
    });
  }

  async function loadModules() {
    clearFeedback();

    try {
      const modules = await apiRequest("/admin/modules", {
        method: "GET",
      });

      tbody.innerHTML = "";

      if (!modules.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5">Nenhum módulo cadastrado.</td>
          </tr>
        `;
        return;
      }

      modules.forEach((module) => {
        const row = document.createElement("tr");
        const course = coursesMap.get(module.course_id);

        row.innerHTML = `
          <td>${module.id}</td>
          <td>${course ? course.title : module.course_id}</td>
          <td>${module.order}</td>
          <td>${module.title}</td>
          <td>
            <div class="admin-actions">
              <button type="button" class="btn btn--green edit-module">Editar</button>
              <button type="button" class="btn btn--red delete-module">Excluir</button>
            </div>
          </td>
        `;

        row.querySelector(".edit-module").addEventListener("click", () => {
          fillForm(module);
        });

        row.querySelector(".delete-module").addEventListener("click", async () => {
          const confirmed = window.confirm(`Deseja excluir o módulo "${module.title}"?`);
          if (!confirmed) return;

          try {
            await apiRequest(`/admin/modules/${module.id}`, {
              method: "DELETE",
            });

            setSuccess("Módulo excluído com sucesso.");
            if (editingModuleId === module.id) {
              resetForm();
            }
            await loadModules();
          } catch (error) {
            setError(error.message || "Erro ao excluir módulo.");
          }
        });

        tbody.appendChild(row);
      });
    } catch (error) {
      setError(error.message || "Erro ao carregar módulos.");
    }
  }

  cancelButton.addEventListener("click", () => {
    resetForm();
    clearFeedback();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback();

    const payload = {
      course_id: courseSelect.value,
      title: titleInput.value.trim(),
      order: Number(orderInput.value || 0),
    };

    if (!payload.course_id || !payload.title || !payload.order) {
      setError("Preencha curso, título e ordem.");
      return;
    }

    try {
      if (editingModuleId) {
        await apiRequest(`/admin/modules/${editingModuleId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setSuccess("Módulo atualizado com sucesso.");
      } else {
        await apiRequest("/admin/modules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Módulo criado com sucesso.");
      }

      resetForm();
      await loadModules();
    } catch (error) {
      setError(error.message || "Erro ao salvar módulo.");
    }
  });

  (async function init() {
    try {
      await loadCourses();
      await loadModules();
    } catch (error) {
      setError(error.message || "Erro ao iniciar a página.");
    }
  })();
});