document.addEventListener("DOMContentLoaded", async () => {
  const usersMessage = document.getElementById("usersMessage");
  const usersList = document.getElementById("usersList");

  function showMessage(type, text) {
    if (!usersMessage) return;
    usersMessage.innerHTML = `<div class="message ${type}">${text}</div>`;
  }

  function clearMessage() {
    if (!usersMessage) return;
    usersMessage.innerHTML = "";
  }

  function formatRole(role) {
    if (role === "admin") return "Administrador";
    if (role === "student") return "Aluno";
    return role || "-";
  }

  function renderUsers(users) {
    if (!Array.isArray(users) || users.length === 0) {
      usersList.innerHTML = `<p class="empty-state">Nenhum cadastro encontrado.</p>`;
      return;
    }

    usersList.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Sobrenome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map(
                (user) => `
                  <tr>
                    <td>${user.name ?? ""}</td>
                    <td>${user.last_name ?? ""}</td>
                    <td class="admin-table-email">${user.email ?? ""}</td>
                    <td>
                      <span class="admin-table-role ${user.role}">
                        ${formatRole(user.role)}
                      </span>
                    </td>
                    <td>
                      <span class="admin-table-status ${user.is_active ? "active" : "inactive"}">
                        ${user.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  try {
    if (typeof requireAdmin === "function") {
      await requireAdmin();
    }

    clearMessage();

    const users = await apiRequest("/admin/directory/users");
    renderUsers(users);
  } catch (error) {
    console.error("Erro ao carregar cadastros:", error);
    showMessage("error", error.message || "Erro ao carregar os cadastros.");
  }
});