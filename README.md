# Módulo de Inventario "Lesgo" (Grupo 2)

Módulo de Inventario del mini-ERP de **Sistemas de Información II** (UCN Coquimbo). El negocio es **Lesgo**, un e-commerce de sets de LEGO.

El módulo es dueño del **maestro de productos** (`id_producto`) y del **stock por bodega**. Registra los movimientos de stock para no vender sin stock ni comprar lo que ya existe, y deja trazabilidad de las operaciones.

> **Estado:** Sprint 3 en curso. El Sprint 2 se entregó con el backend conectado a la BD y dos formularios en el front: crear producto y registrar ingreso de stock.

## Stack

| Parte | Tecnología | Carpeta |
| --- | --- | --- |
| Backend | NestJS 12 (ESM), TypeScript 6, TypeORM + `pg`, Swagger | [`Backend/`](Backend/) |
| Frontend | React 19 + Vite + React Router | [`Frontend/`](Frontend/) |
| Base de datos | PostgreSQL 17: Neon (compartida entre grupos) o Docker local | [`Backend/db/`](Backend/db/) |
| Calidad | vitest + supertest, oxlint, prettier | |

## Estructura

```
Backend/
├─ db/
│  ├─ ddl/        tablas, triggers y cambios del Sprint 3 (03 a 08)  (schema inventario)
│  ├─ dml/        temas, bodegas, 120 productos, stock inicial, imágenes y medidas estimadas
│  ├─ local/      crea el schema en el Postgres de Docker
│  └─ test/       validar_ddl.sql (prueba restricciones y triggers, termina en ROLLBACK)
├─ src/
│  ├─ auth/         JWT de RRHH, roles y API key de los módulos que nos llaman
│  ├─ catalogo/     productos y temas
│  ├─ stock/        bodegas y stock por bodega
│  ├─ movimientos/  ingresos, ajustes, historial, reservas, despachos y recepciones
│  ├─ health/       estado del servicio
│  ├─ common/       filtro global de errores
│  ├─ config/       validación de variables de entorno
│  └─ database/     conexión TypeORM (synchronize: false)
├─ test/          pruebas e2e
├─ Dockerfile     imagen de la API (sección 2b)
└─ docker-compose.yml
Frontend/
└─ src/           páginas: Productos, DetalleProducto, CrearProducto, IngresoStock, Bodegas
```

## Requisitos

- Node.js 20 o superior.
- Docker Desktop, para la base de datos local.

## Cómo levantarlo

### 1. Base de datos local (Docker)

Desde `Backend/`:

```bash
docker compose up -d
```

La primera vez, Docker crea la base `si2_local` y el schema `inventario`. Después hay que cargar las tablas y los datos con los scripts del repo, en este orden:

```bash
docker exec inventario-postgres psql -U inventario -d si2_local -v ON_ERROR_STOP=1 -f /db/local/00_schema.sql -f /db/local/01_postventa_prueba.sql -f /db/ddl/01_tablas.sql -f /db/ddl/02_triggers.sql -f /db/ddl/03_imagen_producto.sql -f /db/ddl/04_empleado_nullable.sql -f /db/ddl/05_reserva_unica.sql -f /db/ddl/06_medidas_producto.sql -f /db/ddl/07_despacho_varchar.sql -f /db/ddl/08_fk_empleado.sql -f /db/ddl/09_devolucion.sql -f /db/dml/01_temas.sql -f /db/dml/02_bodegas.sql -f /db/dml/03_productos.sql -f /db/dml/04_stock_inicial.sql -f /db/dml/05_imagenes_productos.sql -f /db/dml/06_medidas_productos.sql
```

Opcional: `-f /db/test/validar_ddl.sql` revisa las restricciones y los triggers sin dejar datos.

### 2. Backend

Desde `Backend/`:

```bash
npm install
cp .env.example .env
npm run start:dev
```

- El `.env.example` ya apunta al Postgres de Docker. Para usar Neon, cambiar las variables `POSTGRES_*` según los comentarios del archivo.
- **El `.env` nunca se sube al repo**, porque contiene las credenciales de Neon y las API keys.
- Los endpoints de integración (reserva, liberación, reservas, despacho y recepción) piden una API key por módulo, configurada en `INTEGRACION_API_KEYS=modulo:clave,modulo:clave`. Una clave se genera con `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`.
- Los demás endpoints piden el JWT de RRHH, validado con `JWT_SECRET`. Mientras no esté el login de RRHH, el front usa un login de prueba que pide el token a `POST /api/v1/auth/dev-token`: requiere `AUTH_DEV_TOKENS=true` y un `JWT_SECRET` local de 16 caracteres o más. Nunca activar `AUTH_DEV_TOKENS` con el secreto real de RRHH.
- La API queda en `http://localhost:3000/api/v1`.
- Swagger queda en `http://localhost:3000/api/docs`, para probar los endpoints sin el front.

