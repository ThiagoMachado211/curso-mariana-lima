console.log("AULAS JS NOVO CARREGADO");

function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function showMessage(message) {
  const container = document.getElementById("message-container");
  if (container) {
    container.innerHTML = `<div class="message">${message}</div>`;
  }
}

async function loadLessons() {
  const moduleId = getQueryParam("module_id");
  const courseId = getQueryParam("course_id");

  if (!moduleId) {
    showMessage("module_id não informado na URL.");
    return;
  }

  try {
    const lessons = await apiRequest(`/student/modules/${moduleId}/lessons`);

    renderPageInfo(moduleId, courseId);
    renderLessons(lessons);
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Erro ao carregar aulas.");
  }
}

function renderPageInfo(moduleId, courseId) {
  const moduleTitle = document.getElementById("module-title");
  const moduleMeta = document.getElementById("module-meta");
  const btnVoltarCurso = document.getElementById("btn-voltar-curso");

  if (moduleTitle) {
    moduleTitle.textContent = "Aulas do módulo";
  }

  if (moduleMeta) {
    moduleMeta.textContent = `Módulo: ${moduleId}`;
  }

  if (btnVoltarCurso) {
    btnVoltarCurso.addEventListener("click", () => {
      if (courseId) {
        window.location.href = `curso.html?id=${courseId}`;
      } else {
        window.location.href = "cursos.html";
      }
    });
  }
}

function renderLessons(lessons) {
  const container = document.getElementById("lessons-container");
  const moduleId = getQueryParam("module_id");
  const courseId = getQueryParam("course_id") || "";

  if (!container) return;

  if (!lessons || lessons.length === 0) {
    container.innerHTML = "<p>Nenhuma aula cadastrada neste módulo.</p>";
    return;
  }

  container.innerHTML = lessons.map(lesson => `
    <div class="lesson-card">
      <div>
        <div class="lesson-order">Aula ${lesson.order}</div>
        <div class="lesson-title">${lesson.title}</div>
      </div>
      <a class="btn" href="aula.html?id=${lesson.id}&module_id=${moduleId}&course_id=${courseId}">
        Abrir aula
      </a>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireStudent();
  if (!user) return;

  loadLessons();
});