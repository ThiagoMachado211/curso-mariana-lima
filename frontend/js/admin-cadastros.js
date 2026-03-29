document.addEventListener("DOMContentLoaded", async () => {
  const usersMessage = document.getElementById("usersMessage");
  const usersList = document.getElementById("usersList");

  try {
    if (typeof requireAdmin === "function") {
      await requireAdmin();
    }

    const users = await apiRequest("/admin/directory/students");

    if (!Array.isArray(users) || users.length === 0) {
      usersList.innerHTML = '<p class="empty-state">Nenhum cadastro encontrado.</p>';
      return;
    }

    usersList.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Sobrenome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Ativo</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map(
                (user) => `
                  <tr>
                    <td>${user.name ?? ""}</td>
                    <td>${user.last_name ?? ""}</td>
                    <td>${user.email ?? ""}</td>
                    <td>${user.role ?? ""}</td>
                    <td>${user.is_active ? "Sim" : "Não"}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error("Erro ao carregar cadastros:", error);
    usersMessage.innerHTML = '<div class="message error">Erro ao carregar os cadastros.</div>';
  }
});