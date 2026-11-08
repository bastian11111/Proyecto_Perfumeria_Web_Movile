// Pruebas END-TO-END automáticas.
// Hacen peticiones HTTP reales contra el servidor en ejecución y verifican
// las respuestas, el descuento de stock, el flujo de estados y la seguridad.
//
// Requisitos:
//   1) Servidor corriendo:   npm run dev
//   2) Admin creado:         npm run crear-admin -- admin@perfumeria.com MiClaveSegura123
//
// Uso:
//   npm run test:e2e -- admin@perfumeria.com MiClaveSegura123
//   (o con las variables E2E_EMAIL y E2E_PASSWORD; URL_BASE opcional)
//
// Al terminar borra los perfumes y pedidos de prueba que él mismo creó
// (solo por los IDs exactos que creó, nunca por búsquedas amplias).

import "dotenv/config";
import { ObjectId } from "mongodb";
import { ConexionMongo } from "../conexion/ConexionMongo";

const BASE = process.env.URL_BASE ?? `http://localhost:${process.env.PUERTO ?? 3001}`;
const EMAIL = process.argv[2] ?? process.env.E2E_EMAIL;
const PASSWORD = process.argv[3] ?? process.env.E2E_PASSWORD;

let pasaron = 0;
let fallaron = 0;
const perfumesCreados: string[] = [];
const pedidosCreados: string[] = [];

interface Respuesta {
    estado: number;
    datos: any;
}

async function llamar(
    metodo: string,
    ruta: string,
    cuerpo?: unknown,
    token?: string
): Promise<Respuesta> {
    const cabeceras: Record<string, string> = {};
    if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
    if (token) cabeceras["Authorization"] = `Bearer ${token}`;

    const r = await fetch(BASE + ruta, {
        method: metodo,
        headers: cabeceras,
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
    });
    let datos: any = null;
    try {
        datos = await r.json();
    } catch {
        datos = null;
    }
    return { estado: r.status, datos };
}

function comprobar(nombre: string, condicion: boolean, detalle: string = ""): void {
    if (condicion) {
        pasaron++;
        console.log(`  OK     ${nombre}`);
    } else {
        fallaron++;
        console.log(`  FALLO  ${nombre}${detalle ? "  -> " + detalle : ""}`);
    }
}

const clienteValido = {
    nombre: "E2E Test",
    telefono: "+56 9 1234 5678",
    direccion: "Av. Siempre Viva 123",
    ciudad: "Santiago"
};

function nuevoPerfume(sufijo: string, stock: number, precio: number) {
    return {
        nombre: `E2E ${sufijo} ${Date.now()}`,
        marca: "E2E Marca",
        genero: "Unisex",
        volumenMl: 100,
        precio,
        stock,
        descripcion: "Perfume de prueba end-to-end",
        imagenUrl: ""
    };
}

async function crearPerfume(token: string, sufijo: string, stock: number, precio: number) {
    const r = await llamar("POST", "/admin/perfumes", nuevoPerfume(sufijo, stock, precio), token);
    if (r.datos && r.datos._id) perfumesCreados.push(r.datos._id);
    return r;
}

async function pedir(perfumeId: string, cantidad: number, cliente: unknown = clienteValido) {
    const r = await llamar("POST", "/pedidos", {
        cliente,
        items: [{ perfumeId, cantidad }],
        metodoPago: "transferencia"
    });
    if (r.datos && r.datos.pedido && r.datos.pedido._id) pedidosCreados.push(r.datos.pedido._id);
    return r;
}

