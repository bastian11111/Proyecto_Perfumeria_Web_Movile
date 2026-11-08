# Backend Perfumería (MVP) - TypeScript + Express + MongoDB

## Arquitectura SOA por capas

```
[ SERVICIO  server.ts ]        solo expone rutas HTTP, sin reglas de negocio
        |
[ NEGOCIO  Perfume / Pedido / Auth ]   toda la lógica y validaciones
        |                \
[ DTO  Perfume / Pedido / Usuario ]   [ CONEXIÓN  ConexionMongo ]
  réplica de las colecciones            único punto que habla con MongoDB
```

## Cómo correrlo

1. Tener Node.js (LTS) y MongoDB (local o cuenta gratuita en Atlas).
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Copiar `.env.example` como `.env` y ajustar `MONGO_URI` y `JWT_SECRET`.
4. Crear el administrador:
   ```bash
   npm run crear-admin -- admin@perfumeria.com MiClaveSegura123
   ```
5. Levantar el servidor:
   ```bash
   npm run dev
   ```
6. Probar con `pruebas.http` (instala la extensión **REST Client** en VS Code).

## Rutas

| Método | Ruta | Acceso | Requerimiento |
|---|---|---|---|
| POST | /auth/login | público | login admin |
| GET | /perfumes | público | RF-03 |
| GET | /perfumes/:id | público | RF-03 |
| POST | /pedidos | público | RF-04, RF-05, RF-02 |
| GET | /admin/perfumes | admin | RF-01 |
| POST | /admin/perfumes | admin | RF-01 |
| PUT | /admin/perfumes/:id | admin | RF-01 |
| DELETE | /admin/perfumes/:id | admin | RF-01 (baja lógica) |
| PUT | /admin/perfumes/:id/reactivar | admin | RF-01 |
| GET | /admin/pedidos?estado= | admin | RF-06 |
| GET | /admin/pedidos/:id | admin | RF-06 |
| PUT | /admin/pedidos/:id/estado | admin | RF-06 |

## Decisiones de diseño importantes

- **Descuento de stock (RF-02):** se descuenta al crear el pedido (reserva el stock), restando la
  cantidad de cada línea. La condición `stock >= cantidad` evita stock negativo si dos clientes
  compran el último frasco a la vez.
- **Transacciones:** con `USAR_TRANSACCIONES=true` (requiere replica set, Atlas lo trae) el descuento
  y la creación del pedido son una sola transacción. Con `false` (MongoDB local normal) el código
  deshace el descuento a mano si algo falla.
- **Precios:** el servidor toma nombre y precio de la base de datos, nunca del carrito que envía la app.
- **Baja lógica:** `activo: false`; el perfume desaparece del catálogo pero los pedidos antiguos
  conservan su nombre y precio.
- **Validaciones:** viven en la capa de negocio; el servicio solo traduce los errores a códigos HTTP.

## Pruebas End-to-End

Hay dos formas de probar el sistema con peticiones HTTP reales (el servidor debe estar corriendo
con `npm run dev` y el admin creado):

1. **Manual, con `pruebas.http`** (extensión REST Client de VS Code): ejecuta los bloques en orden.
   El token y los IDs se capturan solos. Cada bloque indica en su título qué respuesta esperar.
2. **Automática, con el script E2E**:
   ```bash
   npm run test:e2e -- admin@perfumeria.com MiClaveSegura123
   ```
   Verifica seguridad (401), validaciones (400), descuento de stock, rechazo por stock insuficiente (409),
   dos compras simultáneas del último frasco, flujo de estados, baja lógica y que el pedido histórico
   conserve nombre y precio. Al final borra solo los perfumes y pedidos de prueba que él mismo creó.
   Termina con código de salida 1 si algo falla.

## Pendiente / siguientes pasos

- Un pedido Pendiente que nunca se paga mantiene el stock reservado. Si el proyecto lo pide, se puede
  agregar un estado "Cancelado" que reponga el stock.
- La pasarela de pago real (Stripe / MercadoPago) no está integrada: `metodoPago: "pasarela"` solo
  se registra. Se puede agregar después como un endpoint más.
- Para producción, restringir CORS al dominio de la app y el panel.
