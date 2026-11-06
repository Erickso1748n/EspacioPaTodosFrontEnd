"use strict";

/* ==========================================================
   EspacioPaTodos · Portada (index.html)

   Tres cosas:
   1. Traductor humano-alien   (botones con data-frase)
   2. Mapa de planetas         (botones con data-tema)
   3. Sesión: si ya iniciaste sesión, cambia los botones del encabezado

   Patrón de las dos primeras: el botón trae un identificador en un
   atributo data-*, buscamos ese identificador en un objeto con los
   textos y lo mostramos con textContent (seguro contra XSS).
   ========================================================== */

// Mismo host que la página (127.0.0.1 o localhost): así el navegador envía la cookie de sesión.
const URL_API = "http://" + window.location.hostname + ":3000";

/* ---------- Textos del traductor (el índice coincide con data-frase) ---------- */
const TRADUCCIONES = [
    "«No quiero hablar de esto ahora» o «No sé cómo explicar lo que siento».",
    "«Sí me molestó o me dolió, pero no quiero causar problemas».",
    "«Estoy cansado/a de algo más que de sueño: de aguantar, de fingir o de cargar con algo».",
    "«Sí me importa, pero siento que nadie me va a escuchar»."
];

/* ---------- Guías del mapa (la clave coincide con data-tema) ---------- */
const TEMAS = {
    emociones: {
        titulo: "Emociones y días difíciles",
        frase: "Hay días en los que todo pesa más y no siempre sabes por qué. Le pasa a mucha gente.",
        puntos: [
            "Ponle nombre a lo que sientes, aunque sea con una sola palabra: suele bajar un poco la intensidad.",
            "No tienes que resolverlo hoy. A veces basta con cuidar lo básico: comer, tomar agua y descansar.",
            "Contárselo a alguien de confianza no te hace débil; suele aligerar la carga."
        ],
        aviso: "Si estos días se vuelven frecuentes o sientes que no puedes con ellos, hablar con un profesional puede ayudarte."
    },
    duelo: {
        titulo: "Duelo y pérdida",
        frase: "Perder a alguien o algo importante duele, y no hay una forma ni un tiempo correctos de vivirlo.",
        puntos: [
            "Llorar, enojarte o no sentir nada son reacciones normales; no tienes que explicarlas.",
            "Recordar a esa persona puede ayudarte: escribirle, mirar fotos o hablar de ella.",
            "Las fechas especiales pueden ser más duras; si puedes, procura no pasarlas a solas."
        ],
        aviso: "Si el dolor te impide dormir, comer o hacer tus actividades durante varias semanas, conviene buscar acompañamiento profesional."
    },
    bullying: {
        titulo: "Bullying y convivencia",
        frase: "Lo que te hacen no es tu culpa. Que alguien te trate mal no dice nada malo de ti.",
        puntos: [
            "Guarda evidencia si puedes: capturas de pantalla, fechas y lo que pasó.",
            "Cuéntaselo a una persona adulta de confianza: familiar, docente, tutor u orientador.",
            "No tienes que resolverlo solo/a, ni responder de la misma forma."
        ],
        aviso: "Si hay golpes, amenazas o te sientes en peligro, avisa de inmediato a una persona adulta."
    },
    autocuidado: {
        titulo: "Autocuidado y autoestima",
        frase: "Cuidarte no es egoísmo. Es lo que te permite seguir con todo lo demás.",
        puntos: [
            "Empieza pequeño: dormir un poco mejor, moverte un rato o comer algo que te guste.",
            "Fíjate cómo te hablas: si no se lo dirías a un amigo, quizá tampoco te lo mereces a ti.",
            "Anota algo que hiciste bien esta semana, por pequeño que sea."
        ],
        aviso: "Si sientes con frecuencia que no vales nada, no lo cargues solo/a: puede ayudarte hablarlo con un profesional."
    },
    familia: {
        titulo: "Problemas personales y familiares",
        frase: "Los problemas en casa se sienten en todo: el ánimo, la escuela, el sueño. No tienes que cargarlos solo/a.",
        puntos: [
            "Busca un espacio tranquilo donde puedas descansar o pensar, aunque sea un rato al día.",
            "Piensa en una persona de confianza (familiar, amistad o docente) con quien puedas hablar.",
            "Los problemas de los adultos no son tu responsabilidad; tu trabajo es cuidarte."
        ],
        aviso: "Si en casa hay violencia o te sientes inseguro/a, busca ayuda de inmediato con una persona adulta de confianza."
    },
    estres: {
        titulo: "Estrés y presión escolar",
        frase: "La presión de la escuela puede sentirse enorme. Hay formas de hacerla más pequeña.",
        puntos: [
            "Divide las tareas grandes en pasos chiquitos y empieza por el más fácil.",
            "Los descansos cortos ayudan más que estudiar horas sin parar. Puedes usar la cabina de calma de tu espacio.",
            "Si sientes que no llegas a todo, decirlo a tiempo a tu docente o tutor suele abrir opciones."
        ],
        aviso: "Si el estrés o la ansiedad te impiden dormir, comer o ir a clases, conviene buscar apoyo profesional."
    }
};

