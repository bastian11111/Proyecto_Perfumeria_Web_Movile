# API REST

URL base en desarrollo: `http://localhost:3001` (puerto configurable con `PUERTO`).
Todas las respuestas son JSON. Las rutas `/admin/*` exigen el encabezado
`Authorization: Bearer <token>` (el token se obtiene en `POST /auth/login` y vence a las 8 horas).

## Formato de errores

```json
{ "mensaje": "Stock insuficiente para \"Sauvage\"" }
```

| Código | Cuándo ocurre |
|---|---|
| 200 / 201 | Operación correcta (201 al crear un perfume o un pedido) |
| 400 | Datos inválidos: campo faltante, precio negativo, identificador mal formado, fecha inválida |
| 401 | Sin token, token inválido o vencido, o credenciales incorrectas |
| 404 | Perfume o pedido inexistente (o perfume dado de baja, en la ruta pública) |
| 409 | Conflicto: stock insuficiente, perfume no disponible, cambio de estado no permitido |
| 500 | Error interno del servidor |

## Rutas

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Público | Inicia sesión de administrador y devuelve un token |
| GET | `/perfumes` | Público | Catálogo: solo perfumes activos |
| GET | `/perfumes/:id` | Público | Detalle de un perfume activo |
| POST | `/pedidos` | Público | Registra un pedido y descuenta el stock |
| GET | `/admin/perfumes` | Admin | Todos los perfumes, incluidos los dados de baja |
| POST | `/admin/perfumes` | Admin | Crea un perfume |
| PUT | `/admin/perfumes/:id` | Admin | Edita un perfume |
| DELETE | `/admin/perfumes/:id` | Admin | Baja lógica |
| PUT | `/admin/perfumes/:id/reactivar` | Admin | Reactiva un perfume dado de baja |
| GET | `/admin/pedidos` | Admin | Lista de pedidos, del más reciente al más antiguo; filtro opcional `?estado=` |
| GET | `/admin/pedidos/:id` | Admin | Detalle de un pedido |
| PUT | `/admin/pedidos/:id/estado` | Admin | Cambia el estado (incluye cancelar) |
| GET | `/admin/reportes/ventas` | Admin | Reporte de ventas; parámetros opcionales `desde`, `hasta`, `umbralStock` |

## Ejemplos

### Login

```http
POST /auth/login
Content-Type: application/json

{ "email": "admin@perfumeria.com", "password": "MiClaveSegura123" }
```
Respuesta `200`:
```json
{ "token": "eyJhbGciOi..." }
```

### Crear un perfume (admin)

```http
POST /admin/perfumes
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Sauvage",
  "marca": "Dior",
  "genero": "Hombre",
  "volumenMl": 100,
  "precio": 99990,
  "stock": 12,
  "descripcion": "Fragancia fresca y especiada",
  "imagenUrl": ""
}
```
Respuesta `201`: el perfume creado, con su `_id` y `activo: true`.

### Registrar un pedido (cliente)

```http
POST /pedidos
Content-Type: application/json

{
  "cliente": {
    "nombre": "Ana Pérez",
    "telefono": "+56 9 1234 5678",
    "direccion": "Av. Siempre Viva 123",
    "ciudad": "Santiago"
  },
  "items": [ { "perfumeId": "<id del perfume>", "cantidad": 2 } ],
  "metodoPago": "transferencia"
}
```
Respuesta `201`:
```json
{
  "mensaje": "Pedido registrado correctamente",
  "pedido": {
    "_id": "...",
    "cliente": { "nombre": "Ana Pérez", "telefono": "+56 9 1234 5678", "direccion": "Av. Siempre Viva 123", "ciudad": "Santiago", "email": "" },
    "items": [ { "perfumeId": "...", "nombre": "Sauvage", "precioUnitario": 99990, "cantidad": 2 } ],
    "total": 199980,
    "metodoPago": "transferencia",
    "estado": "Pendiente",
    "fechaCreacion": "2026-11-08T16:46:49.351Z"
  }
}
```
El precio y el nombre de cada ítem los toma el servidor de la base de datos; el `total` lo calcula el servidor.

### Cambiar el estado de un pedido (admin)

```http
PUT /admin/pedidos/<id>/estado
Authorization: Bearer <token>
Content-Type: application/json

{ "estado": "Pagado" }
```
Estados permitidos: `Pagado`, `Enviado` y `Cancelado`, siguiendo el flujo de
[ARQUITECTURA.md](ARQUITECTURA.md). Al enviar `"Cancelado"` el stock de los productos vuelve al inventario.
Respuesta `200`: `{ "mensaje": "Estado actualizado correctamente" }`. Un cambio no permitido responde `409`.

### Reporte de ventas (admin)

```http
GET /admin/reportes/ventas?desde=2026-11-01&hasta=2026-11-30&umbralStock=5
Authorization: Bearer <token>
```
Respuesta `200` (valores de ejemplo):
```json
{
  "periodo": { "desde": "2026-11-01T00:00:00.000Z", "hasta": "2026-11-30T00:00:00.000Z" },
  "totalPedidos": 4,
  "pedidosPorEstado": { "Pendiente": 1, "Pagado": 0, "Enviado": 1, "Cancelado": 2 },
  "ventasConfirmadas": 198000,
  "ventasPendientes": 50000,
  "montoCancelado": 300000,
  "ticketPromedio": 198000,
  "perfumesMasVendidos": [ { "perfumeId": "...", "nombre": "Sauvage", "unidades": 2, "ingresos": 198000 } ],
  "stockBajo": [ { "perfumeId": "...", "nombre": "Light Blue", "marca": "Dolce & Gabbana", "stock": 3 } ],
  "umbralStock": 5
}
```
- `ventasConfirmadas` suma los pedidos **Pagados y Enviados**; `ticketPromedio` es ese monto dividido por la cantidad de esos pedidos.
- `perfumesMasVendidos` cuenta solo ventas confirmadas (máximo 5).
- `stockBajo` lista perfumes activos con `umbralStock` unidades o menos, el de menor stock primero (máximo 10). El umbral por defecto es 5.
- Sin `desde` ni `hasta` se consideran todos los pedidos.
