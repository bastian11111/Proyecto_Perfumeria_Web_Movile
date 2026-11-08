// Capa de NEGOCIO - Perfumes (RF-01)
// Toda la lógica y validaciones del catálogo. Usa el DTO Perfume y la
// capa de conexión; nunca se conecta directo a MongoDB.

import { Collection } from "mongodb";
import { Perfume, Genero } from "../dto/Perfume";
import { ConexionMongo } from "../conexion/ConexionMongo";
import { ErrorNegocio, aObjectId } from "./ErrorNegocio";

const GENEROS: Genero[] = ["Hombre", "Mujer", "Unisex"];

export class PerfumeNegocio {

    private async coleccion(): Promise<Collection<Perfume>> {
        return ConexionMongo.coleccion<Perfume>("perfumes");
    }

    private validar(d: Partial<Perfume>): void {
        if (!d.nombre || d.nombre.trim() === "") {
            throw new ErrorNegocio("El nombre es obligatorio");
        }
        if (!d.marca || d.marca.trim() === "") {
            throw new ErrorNegocio("La marca es obligatoria");
        }
        if (!d.genero || !GENEROS.includes(d.genero)) {
            throw new ErrorNegocio("El género debe ser Hombre, Mujer o Unisex");
        }
        if (typeof d.volumenMl !== "number" || !(d.volumenMl > 0)) {
            throw new ErrorNegocio("El volumen (ml) debe ser un número mayor a 0");
        }
        if (typeof d.precio !== "number" || !(d.precio > 0)) {
            throw new ErrorNegocio("El precio debe ser un número mayor a 0");
        }
        if (!Number.isInteger(d.stock) || (d.stock as number) < 0) {
            throw new ErrorNegocio("El stock debe ser un entero igual o mayor a 0");
        }
    }

    // Copia solo los campos permitidos (evita que el cliente inyecte _id, activo, etc.)
    private construir(d: Partial<Perfume>): Omit<Perfume, "_id" | "activo"> {
        return {
            nombre: d.nombre!.trim(),
            marca: d.marca!.trim(),
            genero: d.genero!,
            volumenMl: d.volumenMl!,
            precio: d.precio!,
            stock: d.stock!,
            descripcion: d.descripcion?.trim() ?? "",
            imagenUrl: d.imagenUrl?.trim() ?? ""
        };
    }

    // Catálogo público: solo perfumes activos
    async listarPublicos(): Promise<Perfume[]> {
        const col = await this.coleccion();
        return col.find({ activo: true }).sort({ marca: 1, nombre: 1 }).toArray();
    }

    // Admin: todos, incluidos los dados de baja
    async listarTodos(): Promise<Perfume[]> {
        const col = await this.coleccion();
        return col.find({}).sort({ marca: 1, nombre: 1 }).toArray();
    }

    async obtenerPublico(id: string): Promise<Perfume> {
        const col = await this.coleccion();
        const perfume = await col.findOne({ _id: aObjectId(id), activo: true });
        if (!perfume) throw new ErrorNegocio("Perfume no encontrado", 404);
        return perfume;
    }

    async crear(datos: Partial<Perfume>): Promise<Perfume> {
        this.validar(datos);
        const col = await this.coleccion();

        const nuevo = Object.assign(new Perfume(), this.construir(datos), { activo: true });
        const resultado = await col.insertOne(nuevo);
        nuevo._id = resultado.insertedId;
        return nuevo;
    }

    async editar(id: string, datos: Partial<Perfume>): Promise<void> {
        this.validar(datos);
        const col = await this.coleccion();

        const resultado = await col.updateOne(
            { _id: aObjectId(id) },
            { $set: this.construir(datos) }
        );
        if (resultado.matchedCount === 0) {
            throw new ErrorNegocio("Perfume no encontrado", 404);
        }
    }

    // Baja lógica: el documento se conserva (los pedidos históricos siguen referenciándolo)
    async darDeBaja(id: string): Promise<void> {
        const col = await this.coleccion();
        const resultado = await col.updateOne(
            { _id: aObjectId(id) },
            { $set: { activo: false } }
        );
        if (resultado.matchedCount === 0) {
            throw new ErrorNegocio("Perfume no encontrado", 404);
        }
    }

    async reactivar(id: string): Promise<void> {
        const col = await this.coleccion();
        const resultado = await col.updateOne(
            { _id: aObjectId(id) },
            { $set: { activo: true } }
        );
        if (resultado.matchedCount === 0) {
            throw new ErrorNegocio("Perfume no encontrado", 404);
        }
    }
}
