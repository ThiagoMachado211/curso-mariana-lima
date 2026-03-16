const API_BASE = "http://127.0.0.1:8000";

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

async function loadLesson() {
  const lessonId = getQueryParam("id");

  if (!lessonId) {
    showMessage("ID da aula não informado na URL.");
    return;
  }

  const token = getToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/student/lessons/${lessonId}`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.detail || "Erro ao carregar aula.");
      return;
    }

    renderLesson(data);
  } catch (error) {
    console.error(error);
    showMessage("Erro de conexão com o servidor.");
  }
}

function renderLesson(lesson) {
  document.getElementById("lesson-title").textContent = lesson.title;
  document.getElementById("lesson-meta").textContent =
    `Curso: ${lesson.course.title} | Módulo: ${lesson.module.title} | Aula ${lesson.order}`;

  document.getElementById("btn-back-module").addEventListener("click", () => {
    window.location.href = `aulas.html?module_id=${lesson.module.id}`;
  });

  renderVideo(lesson.video_embed_url);
  renderPdf(lesson.pdf_url);
}

function renderVideo(videoUrl) {
  const container = document.getElementById("video-container");

  if (!videoUrl) {
    container.innerHTML = "<p style='color:white; padding:20px;'>Nenhum vídeo disponível para esta aula.</p>";
    return;
  }

  container.innerHTML = `
    <iframe
      src="${videoUrl}"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      title="Vídeo da aula">
    </iframe>
  `;
}

function renderPdf(pdfUrl) {
  const container = document.getElementById("pdf-container");

  if (!pdfUrl) {
    container.innerHTML = "<p>Nenhum PDF disponível para esta aula.</p>";
    return;
  }

  container.innerHTML = `
    <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer">
      Baixar PDF
    </a>
  `;
}

document.addEventListener("DOMContentLoaded", loadLesson);