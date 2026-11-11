// Tipos que representan lo que devuelve el backend (capa DTO del lado móvil).

export type Genero = "Hombre" | "Mujer" | "Unisex";

// Por ahora la pasarela de pago real no está integrada en el backend.
export type MetodoPago = "transferencia" | "contra_entrega";

export interface Perfume {
    _id: string;
    nombre: string;
    marca: string;
    genero: Genero;
    volumenMl: number;
    precio: number;
    stock: number;
    descripcion?: string;
    imagenUrl?: string;
    activo: boolean;
}

export interface DatosEnvio {
    nombre: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    email: string;
}

export interface ItemPedidoCreado {
    perfumeId: string;
    nombre: string;
    precioUnitario: number;
    cantidad: number;
}

export interface PedidoCreado {
    _id: string;
    cliente: DatosEnvio;
    items: ItemPedidoCreado[];
    total: number;
    metodoPago: string;
    estado: string;
    fechaCreacion: string;
}

export type EstadoPedido = "Pendiente" | "Pagado" | "Enviado" | "Cancelado";

// Datos que el administrador envía al crear o editar un perfume
export interface DatosPerfume {
    nombre: string;
    marca: string;
    genero: Genero;
    volumenMl: number;
    precio: number;
    stock: number;
    descripcion: string;
    imagenUrl: string;
}

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

// Respuesta de GET /admin/reportes/ventas
export interface ReporteVentas {
    periodo: { desde: string | null; hasta: string | null };
    totalPedidos: number;
    pedidosPorEstado: Record<EstadoPedido, number>;
    ventasConfirmadas: number;
    ventasPendientes: number;
    montoCancelado: number;
    ticketPromedio: number;
    perfumesMasVendidos: PerfumeVendido[];
    stockBajo: PerfumeStockBajo[];
    umbralStock: number;
}
