// Capa de SERVICIO
// Único trabajo: recibir peticiones HTTP, llamar a la capa de negocio y
// devolver la respuesta en JSON. No tiene reglas de negocio propias.

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PerfumeNegocio } from "../negocio/PerfumeNegocio";
import { PedidoNegocio } from "../negocio/PedidoNegocio";
import { AuthNegocio } from "../negocio/AuthNegocio";
import { ReporteNegocio } from "../negocio/ReporteNegocio";
import { ErrorNegocio } from "../negocio/ErrorNegocio";

const app = express();
app.use(cors());
app.use(express.json());

const perfumes = new PerfumeNegocio();
const pedidos = new PedidoNegocio();
const auth = new AuthNegocio();
const reportes = new ReporteNegocio();

// Envuelve un handler async para que cualquier error llegue al manejador central
const ruta =
    (fn: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => {
        fn(req, res).catch(next);
    };

// Middleware: exige un token de administrador (la verificación vive en negocio)
const requiereAdmin = (req: Request, res: Response, next: NextFunction) => {
    const cabecera = req.headers.authorization ?? "";
    const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : "";
    if (!token || !auth.verificarToken(token)) {
        res.status(401).json({ mensaje: "No autorizado" });
        return;
    }
    next();
};

// ---------- Autenticación ----------
app.post("/auth/login", ruta(async (req, res) => {
    const token = await auth.login(req.body.email, req.body.password);
    res.json({ token });
}));

// ---------- Catálogo público (RF-03) ----------
app.get("/perfumes", ruta(async (req, res) => {
    res.json(await perfumes.listarPublicos());
}));

app.get("/perfumes/:id", ruta(async (req, res) => {
    res.json(await perfumes.obtenerPublico(req.params.id));
}));

// ---------- Pedidos del cliente (RF-04 / RF-05) ----------
app.post("/pedidos", ruta(async (req, res) => {
    const pedido = await pedidos.crear(req.body.cliente, req.body.items, req.body.metodoPago);
    res.status(201).json({ mensaje: "Pedido registrado correctamente", pedido });
}));

// ---------- Admin: perfumes (RF-01) ----------
app.get("/admin/perfumes", requiereAdmin, ruta(async (req, res) => {
    res.json(await perfumes.listarTodos());
}));

app.post("/admin/perfumes", requiereAdmin, ruta(async (req, res) => {
    const creado = await perfumes.crear(req.body);
    res.status(201).json(creado);
}));

app.put("/admin/perfumes/:id", requiereAdmin, ruta(async (req, res) => {
    await perfumes.editar(req.params.id, req.body);
    res.json({ mensaje: "Perfume actualizado correctamente" });
}));

app.delete("/admin/perfumes/:id", requiereAdmin, ruta(async (req, res) => {
    await perfumes.darDeBaja(req.params.id);
    res.json({ mensaje: "Perfume dado de baja" });
}));

app.put("/admin/perfumes/:id/reactivar", requiereAdmin, ruta(async (req, res) => {
    await perfumes.reactivar(req.params.id);
    res.json({ mensaje: "Perfume reactivado" });
}));

// ---------- Admin: pedidos (RF-06) ----------
app.get("/admin/pedidos", requiereAdmin, ruta(async (req, res) => {
    const estado = typeof req.query.estado === "string" ? req.query.estado : undefined;
    res.json(await pedidos.listar(estado));
}));

app.get("/admin/pedidos/:id", requiereAdmin, ruta(async (req, res) => {
    res.json(await pedidos.obtener(req.params.id));
}));

app.put("/admin/pedidos/:id/estado", requiereAdmin, ruta(async (req, res) => {
    await pedidos.cambiarEstado(req.params.id, req.body.estado);
    res.json({ mensaje: "Estado actualizado correctamente" });
}));

// ---------- Admin: reporte de ventas ----------
// GET /admin/reportes/ventas?desde=2026-11-01&hasta=2026-11-30&umbralStock=5 (todos los parámetros son opcionales)
app.get("/admin/reportes/ventas", requiereAdmin, ruta(async (req, res) => {
    const leer = (valor: unknown): string | undefined =>
        typeof valor === "string" && valor !== "" ? valor : undefined;
    res.json(
        await reportes.ventas(leer(req.query.desde), leer(req.query.hasta), leer(req.query.umbralStock))
    );
}));

// ---------- Manejo central de errores ----------
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof ErrorNegocio) {
        res.status(error.estado).json({ mensaje: error.message });
        return;
    }
    console.error(error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
});

const PUERTO = Number(process.env.PUERTO ?? 3001);
app.listen(PUERTO, () => {
    console.log(`Servidor REST corriendo en http://localhost:${PUERTO}`);
});
