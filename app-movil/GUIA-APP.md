# App móvil del cliente (React Native + Expo)

Consume los endpoints públicos del backend: catálogo (RF-03), carrito (RF-04) y checkout (RF-05).

## Estructura (misma idea de capas del backend)

```
App.tsx                      punto de entrada
src/config.ts                URL del backend (HAY QUE EDITARLA)
src/modelos.ts               tipos (réplica de lo que devuelve el backend)
src/servicios/               capa de servicio: único lugar con fetch
src/estado/CarritoContext    estado del carrito
src/navegacion/Navegador     navegación por pila + botón atrás de Android
src/pantallas/               Catálogo, Detalle, Carrito, Checkout, Confirmación
src/componentes/             piezas reutilizables
src/utilidades/              formato de precios, validaciones, avisos
```

## Puesta en marcha (Windows)

Requisitos: Node.js, la app **Expo Go** instalada desde Google Play en tu Android, y el PC y el
celular conectados a la **misma red Wi-Fi**.

1. Desde la raíz del repositorio (la carpeta `perfumeria-backend`), crea el proyecto Expo:
   ```
   npx create-expo-app@latest app-movil --template blank-typescript
   ```
2. Comprueba que no se creó un repositorio Git anidado y elimina el `App.tsx` de plantilla
   (el parche trae el suyo):
   ```
   dir /a app-movil\.git
   del app-movil\App.tsx
   ```
   Si el primer comando muestra una carpeta `.git`, bórrala con `rmdir /s /q app-movil\.git`.
3. Aplica el parche desde la raíz del repositorio:
   ```
   git apply 0002-app-movil-cliente.patch
   ```
4. Averigua la IP de tu PC con `ipconfig` (campo "Dirección IPv4" del adaptador Wi-Fi) y
   edita `app-movil/src/config.ts`:
   ```ts
   export const URL_BASE = "http://192.168.1.50:3001"; // pon tu IP
   ```
5. Levanta el backend (otra terminal, en la raíz): `npm run dev`.
   La primera vez, Windows pregunta si permite a Node.js acceder a la red: acepta en **redes privadas**.
   Prueba desde el navegador del celular: `http://TU_IP:3001/perfumes` debe mostrar una lista (aunque esté vacía).
6. Crea algunos perfumes con `pruebas.http` (login + POST `/admin/perfumes`); para ver imagen,
   usa una `imagenUrl` que empiece con `https://`.
7. Inicia la app:
   ```
   cd app-movil
   npx expo start
   ```
   Abre Expo Go en el celular y escanea el código QR.

## Si algo falla
- **"No se pudo conectar con el servidor"** en la app: revisa la IP en `config.ts`, que el backend esté
  corriendo y que el celular esté en la misma Wi-Fi (sin VPN). Prueba la URL en el navegador del celular.
- **El QR no abre la app**: prueba `npx expo start --tunnel`, o reinicia con `npx expo start -c`.
- Al cambiar de red Wi-Fi, tu IP cambia: actualiza `config.ts`.

## Alcance actual
- El pago con pasarela (Stripe / MercadoPago) no está integrado: se ofrecen transferencia y pago contra entrega.
- El carrito vive en memoria: se vacía al cerrar la app.