### 2b. Backend con Docker (alternativa)

La imagen trae solo la API. La BD sigue en Neon (o en el Postgres local). El `.env` nunca entra a la imagen: se monta al correr el contenedor, y la app lo lee igual que con `npm run start`. Desde `Backend/` (en PowerShell):

```bash
docker build -t inventario-api .
docker run -d --name inventario-api -p 3000:3000 -v "${PWD}/.env:/app/.env:ro" inventario-api
```

- No usar `--env-file .env`: Docker no quita las comillas, y la contraseña de Neon las necesita porque contiene `#` (sin comillas, el resto se lee como comentario).
- En un servicio de despliegue, las variables se configuran en su panel y el `.env` no hace falta.
- Para usar el Postgres local de `docker-compose.yml` desde el contenedor, `POSTGRES_HOST` debe ser `host.docker.internal` (dentro del contenedor, `localhost` es el propio contenedor).
- El contenedor revisa `GET /api/v1/health` cada 30 segundos; `docker ps` muestra `healthy` cuando responde.

### 3. Frontend

Desde `Frontend/`:

```bash
npm install
npm run dev
```

- Se abre en `http://localhost:5173`. Vite redirige `/api` al backend en el puerto 3000, así que el backend debe estar corriendo.
- `VITE_USE_MOCK=false` (en `.env`) usa el backend real. Con `true`, el front muestra datos simulados.

## Endpoints

Todos van con el prefijo `/api/v1`. Los dos tipos de credencial van en `Authorization: Bearer <...>`:

- **JWT de RRHH**, para los empleados. El backend toma `employeeId` y `role` del token, y el empleado nunca viene en el body. Solo acepta los roles del módulo: `JEFE_BODEGA`, `OPERADOR_BODEGA` y `CONSULTA_BODEGA`. El token debe traer `exp`.
- **API key del módulo**, para e-Commerce y Logística (*API key* en la columna Acceso).

En la columna Acceso: **Todos** son los tres roles, **Jefe y Op.** son `JEFE_BODEGA` y `OPERADOR_BODEGA`, y **Jefe** es solo `JEFE_BODEGA`.

| Método | Ruta | Acceso | Qué hace |
| --- | --- | --- | --- |
| `GET` | `/health` | Público | Estado del servicio |
| `POST` | `/auth/dev-token` | Público | Token de prueba para el login del front. Solo con `AUTH_DEV_TOKENS=true` (si no, 403) |
| `GET` | `/auth/me` | Todos | El empleado y el rol del token |
| `GET` | `/productos` | Todos | Lista los productos activos, con su tema |
| `GET` | `/productos/temas` | Todos | Lista los temas |
| `GET` | `/productos/catalogo` | Público | Productos activos con su tema y stock disponible total (para e-Commerce) |
| `GET` | `/productos/:id` | Público | Un producto con su tema y stock disponible total, aunque esté inactivo |
| `POST` | `/productos` | Jefe | Crea un producto |
| `PATCH` | `/productos/:id` | Jefe | Edita un producto |
| `DELETE` | `/productos/:id` | Jefe | Da de baja un producto (`activo = false`) |
| `GET` | `/bodegas` | Todos | Lista las bodegas |
| `POST` | `/bodegas` | Jefe | Crea una bodega |
| `PATCH` | `/bodegas/:id` | Jefe | Edita una bodega |
| `GET` | `/stock` | Todos | Resumen por producto: disponible, reservado y mínimo (sumados entre bodegas), y cuántas bodegas están bajo su mínimo |
| `GET` | `/stock/:idProducto` | Todos | Stock de un producto en cada bodega |
| `GET` | `/movimientos` | Jefe y Op. | Historial: los 100 movimientos más recientes, con su detalle |
| `GET` | `/movimientos/:id` | Jefe y Op. | Un movimiento con su detalle |
| `POST` | `/movimientos/ingreso` | Jefe y Op. | Registra un ingreso de stock |
| `POST` | `/movimientos/ajuste` | Jefe | Registra un ajuste de stock (positivo o negativo; 409 si no alcanza) |
| `POST` | `/movimientos/reserva` | API key | Reserva el stock de un pedido de e-Commerce. Todo o nada (409 si una línea no alcanza) e idempotente por `id_pedido`; un pedido cancelado da 409 |
| `POST` | `/movimientos/liberacion` | API key | Libera la reserva de un pedido cancelado: devuelve el stock a las mismas bodegas y anula la reserva. Idempotente; 409 si ya se despachó |
| `GET` | `/reservas?id_pedido=` | API key | La reserva de un pedido: estado y, por línea, producto, bodega, ubicación y cantidad. Para el picking de Logística; 404 si el pedido no tiene reserva |
| `POST` | `/movimientos/despacho` | API key | Logística confirma una guía: `EGRESO` de lo recolectado y `LIBERACION` de lo que faltó, y la reserva queda `COMPLETADO`. `lineas` trae todos los productos de la reserva (0 si no se recolectó). Idempotente por `id_despacho` |
| `POST` | `/movimientos/recepcion` | API key | Logística recibe una OC: `INGRESO` de lo neto (recibido menos dañado) en cada bodega. Idempotente por `id_oc` + `nro_guia_proveedor`; la misma guía con otros datos da 409 |

