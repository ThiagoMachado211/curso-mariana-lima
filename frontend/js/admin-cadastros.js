requireAuth();

const usersList = document.getElementById("usersList");
const feedbackMessage = document.getElementById("feedbackMessage");
const logoutButton = document.getElementById("logoutButton");

const userModal = document.getElementById("userModal");
const userModalTitle = document.getElementById("userModalTitle");
const userForm = document.getElementById("userForm");
const userIdInput = document.getElementById("userId");
const nameInput = document.getElementById("name");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordRow = document.getElementById("passwordRow");
const roleInput = document.getElementById("role");
const isActiveInput = document.getElementById("isActive");
const saveUserButton = document.getElementById("saveUserButton");

const openCreateUserModalButton = document.getElementById("openCreateUserModalButton");
const closeUserModalButton = document.getElementById("closeUserModalButton");
const cancelUserModalButton = document.getElementById("cancelUserModalButton");

const enrollmentModal = document.getElementById("enrollmentModal");
const enrollmentStudentName = document.getElementById("enrollmentStudentName");
const courseSelect = document.getElementById("courseSelect");
const enrollButton = document.getElementById("enrollButton");
const studentEnrollmentsList = document.getElementById("studentEnrollmentsList");
const closeEnrollmentModalButton = document.getElementById("closeEnrollmentModalButton");
const closeEnrollmentFooterButton = document.getElementById("closeEnrollmentFooterButton");

let currentEnrollmentUserId = null;

logoutButton?.addEventListener("click", logout);

function showFeedback(message, type = "success") {
  feedbackMessage.textContent = message;
  feedbackMessage.className = `feedback ${type}`;
  feedbackMessage.classList.remove("hidden");

  setTimeout(() => {
    feedbackMessage.classList.add("hidden");
  }, 4000);
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function resetUserForm() {
  userForm.reset();
  userIdInput.value = "";
  nameInput.value = "";
  lastNameInput.value = "";
  emailInput.value = "";
  passwordInput.value = "";
  roleInput.value = "student";
  isActiveInput.value = "true";
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sortUsersByFirstName(users) {
  return [...users].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "pt-BR", {
      sensitivity: "base",
    })
  );
}

function renderUsers(users) {
  if (!users?.length) {
    usersList.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Nenhum cadastro encontrado.</td>
      </tr>
    `;
    return;
  }

  const sortedUsers = sortUsersByFirstName(users);

  usersList.innerHTML = sortedUsers
    .map((user) => {
      const fullName = `${user.name || ""} ${user.last_name || ""}`.trim();

      return `
        <tr>
          <td>${escapeHtml(fullName || "Usuário sem nome")}</td>
          <td>${escapeHtml(user.email || "")}</td>
          <td>${escapeHtml(user.role || "")}</td>
          <td>
            <span class="status-badge ${user.is_active ? "status-active" : "status-inactive"}">
              ${user.is_active ? "Ativo" : "Inativo"}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit edit-user-btn compact-btn" data-user-id="${user.id}" type="button">
                Editar
              </button>

              <button
                class="action-btn enrollment manage-enrollments-btn compact-btn"
                data-user-id="${user.id}"
                data-user-name="${escapeHtml(fullName)}"
                type="button"
              >
                Matrículas
              </button>

              <button class="action-btn delete delete-user-btn compact-btn" data-user-id="${user.id}" type="button">
                Bloquear
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  bindUserActions();
}

function bindUserActions() {
  document.querySelectorAll(".edit-user-btn").forEach((button) => {
    button.addEventListener("click", () => handleEditUser(button.dataset.userId));
  });

  document.querySelectorAll(".delete-user-btn").forEach((button) => {
    button.addEventListener("click", () => handleDeleteUser(button.dataset.userId));
  });

  document.querySelectorAll(".manage-enrollments-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openEnrollmentModal(button.dataset.userId, button.dataset.userName);
    });
  });
}

