const API_BASE = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("access_token");
}

function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function authHeaders() {
  return {
    "Authorization": `Bearer ${getToken()}`
  };
}

function showMessage(msg) {
  document.getElementById("message-container").innerHTML = `<p>${msg}</p>`;
}

function redirectToLogin() {
  localStorage.removeItem("access_token");
  window.location.href = "login.html";
}

async function loadLesson() {
  const lessonId = getQueryParam("id");

  if (!lessonId) {
    showMessage("ID da aula não informado.");
    return;
  }

  if (!getToken()) {
    redirectToLogin();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/student/lessons/${lessonId}`, {
      headers: authHeaders()
    });

    if (res.status === 401) {
      redirectToLogin();
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.detail || "Erro ao carregar aula.");
      return;
    }

    renderLesson(data);

  } catch (err) {
    console.error(err);
    showMessage("Erro de conexão com o servidor.");
  }
}

function renderLesson(lesson) {
  document.getElementById("lesson-title").innerText = lesson.title;

  const videoContainer = document.getElementById("video-container");
  const pdfContainer = document.getElementById("pdf-container");

  if (lesson.video_embed_url) {
    videoContainer.innerHTML = `
      <iframe 
        src="${lesson.video_embed_url}" 
        width="800" 
        height="450" 
        frameborder="0" 
        allowfullscreen>
      </iframe>
    `;
  }

  if (lesson.pdf_url) {
    pdfContainer.innerHTML = `
      <a href="${lesson.pdf_url}" target="_blank">
        📄 Baixar material da aula
      </a>
    `;
  }
}

function goBack() {
  window.history.back();
}

document.addEventListener("DOMContentLoaded", loadLesson);