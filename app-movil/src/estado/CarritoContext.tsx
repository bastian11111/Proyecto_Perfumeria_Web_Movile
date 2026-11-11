// Estado del carrito de compras (RF-04). Vive en memoria mientras la app está abierta.
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { Perfume } from "../modelos";

export interface ItemCarrito {
    perfume: Perfume;
    cantidad: number;
}

interface ValorCarrito {
    items: ItemCarrito[];
    total: number;
    cantidadTotal: number;
    cantidadDe: (perfumeId: string) => number;
    agregar: (perfume: Perfume, cantidad?: number) => boolean;
    cambiarCantidad: (perfumeId: string, cantidad: number) => void;
    quitar: (perfumeId: string) => void;
    vaciar: () => void;
}

const Contexto = createContext<ValorCarrito | null>(null);

export function CarritoProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ItemCarrito[]>([]);

    const cantidadDe = useCallback(
        (perfumeId: string) => items.find((i) => i.perfume._id === perfumeId)?.cantidad ?? 0,
        [items]
    );

    // Devuelve false si no se pudo agregar nada (por ejemplo, ya se alcanzó el stock)
    const agregar = useCallback(
        (perfume: Perfume, cantidad: number = 1): boolean => {
            const actual = items.find((i) => i.perfume._id === perfume._id)?.cantidad ?? 0;
            const nueva = Math.min(actual + cantidad, perfume.stock);
            if (nueva <= actual) return false;

            setItems((previos) => {
                const existe = previos.some((i) => i.perfume._id === perfume._id);
                if (existe) {
                    return previos.map((i) =>
                        i.perfume._id === perfume._id ? { perfume, cantidad: nueva } : i
                    );
                }
                return [...previos, { perfume, cantidad: nueva }];
            });
            return true;
        },
        [items]
    );

    const quitar = useCallback((perfumeId: string) => {
        setItems((previos) => previos.filter((i) => i.perfume._id !== perfumeId));
    }, []);

    const cambiarCantidad = useCallback((perfumeId: string, cantidad: number) => {
        setItems((previos) =>
            previos
                .map((i) =>
                    i.perfume._id === perfumeId
                        ? { ...i, cantidad: Math.min(cantidad, i.perfume.stock) }
                        : i
                )
                .filter((i) => i.cantidad > 0)
        );
    }, []);

    const vaciar = useCallback(() => setItems([]), []);

    const total = useMemo(
        () =>
            Math.round(items.reduce((suma, i) => suma + i.perfume.precio * i.cantidad, 0) * 100) /
            100,
        [items]
    );
    const cantidadTotal = useMemo(
        () => items.reduce((suma, i) => suma + i.cantidad, 0),
        [items]
    );

    const valor = useMemo(
        () => ({ items, total, cantidadTotal, cantidadDe, agregar, cambiarCantidad, quitar, vaciar }),
        [items, total, cantidadTotal, cantidadDe, agregar, cambiarCantidad, quitar, vaciar]
    );

    return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrito(): ValorCarrito {
    const valor = useContext(Contexto);
    if (!valor) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
    return valor;
}
