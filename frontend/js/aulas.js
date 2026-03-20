const API_BASE = "http://localhost:8000";
console.log("AULAS JS NOVO CARREGADO");


function getToken() {
  return localStorage.getItem("access_token");
}

function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

function showMessage(message) {
  const container = document.getElementById("message-container");
  container.innerHTML = `<div class="message">${message}</div>`;
}

function redirectToLogin() {
  localStorage.removeItem("access_token");
  window.location.href = "login.html";
}

async function loadLessons() {
  const moduleId = getQueryParam("module_id");
  const courseId = getQueryParam("course_id");

  if (!moduleId) {
    showMessage("module_id não informado na URL.");
    return;
  }

  const token = getToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/student/modules/${moduleId}/lessons`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.detail || "Erro ao carregar aulas.");
      return;
    }

    renderPageInfo(moduleId, courseId);
    renderLessons(data);
  } catch (error) {
    console.error(error);
    showMessage("Erro de conexão com o servidor.");
  }
}

function renderPageInfo(moduleId, courseId) {
  document.getElementById("module-title").textContent = "Aulas do módulo";
  document.getElementById("module-meta").textContent = `Módulo: ${moduleId}`;

  const btnVoltarCurso = document.getElementById("btn-voltar-curso");
  btnVoltarCurso.addEventListener("click", () => {
    if (courseId) {
      window.location.href = `curso.html?id=${courseId}`;
    } else {
      window.location.href = "cursos.html";
    }
  });
}

function renderLessons(lessons) {
  const container = document.getElementById("lessons-container");

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
      <a class="btn" href="aula.html?id=${lesson.id}">Abrir aula</a>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", loadLessons);