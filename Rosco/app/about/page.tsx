import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 md:p-24">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Acerca del Proyecto
          </h1>
        </div>

        {/* Project Description */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-blue-400">¿Qué es Juga y Aprende?</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Juga y Aprende es una plataforma educativa interactiva desarrollada como recurso complementario para la materia Teoría de Sistemas, dictada por el Profesor Marcelo Castro en la Universidad Argentina de la Empresa (UADE), dentro del Departamento de Tecnología Informática. La plataforma combina contenidos académicos con dinámicas de juego, permitiendo que los estudiantes interactúen con los conceptos vistos en clase de una forma más práctica y atractiva. A través de distintos juegos didácticos, se refuerzan nociones clave de la materia y se facilita su comprensión mediante la participación activa.
          </p>
        </section>

        {/* Games Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-purple-400">Nuestros Juegos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-gray-300">
            {/* Rosco */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">R</div>
                <h3 className="text-xl font-medium text-white">Rosco Cultural</h3>
              </div>
              <p>El desafío definitivo de vocabulario. Los estudiantes deben adivinar términos para cada letra del abecedario a partir de sus definiciones. Ideal para reforzar léxico.</p>
            </div>

            {/* Ahorcado */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white">A</div>
                <h3 className="text-xl font-medium text-white">Ahorcado</h3>
              </div>
              <p>Descubre conceptos clave letra por letra. Una versión pedagógica donde los alumnos deben adivinar la palabra oculta antes de que se complete el dibujo.</p>
            </div>

            {/* Preguntados */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-600 flex items-center justify-center font-bold text-white">?</div>
                <h3 className="text-xl font-medium text-white">Trivia</h3>
              </div>
              <p>Competencia de preguntas y respuestas de opción múltiple. Pone a prueba la rapidez y la precisión de los conocimientos en diversas materias.</p>
            </div>


            {/* Sopa de Letras */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center font-bold text-white">S</div>
                <h3 className="text-xl font-medium text-white">Sopa de Letras</h3>
              </div>
              <p>Agudeza visual y ortografía. Los estudiantes buscan términos ocultos en una cuadrícula, ideal para familiarizarse con el vocabulario.</p>
            </div>


            {/* Batalla Naval */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center font-bold text-white">B</div>
                <h3 className="text-xl font-medium text-white">Batalla Naval</h3>
              </div>
              <p>Estrategia y conocimiento. Para "disparar" y hundir la flota enemiga, los estudiantes deben responder correctamente a preguntas educativas.</p>
            </div>
          </div>
        </section>

        {/* Objectives */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-green-400">Objetivos Educativos</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2 text-lg">
            <li>Fomentar el aprendizaje activo a través de la gamificación.</li>
            <li>Mejorar la retención de conocimientos mediante la práctica interactiva.</li>
            <li>Ofrecer a los docentes herramientas versátiles para evaluar y motivar a sus alumnos.</li>
            <li>Promover la competencia sana y el trabajo en equipo.</li>
          </ul>
        </section>

        {/* Student/Creator Info */}
        <section className="pt-8 border-t border-white/10">
          <h2 className="text-2xl font-semibold text-white mb-4">Sobre el Creador</h2>
          <div className="flex flex-col md:flex-row items-center gap-6 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-xl font-bold text-blue-400">Ignacio Lavezzari</h3>
              <p className="text-gray-400">Estudiante y Desarrollador</p>
              <p className="text-gray-300">
                Apasionado por la tecnología y la educación, creé este proyecto como parte de mi formación académica para demostrar cómo el software puede impactar positivamente en el aula.
              </p>

              <div className="pt-4">
                <a
                  href="https://www.linkedin.com/in/ignacio-lavezzari/?originalSubdomain=ar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>Ver perfil de LinkedIn</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 21.227.792 22 1.771 22h20.451C23.202 22 24 21.227 24 20.542V1.729C24 .774 23.202 0 22.225 0z" /></svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
