// Capa de NEGOCIO - Autenticación del administrador
// Maneja usuarios admin, contraseñas con hash y tokens JWT.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Collection } from "mongodb";
import { Usuario } from "../dto/Usuario";
import { ConexionMongo } from "../conexion/ConexionMongo";
import { ErrorNegocio } from "./ErrorNegocio";

export class AuthNegocio {

    private async usuarios(): Promise<Collection<Usuario>> {
        return ConexionMongo.coleccion<Usuario>("usuarios");
    }

    private secreto(): string {
        const secreto = process.env.JWT_SECRET;
        if (!secreto) {
            throw new Error("Falta la variable de entorno JWT_SECRET");
        }
        return secreto;
    }

    async crearAdmin(email: string, password: string): Promise<void> {
        if (!email || !email.includes("@")) {
            throw new ErrorNegocio("Email no válido");
        }
        if (!password || password.length < 8) {
            throw new ErrorNegocio("La contraseña debe tener al menos 8 caracteres");
        }
        const col = await this.usuarios();
        const existente = await col.findOne({ email: email.toLowerCase() });
        if (existente) throw new ErrorNegocio("Ya existe un usuario con ese email", 409);

        const usuario = new Usuario();
        usuario.email = email.toLowerCase();
        usuario.passwordHash = await bcrypt.hash(password, 10);
        usuario.rol = "admin";
        await col.insertOne(usuario);
    }

    async login(email: string, password: string): Promise<string> {
        const col = await this.usuarios();
        const usuario = await col.findOne({ email: (email ?? "").toLowerCase() });

        // Mismo mensaje en ambos casos para no revelar si el email existe
        if (!usuario || !(await bcrypt.compare(password ?? "", usuario.passwordHash))) {
            throw new ErrorNegocio("Credenciales incorrectas", 401);
        }
        return jwt.sign({ sub: usuario._id!.toHexString(), rol: usuario.rol }, this.secreto(), {
            expiresIn: "8h"
        });
    }

    // Devuelve true si el token es válido y pertenece a un admin
    verificarToken(token: string): boolean {
        try {
            const datos = jwt.verify(token, this.secreto()) as jwt.JwtPayload;
            return datos.rol === "admin";
        } catch {
            return false;
        }
    }
}
