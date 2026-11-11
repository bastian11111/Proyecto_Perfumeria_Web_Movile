// Validaciones locales de la capa UI (el backend las vuelve a validar).
import { DatosEnvio } from "../modelos";

export interface ErroresEnvio {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    email?: string;
}

export function validarEnvio(d: DatosEnvio): ErroresEnvio {
    const e: ErroresEnvio = {};
    if (d.nombre.trim().length < 3) e.nombre = "Ingresa tu nombre completo";
    if (!/^[0-9+\s-]{7,15}$/.test(d.telefono.trim())) {
        e.telefono = "Teléfono no válido (7 a 15 caracteres: números, +, espacios o -)";
    }
    if (d.direccion.trim().length < 5) e.direccion = "Ingresa una dirección completa";
    if (d.ciudad.trim().length < 2) e.ciudad = "Ingresa tu ciudad";
    if (d.email.trim() !== "" && !/^\S+@\S+\.\S+$/.test(d.email.trim())) {
        e.email = "Correo no válido";
    }
    return e;
}
