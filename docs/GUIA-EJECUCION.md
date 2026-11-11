# Guía de ejecución (Windows)

## Requisitos

- Node.js (versión LTS) y npm
- MongoDB (instalado localmente) o una cuenta gratuita en MongoDB Atlas
- Git y VS Code (recomendado, con la extensión **REST Client** para `pruebas.http`)
- Para probar la app: un celular Android con **Expo Go** (Google Play), en la **misma red Wi-Fi** que el PC

## 1. Backend

Desde la raíz del repositorio:

```
npm install
copy .env.example .env
```

Edita `.env`:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `MONGO_URI` | Dirección de MongoDB | `mongodb://127.0.0.1:27017` |
| `MONGO_DB` | Nombre de la base de datos | `perfumeria` |
| `JWT_SECRET` | Texto largo y secreto para firmar los tokens (cámbialo) | (cadena larga y aleatoria) |
| `PUERTO` | Puerto del servidor | `3001` |
| `USAR_TRANSACCIONES` | `true` solo si MongoDB es un replica set (Atlas); en MongoDB local déjalo en `false` | `false` |

El archivo `.env` contiene secretos y **no se sube a Git** (está en `.gitignore`).

Crea el administrador y, si quieres, datos de ejemplo:

```
npm run crear-admin -- admin@perfumeria.com MiClaveSegura123
npx ts-node src/scripts/cargarDemo.ts
```

La contraseña del administrador debe tener al menos 8 caracteres. `cargarDemo` carga 6 perfumes de
ejemplo (uno sin stock) y no duplica si se ejecuta dos veces.

Levanta el servidor:

```
npm run dev
```

Debe mostrar `Servidor REST corriendo en http://localhost:3001`.

### Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta el servidor compilado |
| `npm run crear-admin -- <email> <clave>` | Crea el usuario administrador |
| `npm run test:e2e -- <email> <clave>` | Ejecuta las pruebas end-to-end (ver [PRUEBAS.md](PRUEBAS.md)) |

## 2. App móvil

1. Averigua la IP de tu PC: ejecuta `ipconfig` y copia la **Dirección IPv4** del adaptador de LAN
   inalámbrica Wi-Fi.
2. Edita `app-movil/src/config.ts` y pon esa IP (no uses `localhost`, en el celular sería el propio celular):
   ```ts
   export const URL_BASE = "http://192.168.1.30:3001";
   ```
3. Instala y arranca:
   ```
   cd app-movil
   npm install
   npx expo start --go
   ```
4. Abre **Expo Go** en el celular, elige *Scan QR code* y escanea el código de la terminal.

Antes de abrir la app, comprueba desde el navegador del celular que el backend responde:
`http://TU_IP:3001/perfumes` debe mostrar una lista (aunque sea `[]`).

La primera vez que se ejecuta el backend, Windows puede preguntar por el firewall: permite Node.js en
**redes privadas**.

### Acceso al panel de administración

En el catálogo, baja hasta el final de la lista y toca **Acceso administrador**. Ingresa con la cuenta
creada con `npm run crear-admin`.

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `"git" no se reconoce como un comando` | Git no está instalado | Instala Git y reinicia la terminal o VS Code |
| `Falta la variable de entorno JWT_SECRET` | No existe el archivo `.env` | `copy .env.example .env` y reinicia el servidor (el `.env` solo se lee al arrancar) |
| `test:e2e` muestra `ECONNREFUSED` | El servidor no está corriendo | Ejecuta `npm run dev` en otra terminal |
| La app dice "No se pudo conectar con el servidor" | Backend o MongoDB apagados; la IP del PC cambió; celular en otra red; firewall | Revisa en orden: servidor y MongoDB encendidos, IP actual con `ipconfig` en `config.ts`, misma Wi-Fi, y la URL `http://TU_IP:3001/perfumes` en el navegador del celular |
| Al escanear el QR se abre Google | Se escaneó con la cámara o con Chrome | Escanea desde dentro de **Expo Go** (*Scan QR code*) |
| La terminal de Expo dice `Development build: Unable to determine the default URI scheme` | Expo quedó en modo "development build" | Ejecuta `npx expo start --go` (no instales `expo-dev-client`) |
| Expo Go indica versión o SDK incompatible | Expo Go desactualizado | Actualiza Expo Go desde Google Play |
| El navegador del celular no carga `http://TU_IP:3001/perfumes` | Windows trata el Wi-Fi como red pública, o es una red de invitados | Cambia el perfil de la red Wi-Fi a **Privada** y usa la red principal del router |
| `npm install` avisa de vulnerabilidades | Aviso habitual de dependencias de desarrollo | Ignóralo; **no** ejecutes `npm audit fix --force`, porque puede romper las versiones de Expo |
| La prueba de transacciones falla con MongoDB local | `USAR_TRANSACCIONES=true` sin replica set | Déjalo en `false` en MongoDB local |
| Cambias de red Wi-Fi y la app deja de conectar | La IP del PC cambió | Actualiza `URL_BASE` en `config.ts` y recarga la app |
