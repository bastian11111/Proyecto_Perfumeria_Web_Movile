// Carga perfumes de ejemplo para probar el catálogo de la app.
// Usa la capa de NEGOCIO (mismas validaciones que la API) y no duplica:
// si un perfume con el mismo nombre y marca ya existe, lo salta.
//
// Uso (no necesita que el servidor esté corriendo, solo MongoDB):
//   npx ts-node src/scripts/cargarDemo.ts
//
// Para ver imágenes en la app, edita "imagenUrl" con un enlace https:// antes de ejecutarlo.

import "dotenv/config";
import { PerfumeNegocio } from "../negocio/PerfumeNegocio";
import { ConexionMongo } from "../conexion/ConexionMongo";
import { Perfume } from "../dto/Perfume";

const DEMO: Partial<Perfume>[] = [
    {
        nombre: "Sauvage",
        marca: "Dior",
        genero: "Hombre",
        volumenMl: 100,
        precio: 99990,
        stock: 12,
        descripcion: "Fragancia fresca y especiada con notas de bergamota y pimienta.",
        imagenUrl: ""
    },
    {
        nombre: "Bleu de Chanel",
        marca: "Chanel",
        genero: "Hombre",
        volumenMl: 100,
        precio: 129990,
        stock: 8,
        descripcion: "Aromática y amaderada, elegante para uso diario.",
        imagenUrl: ""
    },
    {
        nombre: "La Vie Est Belle",
        marca: "Lancôme",
        genero: "Mujer",
        volumenMl: 75,
        precio: 109990,
        stock: 10,
        descripcion: "Dulce y floral, con notas de iris, pachulí y vainilla.",
        imagenUrl: ""
    },
    {
        nombre: "Good Girl",
        marca: "Carolina Herrera",
        genero: "Mujer",
        volumenMl: 80,
        precio: 94990,
        stock: 5,
        descripcion: "Intensa y envolvente, con cacao, tuberosa y haba tonka.",
        imagenUrl: ""
    },
    {
        nombre: "Light Blue",
        marca: "Dolce & Gabbana",
        genero: "Unisex",
        volumenMl: 50,
        precio: 74990,
        stock: 3,
        descripcion: "Cítrica y marina, ideal para el verano.",
        imagenUrl: ""
    },
    {
        nombre: "Edición Agotada de Prueba",
        marca: "Casa Demo",
        genero: "Unisex",
        volumenMl: 30,
        precio: 39990,
        stock: 0,
        descripcion: "Perfume sin stock, para probar el aviso de Agotado en la app.",
        imagenUrl: ""
    }
];

async function main(): Promise<void> {
    const negocio = new PerfumeNegocio();
    const existentes = await negocio.listarTodos();

    let creados = 0;
    for (const datos of DEMO) {
        const yaExiste = existentes.some(
            (p) => p.nombre === datos.nombre && p.marca === datos.marca
        );
        if (yaExiste) {
            console.log(`Ya existe, se omite: ${datos.marca} - ${datos.nombre}`);
            continue;
        }
        await negocio.crear(datos);
        creados++;
        console.log(`Creado: ${datos.marca} - ${datos.nombre}`);
    }
    console.log(`\nListo: ${creados} perfume(s) nuevo(s) cargado(s).`);
}

main()
    .catch((error) => console.error("Error:", error.message ?? error))
    .finally(() => ConexionMongo.cerrar());
