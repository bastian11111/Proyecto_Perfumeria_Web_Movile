// Formatea un precio con separador de miles: 95000 -> $95.000
export function formatearPrecio(valor: number): string {
    const entero = Number.isInteger(valor);
    const [parteEntera, parteDecimal] = valor.toFixed(entero ? 0 : 2).split(".");
    const miles = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return "$" + miles + (parteDecimal ? "," + parteDecimal : "");
}

export function nombreMetodoPago(metodo: string): string {
    if (metodo === "transferencia") return "Transferencia bancaria";
    if (metodo === "contra_entrega") return "Pago contra entrega";
    return metodo;
}

// 2026-11-08T16:46:49Z -> 08-11-2026 13:46 (hora local del celular)
export function formatearFecha(iso: string): string {
    const f = new Date(iso);
    if (isNaN(f.getTime())) return iso;
    const dos = (n: number) => String(n).padStart(2, "0");
    return `${dos(f.getDate())}-${dos(f.getMonth() + 1)}-${f.getFullYear()} ${dos(f.getHours())}:${dos(f.getMinutes())}`;
}

// Código corto de pedido: últimos 6 caracteres del id
export function codigoPedido(id: string): string {
    return id.slice(-6).toUpperCase();
}
