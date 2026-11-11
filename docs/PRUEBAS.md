# Pruebas

## 1. Pruebas automáticas end-to-end

El script `src/scripts/e2e.ts` hace peticiones HTTP reales contra el servidor en ejecución y verifica las
respuestas. Al terminar elimina los perfumes y pedidos de prueba que él mismo creó (por identificador exacto).

Requisitos: servidor corriendo (`npm run dev`) y administrador creado (`npm run crear-admin`).

```
npm run test:e2e -- admin@perfumeria.com MiClaveSegura123
```

Termina con código de salida 1 si alguna comprobación falla. En una ejecución completa hay **49 comprobaciones**:

| Sección | Comprobaciones | Qué verifica |
|---|---|---|
| Seguridad | 4 | 401 sin token y con token falso; login con clave incorrecta (401) y correcto (200) |
| Perfumes | 3 | Precio negativo (400); crear (201); aparece en el catálogo público |
| Pedidos y stock | 8 | Datos de envío incompletos (400); pedido válido (201, total, estado Pendiente); el stock baja; pedir más que el stock (409) sin tocar el stock; identificador inválido (400) |
| Concurrencia | 2 | Dos compras simultáneas del último frasco: una gana y otra falla; el stock queda en 0, nunca negativo |
| Panel de pedidos | 4 | No se puede saltar un estado (409); Pendiente → Pagado → Enviado; filtro por estado |
| Cancelación | 10 | Un pedido Enviado no se cancela; cancelar repone el stock; cancelar dos veces (409) no repone dos veces; un Cancelado no se reactiva; filtro por Cancelado; dos cancelaciones simultáneas: una gana y el stock se repone una sola vez |
| Reporte de ventas | 13 | 401 sin token; 400 con fecha o umbral inválidos; las cifras (pedidos, ventas confirmadas, pendientes, canceladas, ticket promedio, más vendido) coinciden con los pedidos de la prueba; filtro de stock bajo |
| Baja lógica | 5 | Dar de baja; desaparece del catálogo (404 y fuera del listado); el pedido histórico conserva nombre y precio; no se puede pedir un perfume dado de baja (409) |

## 2. Pruebas manuales de la API

El archivo `pruebas.http` (extensión **REST Client** de VS Code) contiene los mismos casos principales como
peticiones sueltas. El token y los identificadores se capturan solos; se ejecutan los bloques en orden.

## 3. Pruebas manuales en la app (celular)

Marca cada caso al probarlo.

**Cliente**
- [ ] El catálogo carga y muestra marca, nombre, volumen, género, descripción y precio.
- [ ] La búsqueda por nombre o marca y los filtros Hombre, Mujer y Unisex funcionan.
- [ ] Un perfume sin stock muestra "Agotado" y no permite agregarlo.
- [ ] El detalle avisa cuando quedan 5 unidades o menos y el selector no pasa del stock disponible.
- [ ] El carrito permite cambiar cantidades, quitar productos y vaciarlo; el total es correcto.
- [ ] El checkout muestra errores si faltan datos o el teléfono es inválido, y no deja confirmar.
- [ ] Un pedido válido muestra la confirmación con su número, total y estado Pendiente.
- [ ] Tras la compra, el stock del catálogo bajó.
- [ ] El botón "atrás" del celular funciona en cada pantalla.
- [ ] Sin conexión al servidor, la app muestra el mensaje de error y el botón Reintentar.

**Administrador**
- [ ] Login con credenciales correctas entra al menú; con credenciales incorrectas muestra el error.
- [ ] Crear un perfume nuevo: aparece en el catálogo del cliente.
- [ ] Editar un perfume (por ejemplo, su precio o stock) se refleja en el catálogo.
- [ ] Dar de baja un perfume lo oculta del catálogo; reactivarlo lo devuelve.
- [ ] La lista de pedidos filtra por estado y muestra el estado con colores.
- [ ] Avanzar un pedido de Pendiente a Pagado y a Enviado.
- [ ] Cancelar un pedido Pendiente repone el stock (verificar en el catálogo).
- [ ] El reporte de ventas muestra cifras coherentes para cada período.
- [ ] Cerrar sesión devuelve al catálogo y exige volver a ingresar.

## 4. Registro de ejecuciones

| Fecha | Prueba | Resultado | Observaciones |
|---|---|---|---|
| 2026-11-08 | `npm run test:e2e` (versión inicial, 26 comprobaciones) | 26 correctas, 0 con fallo | Incluía seguridad, perfumes, pedidos y stock, concurrencia, panel de pedidos y baja lógica |
| | `npm run test:e2e` (49 comprobaciones) | | |
| | Pruebas manuales en la app | | |