En despacho y recepción, `id_empleado` va en el body (Logística no usa el JWT de RRHH) y debe existir en `rrhh.empleado`: si no, responde 400.

### Ejemplos de body

Crear producto:

```json
{ "id_tema": 1, "sku": "75192-1", "nombre_set": "Millennium Falcon", "cant_piezas": 7541 }
```

Registrar ingreso:

```json
{ "id_producto": 1, "id_bodega": 1, "cantidad": 10 }
```

El empleado sale del token: un `id_empleado` en el body da 400.

### Validaciones

Los errores responden con el código HTTP real y un formato común:

```json
{ "statusCode": 409, "error": "CONFLICT", "message": "...", "path": "/api/v1/productos", "timestamp": "..." }
```

| Caso | Código |
| --- | --- |
| Campos faltantes, de tipo incorrecto o no permitidos; cantidad 0 o negativa; empleado que no existe en RRHH | 400 |
| Falta el token o la API key, o no es válido (firma, vencimiento, sin `exp` o `employeeId`, rol que no es del módulo) | 401 |
| El rol del token no tiene permiso para el endpoint | 403 |
| Tema, producto, bodega o reserva inexistente (o producto inactivo) | 404 |
| SKU repetido; stock insuficiente; reserva ya despachada o anulada; guía ya usada con otros datos | 409 |

## Modelo de datos

Todas las tablas van en el schema `inventario`:

| Tabla | Contenido |
| --- | --- |
| `inv_temas` | Temas de LEGO (Star Wars, City, …) |
| `inv_producto` | Maestro de productos. `sku` es el número de set y es único. `url_imagen` guarda solo la URL de la imagen. `peso_unitario_kg`, `largo_cm`, `alto_cm` y `ancho_cm` son de la caja, para Logística; si no se envían al crear, se estiman por cantidad de piezas |
| `inv_bodegas` | Bodegas físicas |
| `inv_stock_bodega` | Stock por producto y bodega: disponible, reservado y mínimo |
| `inv_movimiento` | Cabecera de cada movimiento: tipo, estado, empleado y referencias a otros módulos |
| `inv_detalles_movimiento` | Líneas del movimiento: producto, bodega y cantidad |
| `inv_despachos_operario` | Despachos de Logística (vacía hasta el Sprint 3) |
| `inv_recepciones_compra` | Recepciones de órdenes de compra (vacía hasta el Sprint 3) |

**Reglas que aplica la BD:**
- **Los movimientos son inmutables.** Un trigger impide modificarlos o borrarlos; solo se puede cambiar el estado de uno `PENDIENTE`. Los errores se corrigen con un nuevo movimiento.
- **Los productos no se borran:** se dan de baja con `activo = false`.

## Pruebas

Desde `Backend/`:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## Pendiente

- **Sprint 3:** el login real con RRHH (hoy el front usa el token de prueba), las FKs hacia las tablas de los otros módulos (la de `rrhh.empleado` ya está) y las pantallas del front (imagen del producto, ajuste e historial). Las integraciones con e-Commerce y Logística ya están en la API; falta probarlas con esos equipos.
- **Sprint 4:** 100 o más registros en una tabla crítica, KPIs y dashboard en Power BI.
