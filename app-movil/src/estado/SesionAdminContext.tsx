// Sesión del administrador. El token vive solo en memoria: al cerrar la app hay que volver a ingresar.
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { estadoDeError } from "../servicios/http";
import { avisar } from "../utilidades/avisos";

interface ValorSesion {
    token: string | null;
    tokenActual: string; // el token, o "" si no hay sesión (las pantallas admin nunca se muestran sin sesión)
    iniciar: (token: string) => void;
    cerrar: () => void;
    // Si el error es 401 (sesión vencida o inválida) cierra la sesión y devuelve true
    manejarSesionVencida: (error: unknown) => boolean;
}

const Contexto = createContext<ValorSesion | null>(null);

export function SesionAdminProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);

    const iniciar = useCallback((nuevo: string) => setToken(nuevo), []);
    const cerrar = useCallback(() => setToken(null), []);

    const manejarSesionVencida = useCallback((error: unknown): boolean => {
        if (estadoDeError(error) === 401) {
            setToken(null);
            avisar("Tu sesión expiró. Inicia sesión nuevamente.");
            return true;
        }
        return false;
    }, []);

    const valor = useMemo(
        () => ({ token, tokenActual: token ?? "", iniciar, cerrar, manejarSesionVencida }),
        [token, iniciar, cerrar, manejarSesionVencida]
    );

    return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesionAdmin(): ValorSesion {
    const valor = useContext(Contexto);
    if (!valor) throw new Error("useSesionAdmin debe usarse dentro de SesionAdminProvider");
    return valor;
}
