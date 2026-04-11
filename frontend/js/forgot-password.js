const form = document.getElementById("forgotForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;

  try {
    const res = await fetch("https://curso-mariana-lima.onrender.com/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Erro");
    }

    message.innerText = "Se o email existir, você receberá instruções.";
    message.style.color = "#4ade80";

  } catch (err) {
    message.innerText = err.message;
    message.style.color = "#f87171";
  }
});