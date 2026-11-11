# Requerimientos y trazabilidad

Para cada requerimiento: dónde está implementado en el backend y en la app, y qué prueba lo verifica.
Las pruebas automáticas se describen en [PRUEBAS.md](PRUEBAS.md).

| ID | Requerimiento | Backend | App móvil | Pruebas | Estado |
|---|---|---|---|---|---|
| RF-01 | Alta, edición y baja lógica de perfumes (nombre, marca, género, volumen, precio, stock) | `PerfumeNegocio`; rutas `/admin/perfumes` | `AdminPerfumesPantalla`, `AdminPerfumeFormPantalla` | E2E: Perfumes y Baja lógica | Cumplido |
| RF-02 | Descuento de stock al confirmar una compra | `PedidoNegocio` (`descontarStock`) | (automático al confirmar el pedido) | E2E: Pedidos y stock, Concurrencia | Cumplido |
| RF-03 | Catálogo público con imagen, precio y descripción | `GET /perfumes`, `GET /perfumes/:id` | `CatalogoPantalla`, `DetallePantalla` | E2E: Perfumes; prueba manual en celular | Cumplido |
| RF-04 | Carrito con uno o varios productos | Lógica local en la app | `CarritoContext`, `CarritoPantalla` | Prueba manual en celular | Cumplido (el carrito vive en memoria) |
| RF-05 | Checkout: datos de envío y método de pago | `POST /pedidos` | `CheckoutPantalla`, `ConfirmacionPantalla` | E2E: Pedidos y stock; prueba manual | Parcial: transferencia y pago contra entrega; la pasarela real no está integrada |
| RF-06 | Panel de pedidos con datos del comprador y cambio de estado | `/admin/pedidos` | `AdminPedidosPantalla`, `AdminPedidoDetallePantalla` | E2E: Panel de pedidos | Cumplido |

### Funcionalidades adicionales

| Funcionalidad | Backend | App móvil | Pruebas |
|---|---|---|---|
| Login de administrador con JWT | `AuthNegocio`, `POST /auth/login` | `AdminLoginPantalla`, `SesionAdminContext` | E2E: Seguridad |
| Cancelación de pedidos con reposición de stock | `PedidoNegocio` (`cancelar`) | Botón "Cancelar pedido" en `AdminPedidoDetallePantalla` | E2E: Cancelación |
| Reporte de ventas | `ReporteNegocio`, `GET /admin/reportes/ventas` | `AdminReportePantalla` | E2E: Reporte de ventas |
| Datos de ejemplo para el catálogo | `src/scripts/cargarDemo.ts` | (no aplica) | (no aplica) |

## Notas sobre los requerimientos

- **RF-02:** el enunciado habla de restar una unidad por frasco vendido; el sistema resta la **cantidad de
  cada línea del pedido** (equivalente a una unidad por frasco). El descuento se hace al **registrar** el
  pedido, de modo que el stock queda reservado; si el pedido se cancela, se repone.
- **RF-05:** el backend acepta `pasarela` como método de pago y lo registra, pero la app solo ofrece
  transferencia y pago contra entrega mientras no exista integración real con Stripe o MercadoPago.
- **Transacción de negocio:** la compra (validar, descontar stock y crear el pedido) es una operación
  atómica. Con `USAR_TRANSACCIONES=true` usa una transacción de MongoDB; en MongoDB local usa descuentos
  condicionales con compensación (ver [ARQUITECTURA.md](ARQUITECTURA.md)).

## Mapa rápido para una presentación

| Elemento | Dónde mostrarlo |
|---|---|
| Mantenedor (CRUD) | Panel admin: Perfumes (crear, editar, dar de baja, reactivar) |
| Transacción | Compra desde la app: el stock baja y se crea el pedido; cancelar lo devuelve |
| Reporte por pantalla | Panel admin: Reporte de ventas |
| Arquitectura por capas | [ARQUITECTURA.md](ARQUITECTURA.md) y la estructura de `src/` |
