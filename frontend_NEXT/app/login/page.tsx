"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithToken } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password: senha,
      });

      const token = response.data.access_token;
      const me = await loginWithToken(token);

      if (me?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/aluno");
      }
    } catch {
      setErro("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#081225",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#0b1730",
          borderRadius: "28px",
          padding: "36px 32px 28px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #6d28d9, #84cc16)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: 700,
              fontSize: "24px",
              color: "#fff",
            }}
          >
            ▶
          </div>
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "42px",
            fontWeight: 700,
            marginBottom: "28px",
          }}
        >
          Área de Acesso
        </h1>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "26px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              E-mail
            </label>

            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                height: "58px",
                padding: "0 18px",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#09162d",
                color: "#ffffff",
                fontSize: "16px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Senha
            </label>

            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{
                width: "100%",
                height: "58px",
                padding: "0 18px",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#09162d",
                color: "#ffffff",
                fontSize: "16px",
                outline: "none",
              }}
            />
          </div>

          {erro && (
            <p style={{ color: "#f87171", marginBottom: "16px", fontSize: "14px" }}>
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "64px",
              border: "none",
              borderRadius: "18px",
              background: "linear-gradient(90deg, #2f6df6 0%, #24d1c1 100%)",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: "24px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            fontSize: "15px",
          }}
        >
          <Link
            href="/cadastro"
            style={{
              color: "#d1d5db",
              textDecoration: "none",
            }}
          >
            Cadastrar-se
          </Link>

          <Link
            href="/quem-somos"
            style={{
              color: "#d1d5db",
              textDecoration: "none",
            }}
          >
            Quem Somos?
          </Link>
        </div>
      </section>
    </main>
  );
}