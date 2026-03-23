const API_BASE = "http://localhost:8000";

let studentsCache = [];
let coursesCache = [];
let enrollmentsCache = [];

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

function findStudent(studentId) {
  return studentsCache.find(s => s.id === studentId);
}

function findCourse(courseId) {
  return coursesCache.find(c => c.id === courseId);
}

function enrichEnrollment(enrollment) {
  const student = findStudent(enrollment.user_id);
  const course = findCourse(enrollment.course_id);

  return {
    ...enrollment,
    student_name: student ? student.name : enrollment.user_id,
    student_email: student ? student.email : "",
    course_title: course ? course.title : enrollment.course_id,
  };
}

async function loadEnrollments() {
  const result = await fetchJson(`${API_BASE}/admin/enrollments`);
  enrollmentsCache = result.data.map(enrichEnrollment);
  renderEnrollments(enrollmentsCache);
}

function renderEnrollments(enrollments) {
  const tbody = document.getElementById("enrollments-table-body");
  const emptyState = document.getElementById("empty-state");

  tbody.innerHTML = "";

  if (!enrollments || enrollments.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  enrollments.forEach(enrollment => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div><strong>${enrollment.student_name}</strong></div>
        <div style="color:#64748b; font-size:12px;">${enrollment.student_email || ""}</div>
      </td>
      <td>${enrollment.course_title}</td>
      <td>
        <span class="status-badge status-active">${enrollment.status}</span>
      </td>
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
        applyFilters();
      } catch (error) {
        showMessage(error.message, "error");
      }
    });
  });
}

function applyFilters() {
  const studentFilter = document.getElementById("filter-student").value.toLowerCase().trim();
  const courseFilter = document.getElementById("filter-course").value.toLowerCase().trim();

  const filtered = enrollmentsCache.filter(item => {
    const matchesStudent =
      !studentFilter ||
      item.student_name.toLowerCase().includes(studentFilter) ||
      item.student_email.toLowerCase().includes(studentFilter);

    const matchesCourse =
      !courseFilter ||
      item.course_title.toLowerCase().includes(courseFilter);

    return matchesStudent && matchesCourse;
  });

  renderEnrollments(filtered);
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

    document.getElementById("student-select").value = "";
    document.getElementById("course-select").value = "";

    await loadEnrollments();
    applyFilters();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function init() {

  const user = await requireAdmin();
  if (!user) return;

  try {
    await loadStudents();
    await loadCourses();
    await loadEnrollments();

    document
      .getElementById("create-enrollment-btn")
      .addEventListener("click", createEnrollment);

    document
      .getElementById("filter-student")
      .addEventListener("input", applyFilters);

    document
      .getElementById("filter-course")
      .addEventListener("input", applyFilters);

  } catch (error) {
    showMessage(error.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", init);