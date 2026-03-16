document.addEventListener("DOMContentLoaded", () => {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  const form = document.getElementById("lessonForm");
  const feedback = document.getElementById("adminFeedback");
  const tbody = document.getElementById("lessonsTableBody");

  const courseSelect = document.getElementById("lessonCourse");
  const moduleSelect = document.getElementById("lessonModule");
  const orderInput = document.getElementById("lessonOrder");
  const titleInput = document.getElementById("lessonTitle");
  const videoUrlInput = document.getElementById("lessonVideoUrl");
  const pdfUrlInput = document.getElementById("lessonPdfUrl");

  const submitButton = document.getElementById("lessonSubmitButton");
  const cancelButton = document.getElementById("lessonCancelButton");

  let editingLessonId = null;
  let courses = [];
  let modules = [];

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
    editingLessonId = null;
    submitButton.textContent = "Salvar Aula";
    cancelButton.style.display = "none";
    renderModuleOptions();
  }

  function renderCourseOptions() {
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

  function renderModuleOptions(selectedModuleId = null) {
    const selectedCourseId = courseSelect.value;
    const filteredModules = modules.filter((module) => module.course_id === selectedCourseId);

    moduleSelect.innerHTML = "";

    if (!filteredModules.length) {
      moduleSelect.innerHTML = `<option value="">Nenhum módulo disponível</option>`;
      return;
    }

    filteredModules.forEach((module) => {
      const option = document.createElement("option");
      option.value = module.id;
      option.textContent = `${module.order} - ${module.title}`;
      moduleSelect.appendChild(option);
    });

    if (selectedModuleId) {
      moduleSelect.value = selectedModuleId;
    }
  }

  function fillForm(lesson) {
    const module = modules.find((item) => item.id === lesson.module_id);
    if (module) {
      courseSelect.value = module.course_id;
      renderModuleOptions(lesson.module_id);
    }

    orderInput.value = lesson.order;
    titleInput.value = lesson.title;
    videoUrlInput.value = lesson.video_embed_url || "";
    pdfUrlInput.value = lesson.pdf_url || "";

    editingLessonId = lesson.id;
    submitButton.textContent = "Atualizar Aula";
    cancelButton.style.display = "inline-flex";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadCoursesAndModules() {
    courses = await apiRequest("/admin/courses", { method: "GET" });
    modules = await apiRequest("/admin/modules", { method: "GET" });

    renderCourseOptions();
    renderModuleOptions();
  }

  async function loadLessons() {
    clearFeedback();

    try {
      const lessons = await apiRequest("/admin/lessons", {
        method: "GET",
      });

      tbody.innerHTML = "";

      if (!lessons.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">Nenhuma aula cadastrada.</td>
          </tr>
        `;
        return;
      }

      lessons.forEach((lesson) => {
        const module = modules.find((item) => item.id === lesson.module_id);
        const course = module ? courses.find((item) => item.id === module.course_id) : null;

        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${lesson.id}</td>
          <td>${course ? course.title : "-"}</td>
          <td>${module ? module.title : lesson.module_id}</td>
          <td>${lesson.order}</td>
          <td>${lesson.title}</td>
          <td>${lesson.video_embed_url ? "Sim" : "Não"}</td>
          <td>${lesson.pdf_url ? "Sim" : "Não"}</td>
          <td>
            <div class="admin-actions">
              <button type="button" class="btn btn--green edit-lesson">Editar</button>
              <button type="button" class="btn btn--red delete-lesson">Excluir</button>
            </div>
          </td>
        `;

        row.querySelector(".edit-lesson").addEventListener("click", () => {
          fillForm(lesson);
        });

        row.querySelector(".delete-lesson").addEventListener("click", async () => {
          const confirmed = window.confirm(`Deseja excluir a aula "${lesson.title}"?`);
          if (!confirmed) return;

          try {
            await apiRequest(`/admin/lessons/${lesson.id}`, {
              method: "DELETE",
            });

            setSuccess("Aula excluída com sucesso.");
            if (editingLessonId === lesson.id) {
              resetForm();
            }
            await loadLessons();
          } catch (error) {
            setError(error.message || "Erro ao excluir aula.");
          }
        });

        tbody.appendChild(row);
      });
    } catch (error) {
      setError(error.message || "Erro ao carregar aulas.");
    }
  }

  courseSelect.addEventListener("change", () => {
    renderModuleOptions();
  });

  cancelButton.addEventListener("click", () => {
    resetForm();
    clearFeedback();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback();

    const payload = {
      module_id: moduleSelect.value,
      title: titleInput.value.trim(),
      order: Number(orderInput.value || 0),
      video_embed_url: videoUrlInput.value.trim() || null,
      pdf_url: pdfUrlInput.value.trim() || null,
    };

    if (!payload.module_id || !payload.title || !payload.order) {
      setError("Preencha módulo, título e ordem.");
      return;
    }

    try {
      if (editingLessonId) {
        await apiRequest(`/admin/lessons/${editingLessonId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setSuccess("Aula atualizada com sucesso.");
      } else {
        await apiRequest("/admin/lessons", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Aula criada com sucesso.");
      }

      resetForm();
      await loadLessons();
    } catch (error) {
      setError(error.message || "Erro ao salvar aula.");
    }
  });

  (async function init() {
    try {
      await loadCoursesAndModules();
      await loadLessons();
    } catch (error) {
      setError(error.message || "Erro ao iniciar a página.");
    }
  })();
});