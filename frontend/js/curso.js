document.addEventListener("DOMContentLoaded", async () => {
  if (!isAuthenticated()) {
    window.location.href = `aulas.html?module_id=${module.id}`;
    return;
  }

  const logoutButton = document.getElementById("logoutButton");
  const feedback = document.getElementById("courseFeedback");
  const courseTitle = document.getElementById("courseTitle");
  const courseDescription = document.getElementById("courseDescription");
  const courseMeta = document.getElementById("courseMeta");
  const modulesGrid = document.getElementById("modulesGrid");

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

  function getCourseIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      removeToken();
      window.location.href = `aulas.html?module_id=${module.id}`;
    });
  }

  try {
    await apiRequest("/auth/me", { method: "GET" });
  } catch (error) {
    removeToken();
    window.location.href = `aulas.html?module_id=${module.id}`;
    return;
  }

  const courseId = getCourseIdFromUrl();

  if (!courseId) {
    setError("Curso não informado.");
    courseTitle.textContent = "Curso não encontrado";
    return;
  }

  try {
    clearError();

    const [course, modules] = await Promise.all([
      apiRequest(`/student/courses/${courseId}`, { method: "GET" }),
      apiRequest(`/student/courses/${courseId}/modules`, { method: "GET" }),
    ]);

    courseTitle.textContent = course.title;
    courseDescription.textContent = course.description || "Sem descrição cadastrada.";
    courseMeta.textContent = `Preço: ${formatPrice(course.price_cents, course.currency)}`;

    modulesGrid.innerHTML = "";

    if (!modules.length) {
      modulesGrid.innerHTML = `
        <div class="module-card">
          <div class="module-card__title">Nenhum módulo disponível</div>
          <div class="module-card__text">
            Este curso ainda não possui módulos cadastrados.
          </div>
        </div>
      `;
      return;
    }

    modules.forEach((module) => {
      const card = document.createElement("div");
      card.className = "module-card";

      card.innerHTML = `
        <div class="module-card__order">Módulo ${module.order}</div>
        <div class="module-card__title">${module.title}</div>
        <div class="module-card__text">
          Conteúdo disponível neste módulo.
        </div>
        <a href="aulas.html?module_id=${module.id}&course_id=${course.id}" class="btn btn--purple">
          Ver aulas
        </a>
      `;

      modulesGrid.appendChild(card);
    });
  } catch (error) {
    setError(error.message || "Erro ao carregar curso.");
    courseTitle.textContent = "Erro ao carregar curso";
  }
});