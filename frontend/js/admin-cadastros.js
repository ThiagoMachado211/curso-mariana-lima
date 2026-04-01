document.addEventListener("DOMContentLoaded", async () => {
  const messageBox = document.getElementById("messageBox");
  const usersList = document.getElementById("usersList");

  function showMessage(type, text) {
    if (!messageBox) return;
    messageBox.innerHTML = `<div class="message ${type}">${text}</div>`;
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
            ${users.map((user) => `
              <tr>
                <td>${user.name ?? ""}</td>
                <td>${user.last_name ?? ""}</td>
                <td>${user.email ?? ""}</td>
                <td>${formatRole(user.role)}</td>
                <td>${user.is_active ? "Ativo" : "Inativo"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  try {
    await requireAdmin();
    const users = await apiRequest("/admin/directory/users");
    renderUsers(users);
  } catch (error) {
    showMessage("error", error.message || "Erro ao carregar os cadastros.");
  }
});