document.addEventListener("DOMContentLoaded", () => {
    iniciarTraductor();
    iniciarMapa();
    ajustarSegunSesion();
});

/* ---------- 1. Traductor humano-alien ---------- */
function iniciarTraductor() {
    const botones = document.querySelectorAll(".traductor-frases .chip");
    const texto = document.querySelector("#traductor-texto");
    if (!botones.length || !texto) return;

    botones.forEach((boton) => {
        boton.addEventListener("click", () => {
            const traduccion = TRADUCCIONES[Number(boton.dataset.frase)];
            if (!traduccion) return;

            // Solo un botón marcado a la vez
            botones.forEach((otro) => otro.setAttribute("aria-pressed", "false"));
            boton.setAttribute("aria-pressed", "true");

            texto.textContent = traduccion;

            // Reinicia la animación de aparición
            texto.classList.remove("cambia");
            void texto.offsetWidth;
            texto.classList.add("cambia");
        });
    });
}

/* ---------- 2. Mapa de planetas ---------- */
function iniciarMapa() {
    const astros = document.querySelectorAll(".astro");
    const panel = document.querySelector("#panel-tema");
    if (!astros.length || !panel) return;

    astros.forEach((astro) => {
        astro.addEventListener("click", () => {
            const datos = TEMAS[astro.dataset.tema];
            if (!datos) return;

            astros.forEach((otro) => otro.setAttribute("aria-pressed", "false"));
            astro.setAttribute("aria-pressed", "true");

            panel.replaceChildren(construirPanel(datos));
            panel.scrollIntoView({ block: "nearest" });   // en el celular, que el panel quede a la vista
        });
    });
}

// Arma el panel con createElement + textContent (nunca innerHTML con texto variable).
function construirPanel(datos) {
    const contenido = document.createElement("div");
    contenido.className = "panel-contenido";

    const encabezado = document.createElement("div");
    const titulo = document.createElement("h3");
    titulo.textContent = datos.titulo;
    const frase = document.createElement("p");
    frase.className = "panel-frase";
    frase.textContent = datos.frase;
    encabezado.append(titulo, frase);

    const lista = document.createElement("ul");
    lista.className = "panel-puntos";
    datos.puntos.forEach((punto) => {
        const item = document.createElement("li");
        item.textContent = punto;
        lista.append(item);
    });

    const aviso = document.createElement("p");
    aviso.className = "panel-aviso";
    const linea = document.createElement("a");
    linea.href = "tel:8009112000";
    linea.textContent = "800 911 2000";
    const emergencia = document.createElement("a");
    emergencia.href = "tel:911";
    emergencia.textContent = "911";
    aviso.append(
        datos.aviso + " Para hablar con alguien ahora, la Línea de la Vida es gratuita y atiende las 24 horas: ",
        linea,
        ". Si estás en peligro, llama al ",
        emergencia,
        "."
    );

    contenido.append(encabezado, lista, aviso);
    return contenido;
}

/* ---------- 3. Sesión ----------
   La portada es pública: se ve igual con o sin sesión. Solo preguntamos al
   servidor si hay una sesión iniciada para cambiar los botones del encabezado. */
async function ajustarSegunSesion() {
    try {
        const respuesta = await fetch(URL_API + "/api/yo", { credentials: "include" });
        if (!respuesta.ok) return;   // 401: no hay sesión, la portada queda como está

        const datos = await respuesta.json();
        mostrarBotonesDeSesion(datos.usuario);
    } catch (error) {
        // Servidor apagado: la portada sigue funcionando sin sesión.
    }
}

function mostrarBotonesDeSesion(nombre) {
    const zona = document.querySelector(".acciones-cuenta");
    if (zona) {
        const miEspacio = document.createElement("a");
        miEspacio.className = "boton-login";
        miEspacio.href = "menu.html";
        miEspacio.textContent = "Mi espacio";
        miEspacio.title = "Sesión de " + nombre;

        const salir = document.createElement("a");
        salir.className = "boton-registro";
        salir.href = "#";
        salir.textContent = "Cerrar sesión";
        salir.addEventListener("click", cerrarSesion);

        zona.replaceChildren(miEspacio, salir);
    }

    const crear = document.querySelector(".hero-acciones .boton-contorno");
    if (crear) {
        crear.href = "menu.html";
        crear.textContent = "Ir a mi espacio";
    }
}

async function cerrarSesion(evento) {
    evento.preventDefault();
    try {
        await fetch(URL_API + "/api/salir", { method: "POST", credentials: "include" });
    } catch (error) {
        // Aunque falle, recargamos: si la sesión sigue viva, la portada lo mostrará.
    }
    window.location.reload();
}
