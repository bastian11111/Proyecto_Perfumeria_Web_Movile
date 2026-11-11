// Capa de SERVICIO (móvil): único lugar que conoce la URL del backend y usa fetch.
import { URL_BASE } from "../config";

// Se usan objetos simples en vez de subclases de Error para evitar problemas de instanceof en React Native.
export interface ErrorServicio {
    esErrorServicio: true;
    mensaje: string;
    estado: number; // código HTTP; 0 = sin conexión
}

function crearError(mensaje: string, estado: number): ErrorServicio {
    return { esErrorServicio: true, mensaje, estado };
}

export function esErrorServicio(e: unknown): e is ErrorServicio {
    return typeof e === "object" && e !== null && (e as ErrorServicio).esErrorServicio === true;
}

export function mensajeDeError(e: unknown): string {
    return esErrorServicio(e) ? e.mensaje : "Ocurrió un error inesperado";
}

export function estadoDeError(e: unknown): number {
    return esErrorServicio(e) ? e.estado : -1;
}

interface Opciones {
    metodo?: "GET" | "POST" | "PUT" | "DELETE";
    cuerpo?: unknown;
    token?: string; // token de administrador (JWT)
}

const TIEMPO_MAXIMO_MS = 10000;

export async function pedirJson<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
    const cabeceras: Record<string, string> = {};
    if (opciones.cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
    if (opciones.token) cabeceras["Authorization"] = `Bearer ${opciones.token}`;

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

    let respuesta: Response;
    try {
        respuesta = await fetch(URL_BASE + ruta, {
            method: opciones.metodo ?? "GET",
            headers: cabeceras,
            body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
            signal: controlador.signal
        });
    } catch {
        throw crearError(
            `No se pudo conectar con el servidor (${URL_BASE}). Revisa que el backend esté encendido y que el celular esté en la misma red Wi-Fi.`,
            0
        );
    } finally {
        clearTimeout(temporizador);
    }

    let datos: any = null;
    try {
        datos = await respuesta.json();
    } catch {
        datos = null;
    }

    if (!respuesta.ok) {
        throw crearError(datos?.mensaje ?? `Error del servidor (${respuesta.status})`, respuesta.status);
    }
    return datos as T;
}
