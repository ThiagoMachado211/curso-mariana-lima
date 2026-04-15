requireAuth();

const blockedUsersList = document.getElementById("blockedUsersList");
const feedbackMessage = document.getElementById("feedbackMessage");
const logoutButton = document.getElementById("logoutButton");

const userModal = document.getElementById("userModal");
const userModalTitle = document.getElementById("userModalTitle");
const userForm = document.getElementById("userForm");
const userIdInput = document.getElementById("userId");
const nameInput = document.getElementById("name");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const roleInput = document.getElementById("role");
const isActiveInput = document.getElementById("isActive");
const saveUserButton = document.getElementById("saveUserButton");

const closeUserModalButton = document.getElementById("closeUserModalButton");
const cancelUserModalButton = document.getElementById("cancelUserModalButton");

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

function renderBlockedUsers(users) {
  if (!users?.length) {
    blockedUsersList.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Nenhum usuário bloqueado encontrado.</td>
      </tr>
    `;
    return;
  }

  const blockedUsers = sortUsersByFirstName(users.filter((user) => !user.is_active));

  if (!blockedUsers.length) {
    blockedUsersList.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Nenhum usuário bloqueado encontrado.</td>
      </tr>
    `;
    return;
  }

  blockedUsersList.innerHTML = blockedUsers
    .map((user) => {
      const fullName = `${user.name || ""} ${user.last_name || ""}`.trim();

      return `
        <tr>
          <td>${escapeHtml(fullName || "Usuário sem nome")}</td>
          <td>${escapeHtml(user.email || "")}</td>
          <td>${escapeHtml(user.role || "")}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit edit-user-btn compact-btn" data-user-id="${user.id}" type="button">
                Editar
              </button>

              <button class="action-btn success unlock-user-btn compact-btn" data-user-id="${user.id}" type="button">
                Desbloquear
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  bindBlockedUserActions();
}

function bindBlockedUserActions() {
  document.querySelectorAll(".edit-user-btn").forEach((button) => {
    button.addEventListener("click", () => handleEditUser(button.dataset.userId));
  });

  document.querySelectorAll(".unlock-user-btn").forEach((button) => {
    button.addEventListener("click", () => handleUnlockUser(button.dataset.userId));
  });
}

async function loadBlockedUsers() {
  blockedUsersList.innerHTML = `
    <tr>
      <td colspan="4" class="empty-state">Carregando usuários bloqueados...</td>
    </tr>
  `;

  try {
    const users = await apiRequest("/admin/users");
    renderBlockedUsers(users);
  } catch (error) {
    blockedUsersList.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Erro ao carregar usuários bloqueados.</td>
      </tr>
    `;
    showFeedback(error.message || "Erro ao carregar usuários bloqueados.", "error");
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

    openModal(userModal);
  } catch (error) {
    showFeedback(error.message || "Erro ao carregar usuário.", "error");
  }
}

async function handleUnlockUser(userId) {
  const confirmed = window.confirm("Deseja realmente desbloquear este usuário?");
  if (!confirmed) return;

  try {
    const user = await apiRequest(`/admin/users/${userId}`);

    await apiRequest(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: user.name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        is_active: true,
      }),
    });

    showFeedback("Usuário desbloqueado com sucesso.", "success");
    await loadBlockedUsers();
  } catch (error) {
    showFeedback(error.message || "Erro ao desbloquear usuário.", "error");
  }
}

closeUserModalButton?.addEventListener("click", () => closeModal(userModal));
cancelUserModalButton?.addEventListener("click", () => closeModal(userModal));

userForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    last_name: lastNameInput.value.trim(),
    email: emailInput.value.trim(),
    role: roleInput.value,
    is_active: isActiveInput.value === "true",
  };

  try {
    saveUserButton.disabled = true;
    saveUserButton.textContent = "Salvando...";

    await apiRequest(`/admin/users/${userIdInput.value}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    showFeedback("Cadastro atualizado com sucesso.", "success");
    closeModal(userModal);
    await loadBlockedUsers();
  } catch (error) {
    showFeedback(error.message || "Erro ao salvar cadastro.", "error");
  } finally {
    saveUserButton.disabled = false;
    saveUserButton.textContent = "Salvar";
  }
});

loadBlockedUsers();