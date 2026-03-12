import Link from "next/link";

export default function HomePage() {
  const stats = [
    { value: "+12k", label: "Alunos ativos" },
    { value: "98%", label: "Satisfação" },
    { value: "+80", label: "Aulas" },
    { value: "4", label: "Anos no mercado" },
  ];

  const modules = [
    {
      id: 1,
      tag: "MÓDULO 1",
      title: "Título do Módulo 1",
      description: "Breve Descrição do Módulo 1.",
      icon: "📈",
      bgClass: "from-purple-900/90 to-purple-700/70",
    },
    {
      id: 2,
      tag: "MÓDULO 2",
      title: "Título do Módulo 2",
      description: "Breve Descrição do Módulo 2.",
      icon: "📊",
      bgClass: "from-indigo-900/90 to-indigo-700/70",
    },
    {
      id: 3,
      tag: "MÓDULO 3",
      title: "Título do Módulo 3",
      description: "Breve Descrição do Módulo 3.",
      icon: "📐",
      bgClass: "from-emerald-900/90 to-emerald-700/70",
    },
    {
      id: 4,
      tag: "MÓDULO 4",
      title: "Título do Módulo 4",
      description: "Breve Descrição do Módulo 4.",
      icon: "🧠",
      bgClass: "from-pink-900/90 to-pink-700/70",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
         
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
              <span className="text-sm font-bold text-violet-600">▶</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">
              <span className="text-blue-500">Matemática</span>
              <span className="text-violet-500">Essencial</span>
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-zinc-950 px-5 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-zinc-900"
            >
              Entrar
            </Link>

            <Link
              href="/cadastro"
              className="rounded-xl bg-violet-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Cadastre-se
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}

      <section className="relative overflow-hidden">
        <div className="mx-auto flex min-h-[680px] max-w-[1400px] flex-col items-center px-6 pt-10 text-center">
          <h1 className="mt-2 max-w-[980px] text-5xl font-extrabold leading-[1.02] tracking-tight text-white md:text-7xl">
            É aqui que sua nova jornada começa!
          </h1>

          <p className="mt-6 max-w-[620px] text-base leading-7 text-sky-100/80 md:text-[22px] md:leading-9">
            Curso prático, comunidade ativa e suporte real. Tudo que você
            precisa para aprender.
          </p>

        </div>

        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="text-4xl font-extrabold tracking-tight text-white">
            Estrutura do Curso
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => (
              <article
                key={module.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-lg"
              >
                <div
                  className={`flex h-44 items-center justify-center bg-gradient-to-br ${module.bgClass}`}
                >
                  <div className="text-5xl">{module.icon}</div>
                </div>

                <div className="p-5">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
                    {module.tag}
                  </span>

                  <h3 className="mt-3 text-xl font-bold text-white">
                    {module.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {module.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}