"use strict";

/* ==========================================================
   EspacioPaTodos · Interacciones del menú principal
   Nada de lo que se elige aquí se guarda ni se envía a ningún lado.
   ========================================================== */

// Mismo host que la página (127.0.0.1 o localhost): así el navegador envía la cookie de sesión.
const URL_API = "http://" + window.location.hostname + ":3000";

document.addEventListener("DOMContentLoaded", () => {
    comprobarSesion();
    iniciarSalida();
    iniciarRespiracion();
    iniciarChequeo();
});

/* ---------- 0. Sesión ----------
   OJO: esta redirección es solo comodidad. Lo que protege de verdad los datos
   privados es que el SERVIDOR revise la sesión en cada ruta (requerirSesion). */
async function comprobarSesion() {
    try {
        const respuesta = await fetch(URL_API + "/api/yo", { credentials: "include" });

        if (respuesta.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const datos = await respuesta.json();
        const saludo = document.querySelector("#saludo");
        if (saludo && datos.usuario) saludo.textContent = "Hola, " + datos.usuario + ".";   // textContent: seguro contra XSS
    } catch (error) {
        // Servidor apagado: dejamos ver la página sin saludo.
    }
}

function iniciarSalida() {
    const enlace = document.querySelector("#boton-salir");
    if (!enlace) return;

    enlace.addEventListener("click", async (evento) => {
        evento.preventDefault();
        try {
            await fetch(URL_API + "/api/salir", { method: "POST", credentials: "include" });
        } catch (error) {
            // Aunque falle, mandamos a la persona al login.
        }
        window.location.href = "login.html";
    });
}

/* ---------- 1. Cabina de calma (respiración guiada) ---------- */
function iniciarRespiracion() {
    const orbe = document.querySelector("#orbe");
    const textoOrbe = document.querySelector("#orbe-texto");
    const boton = document.querySelector("#respira-boton");
    const estado = document.querySelector("#respira-estado");
    if (!orbe || !textoOrbe || !boton || !estado) return;

    const SEGUNDOS_INHALA = 4;
    const SEGUNDOS_EXHALA = 6;
    const CICLOS_TOTALES = 5;

    let activo = false;
    let ciclo = 0;
    let temporizador = null;

    function fase(nombre, texto, segundos, siguiente) {
        orbe.dataset.fase = nombre;
        textoOrbe.textContent = texto;
        temporizador = setTimeout(siguiente, segundos * 1000);
    }

    function inhalar() {
        if (!activo) return;
        ciclo += 1;
        fase("inhala", "Inhala", SEGUNDOS_INHALA, exhalar);
    }

    function exhalar() {
        if (!activo) return;
        fase("exhala", "Exhala", SEGUNDOS_EXHALA, () => {
            if (ciclo >= CICLOS_TOTALES) {
                detener("Bien hecho. ¿Cómo te sientes ahora?");
            } else {
                inhalar();
            }
        });
    }

    function empezar() {
        activo = true;
        ciclo = 0;
        boton.textContent = "Detener";
        estado.textContent = "Sigue el círculo. Son " + CICLOS_TOTALES + " respiraciones.";
        inhalar();
    }

    function detener(mensaje) {
        activo = false;
        clearTimeout(temporizador);
        orbe.dataset.fase = "reposo";
        textoOrbe.textContent = "Listo/a";
        boton.textContent = "Empezar otra vez";
        estado.textContent = mensaje || "Lo dejamos aquí. Puedes volver cuando quieras.";
    }

    boton.addEventListener("click", () => {
        if (activo) {
            detener();
        } else {
            empezar();
        }
    });
}

/* ---------- 2. ¿Cómo vienes hoy? ---------- */
function iniciarChequeo() {
    const botones = document.querySelectorAll(".chequeo .chip");
    const zona = document.querySelector("#chequeo-respuesta");
    if (!botones.length || !zona) return;

    // Los mensajes son de acompañamiento, no diagnósticos.
    const estados = {
        tranquilo: {
            mensaje: "Qué bueno. Puedes aprovechar para notar qué te ayuda a sentirte así; te servirá en los días más pesados."
        },
        cansado: {
            mensaje: "El cansancio también es una señal. Quizás hoy toque bajar la exigencia y descansar sin culpa.",
            enlace: { texto: "Ver ideas de autocuidado", href: "index.html#explorar" }
        },
        triste: {
            mensaje: "Gracias por notarlo. No tienes que arreglarlo hoy. Contárselo a alguien de confianza puede aligerar un poco.",
            enlace: { texto: "Ver guías para días difíciles", href: "index.html#explorar" },
            urgente: true
        },
        ansioso: {
            mensaje: "Prueba la cabina de calma de al lado: unas cuantas respiraciones lentas pueden ayudarte a bajar el ritmo.",
            enlace: { texto: "Ver guías sobre estrés", href: "index.html#explorar" },
            urgente: true
        },
        enojado: {
            mensaje: "El enojo suele avisar que algo importa o que algo te lastimó. Darte un momento antes de responder puede ayudar.",
            enlace: { texto: "Ver guías sobre convivencia", href: "index.html#explorar" }
        },
        nose: {
            mensaje: "Está bien no saberlo. Puedes empezar explorando los temas y ver cuál se parece a lo que vives.",
            enlace: { texto: "Explorar los temas", href: "index.html#explorar" }
        }
    };

    botones.forEach((boton) => {
        boton.addEventListener("click", () => {
            const datos = estados[boton.dataset.estado];
            if (!datos) return;

            botones.forEach((otro) => otro.setAttribute("aria-pressed", "false"));
            boton.setAttribute("aria-pressed", "true");

            // Construimos la respuesta con createElement + textContent (seguro contra XSS)
            const mensaje = document.createElement("p");
            mensaje.className = "chequeo-mensaje";
            mensaje.textContent = datos.mensaje;
            const piezas = [mensaje];

            if (datos.enlace) {
                const enlace = document.createElement("a");
                enlace.href = datos.enlace.href;
                enlace.textContent = datos.enlace.texto;
                piezas.push(enlace);
            }

            if (datos.urgente) {
                const nota = document.createElement("p");
                nota.append("Si sientes que no puedes más, llama a la Línea de la Vida: ");
                const telefono = document.createElement("a");
                telefono.href = "tel:8009112000";
                telefono.textContent = "800 911 2000";
                nota.append(telefono, ". Es gratuita y atiende las 24 horas.");
                piezas.push(nota);
            }

            zona.replaceChildren(...piezas);
            zona.classList.remove("cambia");
            void zona.offsetWidth;
            zona.classList.add("cambia");
        });
    });
}
