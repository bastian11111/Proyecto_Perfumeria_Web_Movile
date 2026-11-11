# Perfumería: MVP móvil con arquitectura SOA

Aplicación móvil (Android / iOS) para una perfumería, con un web service REST detrás.
Permite explorar un catálogo, armar un carrito y registrar pedidos; y, para el administrador,
gestionar perfumes e inventario, atender pedidos y ver un reporte de ventas.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Backend (web service) | Node.js, TypeScript, Express 4 |
| Base de datos | MongoDB (driver oficial `mongodb`) |
| Seguridad | JWT (`jsonwebtoken`) y contraseñas con hash (`bcryptjs`) |
| App móvil | React Native + Expo (SDK 58), TypeScript |
| Pruebas | Script end-to-end propio (`npm run test:e2e`) y archivo `pruebas.http` (REST Client de VS Code) |

## Documentos

| Documento | Contenido |
|---|---|
| [ARQUITECTURA.md](ARQUITECTURA.md) | Capas SOA, diagramas, decisiones de diseño y sus razones |
| [REQUERIMIENTOS.md](REQUERIMIENTOS.md) | Cada requerimiento (RF-01 a RF-06 y extras): dónde está implementado y cómo se prueba |
| [MODELO-DATOS.md](MODELO-DATOS.md) | Colecciones de MongoDB, campos y reglas de validación |
| [API.md](API.md) | Todas las rutas REST con ejemplos de petición y respuesta |
| [PRUEBAS.md](PRUEBAS.md) | Pruebas automáticas, manuales y registro de ejecuciones |
| [GUIA-EJECUCION.md](GUIA-EJECUCION.md) | Cómo instalar y ejecutar todo en Windows, y solución de problemas |
| [BITACORA.md](BITACORA.md) | Bitácora de Desarrollo del MVP: fases, tareas y estado |

## Estructura del repositorio

```
.
├── src/                    Backend
│   ├── conexion/           Capa de conexión (único acceso a MongoDB)
│   ├── dto/                Capa DTO (réplica de las colecciones)
│   ├── negocio/            Capa de negocio (reglas, validaciones, operaciones)
│   ├── servicio/           Capa de servicio (rutas REST con Express)
│   └── scripts/            crearAdmin, cargarDemo y pruebas end-to-end
├── app-movil/              App React Native (Expo)
│   └── src/                pantallas, servicios, estado, navegación, componentes
├── docs/                   Esta documentación
├── pruebas.http            Pruebas manuales de la API
└── .env.example            Variables de entorno de ejemplo
```

## Alcance del MVP y límites conocidos

Incluido: catálogo, carrito, checkout con transferencia o pago contra entrega, panel de administración
(perfumes, pedidos, reporte de ventas) y cancelación de pedidos con reposición de stock.

No incluido todavía: pasarela de pago real (Stripe / MercadoPago), que el cliente consulte sus pedidos
anteriores, despliegue en la nube, índices de MongoDB, paginación de listados. El detalle está en
[BITACORA.md](BITACORA.md).
