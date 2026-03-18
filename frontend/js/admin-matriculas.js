const API_BASE = "http://127.0.0.1:8000";

let studentsCache = [];
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

async function loadStudents() {
  const result = await fetchJson(`${API_BASE}/admin/directory/students`);
  studentsCache = result.data;

  const select = document.getElementById("student-select");
  select.innerHTML = `<option value="">Selecione um aluno</option>`;

  studentsCache.forEach(student => {
    const option = document.createElement("option");
    option.value = student.id;
    option.textContent = `${student.name} (${student.email})`;
    select.appendChild(option);
  });
}

async function loadCourses() {
  const result = await fetchJson(`${API_BASE}/admin/directory/courses`);
  coursesCache = result.data;

  const select = document.getElementById("course-select");
  select.innerHTML = `<option value="">Selecione um curso</option>`;

  coursesCache.forEach(course => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.is_published
      ? `${course.title} (publicado)`
      : `${course.title} (não publicado)`;
    select.appendChild(option);
  });
}

function findStudentName(studentId) {
  const student = studentsCache.find(s => s.id === studentId);
  return student ? `${student.name} (${student.email})` : studentId;
}

function findCourseTitle(courseId) {
  const course = coursesCache.find(c => c.id === courseId);
  return course ? course.title : courseId;
}

async function loadEnrollments() {
  const result = await fetchJson(`${API_BASE}/admin/enrollments`);
  const enrollments = result.data;

  const tbody = document.getElementById("enrollments-table-body");
  tbody.innerHTML = "";

  enrollments.forEach(enrollment => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${enrollment.id}</td>
      <td>${findStudentName(enrollment.user_id)}</td>
      <td>${findCourseTitle(enrollment.course_id)}</td>
      <td>${enrollment.status}</td>
      <td>${new Date(enrollment.created_at).toLocaleString("pt-BR")}</td>
      <td>
        <button class="danger" data-id="${enrollment.id}">Remover</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  document.querySelectorAll(".danger").forEach(button => {
    button.addEventListener("click", async (event) => {
      const enrollmentId = event.target.dataset.id;

      if (!confirm("Deseja remover esta matrícula?")) {
        return;
      }

      try {
        await fetchJson(`${API_BASE}/admin/enrollments/${enrollmentId}`, {
          method: "DELETE",
        });
        showMessage("Matrícula removida com sucesso.");
        await loadEnrollments();
      } catch (error) {
        showMessage(error.message, "error");
      }
    });
  });
}

async function createEnrollment() {
  const studentId = document.getElementById("student-select").value;
  const courseId = document.getElementById("course-select").value;

  if (!studentId || !courseId) {
    showMessage("Selecione um aluno e um curso.", "error");
    return;
  }

  try {
    await fetchJson(`${API_BASE}/admin/enrollments`, {
      method: "POST",
      body: JSON.stringify({
        user_id: studentId,
        course_id: courseId
      }),
    });

    showMessage("Matrícula criada com sucesso.");
    await loadEnrollments();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function init() {
  if (!getToken()) {
    redirectToLogin();
    return;
  }

  try {
    await loadStudents();
    await loadCourses();
    await loadEnrollments();

    document
      .getElementById("create-enrollment-btn")
      .addEventListener("click", createEnrollment);

  } catch (error) {
    showMessage(error.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", init);