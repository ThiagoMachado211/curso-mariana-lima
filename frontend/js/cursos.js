document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireStudent();
  if (!user) return;

  const logoutButton = document.getElementById("logoutButton");
  const feedback = document.getElementById("coursesFeedback");
  const grid = document.getElementById("coursesGrid");

  function setError(message) {
    feedback.textContent = message;
  }

  function clearError() {
    feedback.textContent = "";
  }

  function formatPrice(cents, currency) {
    const value = (Number(cents || 0) / 100).toFixed(2);
    return `${value} ${currency || "BRL"}`;
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      removeToken();
      window.location.href = "login.html";
    });
  }

  try {
    clearError();

    const courses = await apiRequest("/student/courses", {
      method: "GET",
    });

    grid.innerHTML = "";

    if (!courses.length) {
      grid.innerHTML = `
        <div class="course-card">
          <h3 class="course-card__title">Nenhum curso disponível</h3>
          <p class="course-card__text">
            Ainda não há cursos publicados para este usuário.
          </p>
        </div>
      `;
      return;
    }

    courses.forEach((course) => {
      const card = document.createElement("div");
      card.className = "course-card";

      card.innerHTML = `
        <h3 class="course-card__title">${course.title}</h3>
        <p class="course-card__text">${course.description || "Sem descrição cadastrada."}</p>
        <div class="course-card__meta">
          Preço: ${formatPrice(course.price_cents, course.currency)}
        </div>
        <a href="curso.html?id=${course.id}" class="btn btn--purple">Abrir curso</a>
      `;

      grid.appendChild(card);
    });
  } catch (error) {
    setError(error.message || "Erro ao carregar cursos.");
  }
});