document.addEventListener("DOMContentLoaded", async () => {
  const messageBox = document.getElementById("messageBox");
  const logoutButton = document.getElementById("logoutButton");
  const editProfileButton = document.getElementById("editProfileButton");
  const cancelEditProfile = document.getElementById("cancelEditProfile");

  const profileCard = document.getElementById("profileCard");
  const profileFormCard = document.getElementById("profileFormCard");

  const profileName = document.getElementById("profileName");
  const profileLastName = document.getElementById("profileLastName");
  const profileEmail = document.getElementById("profileEmail");
  const profileRole = document.getElementById("profileRole");

  const form = document.getElementById("profileForm");
  const nameInput = document.getElementById("name");
  const lastNameInput = document.getElementById("last_name");
  const emailInput = document.getElementById("email");

  let currentUser = null;

  function showMessage(type, text) {
    if (!messageBox) return;
    messageBox.innerHTML = `<div class="message ${type}">${text}</div>`;
  }

  function clearMessage() {
    if (!messageBox) return;
    messageBox.innerHTML = "";
  }

  function renderProfile(user) {
    profileName.textContent = user.name ?? "-";
    profileLastName.textContent = user.last_name ?? "-";
    profileEmail.textContent = user.email ?? "-";
    profileRole.textContent = user.role === "student" ? "Aluno" : user.role ?? "-";
  }

  function openEditForm() {
    if (!currentUser) return;

    nameInput.value = currentUser.name ?? "";
    lastNameInput.value = currentUser.last_name ?? "";
    emailInput.value = currentUser.email ?? "";

    profileCard.classList.add("hidden");
    profileFormCard.classList.remove("hidden");
  }

  function closeEditForm() {
    profileFormCard.classList.add("hidden");
    profileCard.classList.remove("hidden");
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  if (editProfileButton) {
    editProfileButton.addEventListener("click", openEditForm);
  }

  if (cancelEditProfile) {
    cancelEditProfile.addEventListener("click", closeEditForm);
  }

  try {
    currentUser = await requireStudent();
    renderProfile(currentUser);
  } catch (error) {
    showMessage("error", error.message || "Erro ao carregar perfil.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const payload = {
      name: nameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
    };

    try {
      // Ajuste a rota se seu backend usar outro endpoint
      const updatedUser = await apiRequest("/users/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      currentUser = updatedUser;
      renderProfile(currentUser);
      closeEditForm();
      showMessage("success", "Perfil atualizado com sucesso.");
    } catch (error) {
      showMessage("error", error.message || "Erro ao atualizar perfil.");
    }
  });
});