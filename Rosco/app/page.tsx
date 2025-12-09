import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-slate-900 text-white">
      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 text-center">
        Juga y aprende
      </h1>
      <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl text-center">
        La plataforma educativa para crear, jugar y aprender. Diseña tus propias actividades o únete a una partida en tiempo real.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          href="/login"
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 transition font-semibold text-center w-full sm:w-auto"
        >
          Iniciar Sesión
        </Link>
        <Link
          href="/join"
          className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition font-semibold text-center w-full sm:w-auto"
        >
          Unirse a Partida
        </Link>
      </div>
    </main>
  );
}
