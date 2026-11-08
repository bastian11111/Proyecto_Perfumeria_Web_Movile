// Capa CONEXION
// Es la ÚNICA clase que habla con MongoDB. No conoce reglas de negocio:
// solo abre la conexión (una sola vez) y entrega colecciones o sesiones.

import { MongoClient, Db, Collection, Document, ClientSession } from "mongodb";

export class ConexionMongo {
    private static cliente: MongoClient | null = null;
    private static db: Db | null = null;

    static async conectar(): Promise<Db> {
        if (!ConexionMongo.db) {
            const uri = process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017";
            const nombreBD = process.env.MONGO_DB ?? "perfumeria";

            ConexionMongo.cliente = new MongoClient(uri);
            await ConexionMongo.cliente.connect();
            ConexionMongo.db = ConexionMongo.cliente.db(nombreBD);
            console.log(`Conectado a MongoDB (base: ${nombreBD})`);
        }
        return ConexionMongo.db;
    }

    static async coleccion<T extends Document>(nombre: string): Promise<Collection<T>> {
        const db = await ConexionMongo.conectar();
        return db.collection<T>(nombre);
    }

    // Se usa solo cuando se necesitan transacciones (requiere replica set).
    static async iniciarSesion(): Promise<ClientSession> {
        await ConexionMongo.conectar();
        return ConexionMongo.cliente!.startSession();
    }

    static async cerrar(): Promise<void> {
        if (ConexionMongo.cliente) {
            await ConexionMongo.cliente.close();
            ConexionMongo.cliente = null;
            ConexionMongo.db = null;
        }
    }
}