async function loadUsers() {
  usersList.innerHTML = `
    <tr>
      <td colspan="5" class="empty-state">Carregando usuários...</td>
    </tr>
  `;

  try {
    const users = await apiRequest("/admin/users");
    renderUsers(users);
  } catch (error) {
    usersList.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Erro ao carregar usuários.</td>
      </tr>
    `;
    showFeedback(error.message || "Erro ao carregar usuários.", "error");
  }
}

async function handleEditUser(userId) {
  try {
    const user = await apiRequest(`/admin/users/${userId}`);

    userModalTitle.textContent = "Editar cadastro";
    userIdInput.value = user.id;
    nameInput.value = user.name || "";
    lastNameInput.value = user.last_name || "";
    emailInput.value = user.email || "";
    roleInput.value = user.role || "student";
    isActiveInput.value = String(user.is_active);

    passwordRow.classList.add("hidden");
    passwordInput.required = false;
    passwordInput.value = "";

    openModal(userModal);
  } catch (error) {
    showFeedback(error.message || "Erro ao carregar usuário.", "error");
  }
}

async function handleDeleteUser(userId) {
  const confirmed = window.confirm("Deseja realmente bloquear este cadastro?");
  if (!confirmed) return;

  try {
    await apiRequest(`/admin/users/${userId}`, {
      method: "DELETE"
    });

    showFeedback("Cadastro bloqueado com sucesso.", "success");
    await loadUsers();
  } catch (error) {
    showFeedback(error.message || "Erro ao bloquear cadastro.", "error");
  }
}

async function loadCoursesOptions() {
  try {
    const courses = await apiRequest("/admin/courses/options");

    if (!courses.length) {
      courseSelect.innerHTML = `<option value="">Nenhum curso disponível</option>`;
      return;
    }

    courseSelect.innerHTML = courses
      .map(
        (course) => `<option value="${course.id}">${escapeHtml(course.title)}</option>`
      )
      .join("");
  } catch (error) {
    courseSelect.innerHTML = `<option value="">Erro ao carregar cursos</option>`;
    showFeedback(error.message || "Erro ao carregar cursos.", "error");
  }
}

function renderEnrollmentStatusBadge(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "active") {
    return `<span class="status-badge status-active">Ativa</span>`;
  }

  if (normalized === "cancelled") {
    return `<span class="status-badge status-cancelled">Cancelada</span>`;
  }

  return `<span class="status-badge">${escapeHtml(status)}</span>`;
}

async function loadUserEnrollments(userId) {
  studentEnrollmentsList.innerHTML = `<div class="empty-state">Carregando matrículas...</div>`;

  try {
    const enrollments = await apiRequest(`/admin/users/${userId}/enrollments`);

    if (!enrollments.length) {
      studentEnrollmentsList.innerHTML = `<div class="empty-state">O aluno não possui matrículas.</div>`;
      return;
    }

    studentEnrollmentsList.innerHTML = enrollments
      .map((item) => {
        const active = item.status === "active";

        return `
          <div class="enrollment-card">
            <div>
              <strong>${escapeHtml(item.course_title)}</strong>
              <div style="margin-top: 8px;">${renderEnrollmentStatusBadge(item.status)}</div>
            </div>

            <div>
              ${
                active
                  ? `<button class="action-btn delete unenroll-btn" data-course-id="${item.course_id}" type="button">Desmatricular</button>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

    document.querySelectorAll(".unenroll-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        await handleUnenroll(currentEnrollmentUserId, button.dataset.courseId);
      });
    });
  } catch (error) {
    studentEnrollmentsList.innerHTML = `<div class="empty-state">Erro ao carregar matrículas.</div>`;
    showFeedback(error.message || "Erro ao carregar matrículas.", "error");
  }
}

async function openEnrollmentModal(userId, userName) {
  currentEnrollmentUserId = userId;
  enrollmentStudentName.textContent = `Aluno: ${userName}`;

  await loadCoursesOptions();
  await loadUserEnrollments(userId);

  openModal(enrollmentModal);
}

async function handleUnenroll(userId, courseId) {
  const confirmed = window.confirm("Deseja realmente desmatricular este aluno?");
  if (!confirmed) return;

  try {
    await apiRequest(`/admin/users/${userId}/enrollments/${courseId}`, {
      method: "DELETE"
    });

    showFeedback("Aluno desmatriculado com sucesso.", "success");
    await loadUserEnrollments(userId);
  } catch (error) {
    showFeedback(error.message || "Erro ao desmatricular aluno.", "error");
  }
}

enrollButton?.addEventListener("click", async () => {
  if (!currentEnrollmentUserId) return;

  try {
    enrollButton.disabled = true;
    enrollButton.textContent = "Matriculando...";

    await apiRequest(`/admin/users/${currentEnrollmentUserId}/enrollments`, {
      method: "POST",
      body: JSON.stringify({
        course_id: courseSelect.value
      })
    });

    showFeedback("Aluno matriculado com sucesso.", "success");
    await loadUserEnrollments(currentEnrollmentUserId);
  } catch (error) {
    showFeedback(error.message || "Erro ao matricular aluno.", "error");
  } finally {
    enrollButton.disabled = false;
    enrollButton.textContent = "Matricular";
  }
});

openCreateUserModalButton?.addEventListener("click", () => {
  resetUserForm();
  userModalTitle.textContent = "Novo cadastro";
  passwordRow.classList.remove("hidden");
  passwordInput.required = true;
  openModal(userModal);
});

closeUserModalButton?.addEventListener("click", () => closeModal(userModal));
cancelUserModalButton?.addEventListener("click", () => closeModal(userModal));
closeEnrollmentModalButton?.addEventListener("click", () => closeModal(enrollmentModal));
closeEnrollmentFooterButton?.addEventListener("click", () => closeModal(enrollmentModal));

userForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const isEditing = Boolean(userIdInput.value);

  const payload = {
    name: nameInput.value.trim(),
    last_name: lastNameInput.value.trim(),
    email: emailInput.value.trim(),
    role: roleInput.value,
    is_active: isActiveInput.value === "true"
  };

  if (!isEditing) {
    payload.password = passwordInput.value;
  }

  try {
    saveUserButton.disabled = true;
    saveUserButton.textContent = isEditing ? "Salvando..." : "Criando...";

    if (isEditing) {
      await apiRequest(`/admin/users/${userIdInput.value}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showFeedback("Cadastro atualizado com sucesso.", "success");
    } else {
      await apiRequest("/admin/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showFeedback("Cadastro criado com sucesso.", "success");
    }

    closeModal(userModal);
    resetUserForm();
    await loadUsers();
  } catch (error) {
    showFeedback(error.message || "Erro ao salvar cadastro.", "error");
  } finally {
    saveUserButton.disabled = false;
    saveUserButton.textContent = "Salvar";
  }
});

loadUsers();