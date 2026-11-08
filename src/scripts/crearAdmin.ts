// Uso:  npm run crear-admin -- correo@ejemplo.com MiClaveSegura123
// Crea el usuario administrador en la colección "usuarios".

import "dotenv/config";
import { AuthNegocio } from "../negocio/AuthNegocio";
import { ConexionMongo } from "../conexion/ConexionMongo";

async function main() {
    const [email, password] = process.argv.slice(2);
    if (!email || !password) {
        console.log("Uso: npm run crear-admin -- <email> <password>");
        return;
    }
    const auth = new AuthNegocio();
    await auth.crearAdmin(email, password);
    console.log(`Administrador creado: ${email}`);
}

main()
    .catch((error) => console.error("Error:", error.message ?? error))
    .finally(() => ConexionMongo.cerrar());
