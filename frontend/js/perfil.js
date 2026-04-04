requireStudent();

const logoutButton = document.getElementById("logoutButton");
const courseNavLink = document.getElementById("courseNavLink");

const nameField = document.getElementById("profileName");
const lastNameField = document.getElementById("profileLastName");
const emailField = document.getElementById("profileEmail");
const roleField = document.getElementById("profileRole");

const editProfileButton = document.getElementById("editProfileButton");
const profileModal = document.getElementById("profileModal");
const closeProfileModalButton = document.getElementById("closeProfileModalButton");
const cancelProfileModalButton = document.getElementById("cancelProfileModalButton");
const profileForm = document.getElementById("profileForm");
const editNameInput = document.getElementById("editName");
const editLastNameInput = document.getElementById("editLastName");
const editEmailInput = document.getElementById("editEmail");
const saveProfileButton = document.getElementById("saveProfileButton");
const profileFeedbackMessage = document.getElementById("profileFeedbackMessage");

let currentUser = null;

logoutButton?.addEventListener("click", logout);

function showProfileFeedback(message, type = "success") {
  if (!profileFeedbackMessage) return;

  profileFeedbackMessage.textContent = message;
  profileFeedbackMessage.className = `feedback ${type}`;
  profileFeedbackMessage.classList.remove("hidden");

  setTimeout(() => {
    profileFeedbackMessage.classList.add("hidden");
  }, 4000);
}

function openModal() {
  profileModal?.classList.remove("hidden");
}

function closeModal() {
  profileModal?.classList.add("hidden");
}

function fillProfileFields(user) {
  if (nameField) nameField.textContent = user.name || "-";
  if (lastNameField) lastNameField.textContent = user.last_name || "-";
  if (emailField) emailField.textContent = user.email || "-";
  if (roleField) roleField.textContent = user.role === "student" ? "Aluno" : user.role || "-";
}

function fillEditForm(user) {
  if (editNameInput) editNameInput.value = user.name || "";
  if (editLastNameInput) editLastNameInput.value = user.last_name || "";
  if (editEmailInput) editEmailInput.value = user.email || "";
}

async function loadProfile() {
  try {
    const user = await apiRequest("/auth/me");

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    currentUser = user;
    fillProfileFields(user);
    fillEditForm(user);

    await ensureCourseLink();
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);

    if (nameField) nameField.textContent = "-";
    if (lastNameField) lastNameField.textContent = "-";
    if (emailField) emailField.textContent = "-";
    if (roleField) roleField.textContent = "-";
  }
}

async function ensureCourseLink() {
  try {
    let courseId = localStorage.getItem("course_id");

    if (!courseId) {
      const courses = await apiRequest("/student/courses");

      if (Array.isArray(courses) && courses.length > 0 && courses[0]?.id) {
        courseId = courses[0].id;
        localStorage.setItem("course_id", courseId);
      }
    }

    if (courseNavLink) {
      courseNavLink.href = courseId
        ? `./curso.html?course_id=${courseId}`
        : "./curso.html";
    }
  } catch (error) {
    console.error("Erro ao preparar link do curso:", error);

    if (courseNavLink) {
      courseNavLink.href = "./curso.html";
    }
  }
}

editProfileButton?.addEventListener("click", () => {
  if (currentUser) {
    fillEditForm(currentUser);
  }
  openModal();
});

closeProfileModalButton?.addEventListener("click", closeModal);
cancelProfileModalButton?.addEventListener("click", closeModal);

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    name: editNameInput.value.trim(),
    last_name: editLastNameInput.value.trim(),
    email: editEmailInput.value.trim().toLowerCase(),
  };

  try {
    saveProfileButton.disabled = true;
    saveProfileButton.textContent = "Salvando...";

    const updatedUser = await apiRequest("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    currentUser = updatedUser;
    fillProfileFields(updatedUser);
    fillEditForm(updatedUser);

    showProfileFeedback("Perfil atualizado com sucesso.", "success");
    closeModal();
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    showProfileFeedback(error.message || "Erro ao atualizar perfil.", "error");
  } finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = "Salvar";
  }
});

loadProfile();