// Capa de NEGOCIO - Reporte de ventas (panel de administración)
// Resume pedidos, ventas, perfumes más vendidos y alertas de stock bajo.
// Usa los DTO y la capa de conexión; nunca se conecta directo a MongoDB.

import { Filter } from "mongodb";
import { Perfume } from "../dto/Perfume";
import { Pedido, EstadoPedido } from "../dto/Pedido";
import { ConexionMongo } from "../conexion/ConexionMongo";
import { ErrorNegocio } from "./ErrorNegocio";

export interface PerfumeVendido {
    perfumeId: string;
    nombre: string;
    unidades: number;
    ingresos: number;
}

export interface PerfumeStockBajo {
    perfumeId: string;
    nombre: string;
    marca: string;
    stock: number;
}

export interface ReporteVentas {
    periodo: { desde: string | null; hasta: string | null };
    totalPedidos: number;
    pedidosPorEstado: Record<EstadoPedido, number>;
    ventasConfirmadas: number; // pedidos Pagados + Enviados
    ventasPendientes: number; // pedidos Pendientes (por cobrar)
    montoCancelado: number;
    ticketPromedio: number; // ventas confirmadas / cantidad de pedidos confirmados
    perfumesMasVendidos: PerfumeVendido[]; // solo ventas confirmadas, top 5
    stockBajo: PerfumeStockBajo[]; // perfumes activos con stock <= umbral, hasta 10
    umbralStock: number;
}

const redondear = (n: number): number => Math.round(n * 100) / 100;

export class ReporteNegocio {

    private leerFecha(texto: string | undefined, nombre: string): Date | undefined {
        if (texto === undefined) return undefined;
        const fecha = new Date(texto);
        if (isNaN(fecha.getTime())) {
            throw new ErrorNegocio(`La fecha "${nombre}" no es válida`);
        }
        return fecha;
    }

    // desde / hasta: fechas ISO opcionales (ej. 2026-11-01 o 2026-11-01T00:00:00Z)
    async ventas(
        desdeTexto?: string,
        hastaTexto?: string,
        umbralTexto?: string
    ): Promise<ReporteVentas> {
        const desde = this.leerFecha(desdeTexto, "desde");
        const hasta = this.leerFecha(hastaTexto, "hasta");
        if (desde && hasta && desde > hasta) {
            throw new ErrorNegocio('La fecha "desde" no puede ser posterior a "hasta"');
        }

        let umbral = 5;
        if (umbralTexto !== undefined) {
            umbral = Number(umbralTexto);
            if (!Number.isInteger(umbral) || umbral < 0) {
                throw new ErrorNegocio("El umbral de stock debe ser un entero igual o mayor a 0");
            }
        }

        const colPedidos = await ConexionMongo.coleccion<Pedido>("pedidos");
        const colPerfumes = await ConexionMongo.coleccion<Perfume>("perfumes");

        const rango: { $gte?: Date; $lte?: Date } = {};
        if (desde) rango.$gte = desde;
        if (hasta) rango.$lte = hasta;
        const filtro = (desde || hasta ? { fechaCreacion: rango } : {}) as Filter<Pedido>;
        const pedidos = await colPedidos.find(filtro).toArray();

        const porEstado: Record<EstadoPedido, number> = {
            Pendiente: 0,
            Pagado: 0,
            Enviado: 0,
            Cancelado: 0
        };
        let confirmadas = 0;
        let pendientes = 0;
        let canceladas = 0;
        let pedidosConfirmados = 0;
        const vendidos = new Map<string, PerfumeVendido>();

        for (const p of pedidos) {
            porEstado[p.estado] += 1;

            if (p.estado === "Pagado" || p.estado === "Enviado") {
                confirmadas += p.total;
                pedidosConfirmados += 1;
                for (const it of p.items) {
                    const id = it.perfumeId.toHexString();
                    const acumulado = vendidos.get(id) ?? {
                        perfumeId: id,
                        nombre: it.nombre,
                        unidades: 0,
                        ingresos: 0
                    };
                    acumulado.unidades += it.cantidad;
                    acumulado.ingresos += it.precioUnitario * it.cantidad;
                    vendidos.set(id, acumulado);
                }
            } else if (p.estado === "Pendiente") {
                pendientes += p.total;
            } else {
                canceladas += p.total;
            }
        }

        const masVendidos = [...vendidos.values()]
            .sort((a, b) => b.unidades - a.unidades || b.ingresos - a.ingresos)
            .slice(0, 5)
            .map((v) => ({ ...v, ingresos: redondear(v.ingresos) }));

        const bajos = await colPerfumes
            .find({ activo: true, stock: { $lte: umbral } })
            .sort({ stock: 1, nombre: 1 })
            .limit(10)
            .toArray();

        return {
            periodo: {
                desde: desde ? desde.toISOString() : null,
                hasta: hasta ? hasta.toISOString() : null
            },
            totalPedidos: pedidos.length,
            pedidosPorEstado: porEstado,
            ventasConfirmadas: redondear(confirmadas),
            ventasPendientes: redondear(pendientes),
            montoCancelado: redondear(canceladas),
            ticketPromedio: pedidosConfirmados > 0 ? redondear(confirmadas / pedidosConfirmados) : 0,
            perfumesMasVendidos: masVendidos,
            stockBajo: bajos.map((p) => ({
                perfumeId: p._id!.toHexString(),
                nombre: p.nombre,
                marca: p.marca,
                stock: p.stock
            })),
            umbralStock: umbral
        };
    }
}
