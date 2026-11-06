"use strict";

/* ==========================================================
   EspacioPaTodos · Validación de inicio de sesión y registro
   (solo del lado del cliente)

   OJO: esta validación mejora la experiencia, pero NO es la
   seguridad real. El backend repetirá todas estas reglas
   (paso 9), porque el navegador se puede manipular.
   ========================================================== */

/* ---------- 1. Reglas de validación ----------
   Cada función recibe el valor y devuelve un mensaje de error,
   o "" si el valor es correcto. */
const REGLAS = {
    usuario(valor) {
        if (valor === "") return "Escribe un nombre de usuario.";
        if (valor.length < 3) return "El nombre de usuario debe tener al menos 3 caracteres.";
        if (valor.length > 20) return "El nombre de usuario puede tener máximo 20 caracteres.";
        if (!/^[A-Za-z0-9_]+$/.test(valor)) {
            return "Usa solo letras sin acentos, números o guion bajo (_).";
        }
        return "";
    },

    correo(valor) {
        if (valor === "") return "Escribe tu correo electrónico.";
        if (valor.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
            return "Revisa tu correo. Debe verse así: nombre@ejemplo.com";
        }
        return "";
    },

    contrasena(valor) {
        if (valor === "") return "Escribe una contraseña.";
        if (valor.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
        if (valor.length > 64) return "La contraseña puede tener máximo 64 caracteres.";
        if (!/[A-Za-z]/.test(valor)) return "Agrega al menos una letra.";
        if (!/\d/.test(valor)) return "Agrega al menos un número.";
        return "";
    },

    // En el login solo comprobamos que no esté vacía: no revelamos las reglas.
    "contrasena-login"(valor) {
        return valor === "" ? "Escribe tu contraseña." : "";
    },

    confirmar(valor, formulario) {
        if (valor === "") return "Repite la contraseña.";
        const original = formulario.querySelector("#contrasena").value;
        if (valor !== original) return "Las contraseñas no coinciden.";
        return "";
    }
};

/* ---------- 2. Funciones de apoyo ---------- */

// Usuario y correo se limpian de espacios al inicio y al final.
function leerValor(campo) {
    const limpiar = campo.type !== "password";
    return limpiar ? campo.value.trim() : campo.value;
}

// Valida un campo y muestra u oculta su mensaje de error.
function validarCampo(campo, formulario) {
    const regla = REGLAS[campo.dataset.validar];
    if (!regla) return true;

    const mensaje = regla(leerValor(campo), formulario);
    const zonaError = document.getElementById(campo.id + "-error");

    if (zonaError) zonaError.textContent = mensaje;   // textContent: seguro contra XSS
    campo.setAttribute("aria-invalid", mensaje ? "true" : "false");

    return mensaje === "";
}

function mostrarEstado(mensaje, esError) {
    const estado = document.getElementById("estado");
    if (!estado) return;
    estado.textContent = mensaje;
    estado.classList.toggle("estado-error", esError);
}

/* ---------- 3. Botón mostrar / ocultar contraseña ---------- */
function iniciarBotonesVerContrasena() {
    document.querySelectorAll(".ver-contrasena").forEach((boton) => {
        boton.addEventListener("click", () => {
            const campo = document.getElementById(boton.dataset.objetivo);
            if (!campo) return;

            const mostrar = campo.type === "password";
            campo.type = mostrar ? "text" : "password";
            boton.textContent = mostrar ? "Ocultar" : "Mostrar";
            boton.setAttribute("aria-pressed", String(mostrar));
        });
    });
}

/* ---------- 4. Lista de requisitos de la contraseña ---------- */
function iniciarReglasContrasena(formulario) {
    const campo = formulario.querySelector("#contrasena");
    const lista = formulario.querySelector("#reglas-clave");
    if (!campo || !lista) return;

    const pruebas = {
        longitud: (v) => v.length >= 8 && v.length <= 64,
        letra: (v) => /[A-Za-z]/.test(v),
        numero: (v) => /\d/.test(v)
    };

    campo.addEventListener("input", () => {
        lista.querySelectorAll("li").forEach((item) => {
            const prueba = pruebas[item.dataset.regla];
            if (prueba) item.classList.toggle("cumple", prueba(campo.value));
        });
    });
}

/* ---------- 5. Comunicación con el servidor ---------- */
// Mismo host que la página (127.0.0.1 o localhost): así el navegador envía la cookie de sesión.
const URL_API = "http://" + window.location.hostname + ":3000";

// Muestra bajo cada campo el error que mandó el servidor.
function mostrarErroresServidor(errores, formulario) {
    let primero = null;
    Object.entries(errores).forEach(([nombre, mensaje]) => {
        const campo = document.getElementById(nombre);
        const zona = document.getElementById(nombre + "-error");
        if (!campo || !zona || !formulario.contains(campo)) return;

        zona.textContent = mensaje;   // textContent: seguro contra XSS
        campo.setAttribute("aria-invalid", "true");
        if (!primero) primero = campo;
    });
    if (primero) primero.focus();
}

/* ---------- 6. Conectar un formulario ---------- */
// ruta: endpoint del backend (null si no se quiere enviar nada).
// alExito: función que se ejecuta cuando el servidor responde que todo salió bien.
function iniciarFormulario(formulario, ruta, alExito) {
    const campos = Array.from(formulario.querySelectorAll("[data-validar]"));
    const boton = formulario.querySelector('button[type="submit"]');

    campos.forEach((campo) => {
        campo.addEventListener("blur", () => validarCampo(campo, formulario));

        campo.addEventListener("input", () => {
            if (campo.getAttribute("aria-invalid") === "true") {
                validarCampo(campo, formulario);
            }
            if (campo.id === "contrasena") {
                const confirmar = formulario.querySelector("#confirmar");
                if (confirmar && confirmar.value !== "") validarCampo(confirmar, formulario);
            }
        });
    });

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        mostrarEstado("", false);

        const resultados = campos.map((campo) => validarCampo(campo, formulario));
        const primerError = campos.find((_, i) => !resultados[i]);

        if (primerError) {
            primerError.focus();
            mostrarEstado("Hay campos por corregir. Revisa los mensajes en rojo.", true);
            return;
        }

        if (!ruta) {
            mostrarEstado("Datos con formato correcto.", false);
            return;
        }

        // Juntamos los datos usando el atributo name de cada campo
        const datos = {};
        campos.forEach((campo) => { datos[campo.name] = leerValor(campo); });

        // Estado de carga: evita doble clic y le avisa a la persona
        const textoBoton = boton.textContent;
        boton.disabled = true;
        boton.textContent = "Enviando…";
        let terminado = false;

        try {
            const respuesta = await fetch(URL_API + ruta, {
                method: "POST",
                credentials: "include",   // enviar y recibir la cookie de sesión
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });
            const resultado = await respuesta.json();

            if (respuesta.ok) {
                terminado = true;
                mostrarEstado(resultado.mensaje, false);
                if (alExito) alExito();
            } else {
                if (resultado.errores) mostrarErroresServidor(resultado.errores, formulario);
                mostrarEstado(resultado.mensaje || "No pudimos completar la acción.", true);
            }
        } catch (error) {
            // Servidor apagado, sin red, o respuesta que no era JSON
            mostrarEstado("No pudimos conectar con el servidor. Intenta de nuevo en un momento.", true);
        } finally {
            if (!terminado) {
                boton.disabled = false;
                boton.textContent = textoBoton;
            }
        }
    });
}

/* ---------- 7. Arranque ---------- */
document.addEventListener("DOMContentLoaded", () => {
    iniciarBotonesVerContrasena();

    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        iniciarFormulario(formLogin, "/api/login", () => {
            setTimeout(() => { window.location.href = "menu.html"; }, 800);
        });
    }

    const formRegistro = document.getElementById("form-registro");
    if (formRegistro) {
        iniciarReglasContrasena(formRegistro);
        iniciarFormulario(formRegistro, "/api/registro", () => {
            setTimeout(() => { window.location.href = "login.html"; }, 2000);
        });
    }
});