async function ejecutar(): Promise<void> {
    // ---------- Seguridad ----------
    console.log("\n[Seguridad]");
    let r = await llamar("GET", "/admin/pedidos");
    comprobar("Sin token, /admin/pedidos responde 401", r.estado === 401, `estado ${r.estado}`);

    r = await llamar("GET", "/admin/pedidos", undefined, "token-falso");
    comprobar("Con token falso responde 401", r.estado === 401, `estado ${r.estado}`);

    r = await llamar("POST", "/auth/login", { email: EMAIL, password: "clave-incorrecta" });
    comprobar("Login con clave incorrecta responde 401", r.estado === 401, `estado ${r.estado}`);

    r = await llamar("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
    comprobar("Login correcto responde 200 con token", r.estado === 200 && !!r.datos?.token, `estado ${r.estado}`);
    if (!r.datos?.token) {
        console.log("\nNo se pudo iniciar sesión: se detienen las pruebas.");
        return;
    }
    const token: string = r.datos.token;

    // ---------- Perfumes ----------
    console.log("\n[Perfumes: RF-01 / RF-03]");
    r = await llamar("POST", "/admin/perfumes", { ...nuevoPerfume("Invalido", 1, -5) }, token);
    comprobar("Precio negativo responde 400", r.estado === 400, `estado ${r.estado}`);

    r = await crearPerfume(token, "Principal", 5, 99000);
    comprobar("Crear perfume responde 201", r.estado === 201 && !!r.datos?._id, `estado ${r.estado}`);
    const perfumeId: string = r.datos?._id;
    if (!perfumeId) {
        console.log("\nNo se pudo crear el perfume: se detienen las pruebas.");
        return;
    }

    r = await llamar("GET", "/perfumes");
    comprobar(
        "El perfume aparece en el catálogo público",
        r.estado === 200 && Array.isArray(r.datos) && r.datos.some((p: any) => p._id === perfumeId)
    );

    // ---------- Pedidos y stock ----------
    console.log("\n[Pedidos y stock: RF-02 / RF-04 / RF-05]");
    r = await pedir(perfumeId, 1, { nombre: "E2E Test" });
    comprobar("Pedido sin datos de envío responde 400", r.estado === 400, `estado ${r.estado}`);

    r = await pedir(perfumeId, 2);
    comprobar("Pedido válido responde 201", r.estado === 201, `estado ${r.estado}`);
    comprobar(
        "El estado inicial es Pendiente",
        r.datos?.pedido?.estado === "Pendiente",
        String(r.datos?.pedido?.estado)
    );
    comprobar(
        "El total es 2 x 99000",
        r.datos?.pedido?.total === 198000,
        String(r.datos?.pedido?.total)
    );
    const pedidoId: string = r.datos?.pedido?._id;

    r = await llamar("GET", `/perfumes/${perfumeId}`);
    comprobar("El stock bajó de 5 a 3", r.datos?.stock === 3, `stock ${r.datos?.stock}`);

    r = await pedir(perfumeId, 4);
    comprobar("Pedir más que el stock (4 > 3) responde 409", r.estado === 409, `estado ${r.estado}`);

    r = await llamar("GET", `/perfumes/${perfumeId}`);
    comprobar("Tras el pedido rechazado el stock sigue en 3", r.datos?.stock === 3, `stock ${r.datos?.stock}`);

    r = await pedir("esto-no-es-un-id", 1);
    comprobar("Identificador inválido responde 400", r.estado === 400, `estado ${r.estado}`);

    // ---------- Concurrencia ----------
    console.log("\n[Concurrencia: último frasco]");
    r = await crearPerfume(token, "UltimoFrasco", 1, 50000);
    const ultimoId: string = r.datos?._id;
    if (ultimoId) {
        const [a, b] = await Promise.all([pedir(ultimoId, 1), pedir(ultimoId, 1)]);
        const estados = [a.estado, b.estado].sort();
        comprobar(
            "Dos compras simultáneas del último frasco: una gana (201) y otra falla (409)",
            estados[0] === 201 && estados[1] === 409,
            `estados ${estados.join(", ")}`
        );
        r = await llamar("GET", `/perfumes/${ultimoId}`);
        comprobar("El stock final es 0 (nunca negativo)", r.datos?.stock === 0, `stock ${r.datos?.stock}`);
    } else {
        comprobar("Crear perfume para la prueba de concurrencia", false, `estado ${r.estado}`);
    }

    // ---------- Panel de pedidos ----------
    console.log("\n[Panel de pedidos: RF-06]");
    r = await llamar("PUT", `/admin/pedidos/${pedidoId}/estado`, { estado: "Enviado" }, token);
    comprobar("Saltar Pendiente -> Enviado responde 409", r.estado === 409, `estado ${r.estado}`);

    r = await llamar("PUT", `/admin/pedidos/${pedidoId}/estado`, { estado: "Pagado" }, token);
    comprobar("Pendiente -> Pagado responde 200", r.estado === 200, `estado ${r.estado}`);

    r = await llamar("PUT", `/admin/pedidos/${pedidoId}/estado`, { estado: "Enviado" }, token);
    comprobar("Pagado -> Enviado responde 200", r.estado === 200, `estado ${r.estado}`);

    r = await llamar("GET", "/admin/pedidos?estado=Enviado", undefined, token);
    comprobar(
        "El filtro por estado Enviado incluye el pedido",
        r.estado === 200 && Array.isArray(r.datos) && r.datos.some((p: any) => p._id === pedidoId)
    );

    // ---------- Baja lógica ----------
    console.log("\n[Baja lógica]");
    r = await llamar("DELETE", `/admin/perfumes/${perfumeId}`, undefined, token);
    comprobar("Dar de baja responde 200", r.estado === 200, `estado ${r.estado}`);

    r = await llamar("GET", `/perfumes/${perfumeId}`);
    comprobar("El perfume dado de baja responde 404 en el catálogo", r.estado === 404, `estado ${r.estado}`);

    r = await llamar("GET", "/perfumes");
    comprobar(
        "El perfume dado de baja no aparece en el listado público",
        r.estado === 200 && Array.isArray(r.datos) && !r.datos.some((p: any) => p._id === perfumeId)
    );

    r = await llamar("GET", `/admin/pedidos/${pedidoId}`, undefined, token);
    comprobar(
        "El pedido histórico conserva nombre y precio del perfume",
        r.estado === 200 && !!r.datos?.items?.[0]?.nombre && r.datos.items[0].precioUnitario === 99000
    );

    r = await pedir(perfumeId, 1);
    comprobar("Pedir un perfume dado de baja responde 409", r.estado === 409, `estado ${r.estado}`);
}

// Borra SOLO los documentos que esta prueba creó (por ID exacto)
async function limpiar(): Promise<void> {
    try {
        const colPedidos = await ConexionMongo.coleccion("pedidos");
        const colPerfumes = await ConexionMongo.coleccion("perfumes");
        for (const id of pedidosCreados) {
            await colPedidos.deleteOne({ _id: new ObjectId(id) });
        }
        for (const id of perfumesCreados) {
            await colPerfumes.deleteOne({ _id: new ObjectId(id) });
        }
        console.log(
            `\nLimpieza: ${pedidosCreados.length} pedido(s) y ${perfumesCreados.length} perfume(s) de prueba eliminados.`
        );
    } catch (error) {
        console.log("\nNo se pudo limpiar la base de datos de prueba:", error);
    } finally {
        await ConexionMongo.cerrar();
    }
}

async function main(): Promise<void> {
    if (!EMAIL || !PASSWORD) {
        console.log("Uso: npm run test:e2e -- <email-admin> <password-admin>");
        process.exitCode = 1;
        return;
    }

    console.log(`Pruebas end-to-end contra ${BASE}`);
    try {
        await ejecutar();
    } catch (error) {
        fallaron++;
        console.log("\nError inesperado (¿está corriendo el servidor?):", error);
    }
    await limpiar();

    console.log(`\nResultado: ${pasaron} correctas, ${fallaron} con fallo.`);
    if (fallaron > 0) process.exitCode = 1;
}

main();
