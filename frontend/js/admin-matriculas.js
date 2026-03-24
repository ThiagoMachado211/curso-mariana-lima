let studentsCache = [];
let coursesCache = [];
let enrollmentsCache = [];

function showMessage(message, type = "success") {
  const container = document.getElementById("message-container");
  if (container) {
    container.innerHTML = `<div class="message ${type}">${message}</div>`;

    setTimeout(() => {
      container.innerHTML = "";
    }, 4000);
  }
}

async function loadStudents() {
  const students = await apiRequest("/admin/directory/students");
  studentsCache = students;

  const select = document.getElementById("student-select");
  if (!select) return;

  select.innerHTML = `<option value="">Selecione um aluno</option>`;

  studentsCache.forEach((student) => {
    const option = document.createElement("option");
    option.value = student.id;
    option.textContent = `${student.name} (${student.email})`;
    select.appendChild(option);
  });
}

async function loadCourses() {
  const courses = await apiRequest("/admin/directory/courses");
  coursesCache = courses;

  const select = document.getElementById("course-select");
  if (!select) return;

  select.innerHTML = `<option value="">Selecione um curso</option>`;

  coursesCache.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.is_published
      ? `${course.title} (publicado)`
      : `${course.title} (não publicado)`;
    select.appendChild(option);
  });
}

function findStudent(studentId) {
  return studentsCache.find((student) => student.id === studentId);
}

function findCourse(courseId) {
  return coursesCache.find((course) => course.id === courseId);
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
  const enrollments = await apiRequest("/admin/enrollments");
  enrollmentsCache = enrollments.map(enrichEnrollment);
  renderEnrollments(enrollmentsCache);
}

function renderEnrollments(enrollments) {
  const tbody = document.getElementById("enrollments-table-body");
  const emptyState = document.getElementById("empty-state");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!enrollments || enrollments.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  enrollments.forEach((enrollment) => {
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

  document.querySelectorAll(".danger").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const enrollmentId = event.target.dataset.id;

      if (!confirm("Deseja remover esta matrícula?")) {
        return;
      }

      try {
        await apiRequest(`/admin/enrollments/${enrollmentId}`, {
          method: "DELETE",
        });

        showMessage("Matrícula removida com sucesso.");
        await loadEnrollments();
        applyFilters();
      } catch (error) {
        showMessage(error.message || "Erro ao remover matrícula.", "error");
      }
    });
  });
}

function applyFilters() {
  const studentFilter = document.getElementById("filter-student")?.value.toLowerCase().trim() || "";
  const courseFilter = document.getElementById("filter-course")?.value.toLowerCase().trim() || "";

  const filtered = enrollmentsCache.filter((item) => {
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
  const studentId = document.getElementById("student-select")?.value || "";
  const courseId = document.getElementById("course-select")?.value || "";

  if (!studentId || !courseId) {
    showMessage("Selecione um aluno e um curso.", "error");
    return;
  }

  try {
    await apiRequest("/admin/enrollments", {
      method: "POST",
      body: JSON.stringify({
        user_id: studentId,
        course_id: courseId,
      }),
    });

    showMessage("Matrícula criada com sucesso.");

    const studentSelect = document.getElementById("student-select");
    const courseSelect = document.getElementById("course-select");

    if (studentSelect) studentSelect.value = "";
    if (courseSelect) courseSelect.value = "";

    await loadEnrollments();
    applyFilters();
  } catch (error) {
    showMessage(error.message || "Erro ao criar matrícula.", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAdmin();
  if (!user) return;

  const createBtn = document.getElementById("create-enrollment-btn");
  const filterStudent = document.getElementById("filter-student");
  const filterCourse = document.getElementById("filter-course");
  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      logout();
    });
  }

  if (createBtn) {
    createBtn.addEventListener("click", createEnrollment);
  }

  if (filterStudent) {
    filterStudent.addEventListener("input", applyFilters);
  }

  if (filterCourse) {
    filterCourse.addEventListener("input", applyFilters);
  }

  try {
    await loadStudents();
    await loadCourses();
    await loadEnrollments();
  } catch (error) {
    showMessage(error.message || "Erro ao carregar dados da página.", "error");
  }

});