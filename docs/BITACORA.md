# Bitácora de Desarrollo del MVP

Plan de trabajo por fases, con las tareas clave y su estado. Las decisiones de diseño y sus razones están en
[ARQUITECTURA.md](ARQUITECTURA.md).

## Fase 0: Decisiones previas: Hecha

- Backend en TypeScript + Express con MongoDB, siguiendo la arquitectura SOA por capas del curso.
- App móvil en React Native con Expo, que permite probar en un celular Android con Expo Go sin Android Studio.
- Autenticación del administrador con JWT.
- Pasarela de pago real (Stripe / MercadoPago) diferida: el MVP ofrece transferencia y pago contra entrega.
- Repositorio en Git.

## Fase 1: Modelado de datos: Hecha

- [x] Colecciones `perfumes`, `pedidos` y `usuarios`.
- [x] Cliente e ítems embebidos en el pedido; precio y nombre copiados al comprar.
- [x] Baja lógica de perfumes (`activo`).
- [x] DTO en TypeScript que replican las colecciones.
- [ ] Índices de MongoDB (recomendados para un catálogo grande; ver [MODELO-DATOS.md](MODELO-DATOS.md)).

## Fase 2: Backend: Hecha

- [x] Capa de conexión (acceso único a MongoDB).
- [x] Capa de negocio: CRUD de perfumes con baja lógica y reactivación (RF-01).
- [x] Pedidos con precios tomados de la base de datos y descuento atómico de stock (RF-02, RF-05).
- [x] Flujo de estados Pendiente → Pagado → Enviado validado en el servidor (RF-06).
- [x] Login de administrador con hash de contraseña y token JWT; rutas `/admin/*` protegidas.
- [x] Capa de servicio con rutas REST y manejo central de errores.
- [x] Scripts `crear-admin` y `cargarDemo`.

## Fase 3: Frontend: Hecha

- [x] App del cliente: catálogo, detalle, carrito, checkout y confirmación (RF-03, RF-04, RF-05).
- [x] Validaciones locales de los formularios y manejo de errores de conexión.
- [x] Panel de administración dentro de la app: login, perfumes, pedidos (RF-01, RF-06).
- [x] Compatibilidad con la barra de navegación de Android (márgenes seguros).

## Funcionalidades adicionales: Hechas

- [x] Estado **Cancelado**: cancela un pedido y repone el stock una sola vez, incluso con cancelaciones simultáneas.
- [x] **Reporte de ventas**: ventas confirmadas, por cobrar, canceladas, ticket promedio, más vendidos y stock bajo.

## Fase 4: Pruebas: Hecha (con registro por completar)

- [x] Script end-to-end con 49 comprobaciones (ver [PRUEBAS.md](PRUEBAS.md)).
- [x] Primera versión del script verificada: 26 de 26 correctas.
- [x] Casos críticos de stock cubiertos: pedir más que el stock, compras simultáneas del último frasco,
  cancelaciones simultáneas.
- [x] Prueba en celular Android del flujo del cliente.
- [ ] Registrar en [PRUEBAS.md](PRUEBAS.md) la ejecución completa de las 49 comprobaciones y de la lista manual.

## Fase 5: Despliegue: Pendiente

- [ ] Base de datos en MongoDB Atlas (plan gratuito) y `USAR_TRANSACCIONES=true`.
- [ ] Backend en un servicio de hosting (por ejemplo Render o Railway) con variables de entorno y HTTPS.
- [ ] Actualizar `URL_BASE` de la app con la URL pública.
- [ ] Generar la app Android instalable (APK).
- [ ] Restringir CORS al dominio real y definir un `JWT_SECRET` propio.

## Pendientes y mejoras futuras

| Tema | Descripción |
|---|---|
| Pasarela de pago | Integrar Stripe o MercadoPago; hoy `pasarela` solo se registra como método |
| Pedidos del cliente | Que el cliente consulte sus pedidos anteriores y reciba avisos de cambio de estado |
| Reembolsos | Cancelar un pedido ya Pagado no devuelve el dinero: hoy sería un trámite manual |
| Imágenes | Hoy se guarda solo la URL de la imagen; faltaría subir fotos (por ejemplo a Cloudinary) |
| Rendimiento | Índices y paginación en los listados |
| Seguridad | Límite de intentos de login y de peticiones; separar el panel admin de la app del cliente |
| Carrito | Guardarlo en el dispositivo para que sobreviva al cerrar la app |
