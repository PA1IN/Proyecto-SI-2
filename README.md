# Módulo de Inventario "Lesgo" (Grupo 2)

Módulo de Inventario del mini-ERP de **Sistemas de Información II** (UCN Coquimbo). El negocio es **Lesgo**, un e-commerce de sets de LEGO.

El módulo es dueño del **maestro de productos** (`id_producto`) y del **stock por bodega**. Registra los movimientos de stock para no vender sin stock ni comprar lo que ya existe, y deja trazabilidad de las operaciones.

> **Estado:** Sprint 2. Hay backend con conexión a la BD y dos formularios en el front: crear producto y registrar ingreso de stock.

## Stack

| Parte | Tecnología | Carpeta |
| --- | --- | --- |
| Backend | NestJS 12 (ESM), TypeScript 6, TypeORM + `pg`, Swagger | [`Backend/`](Backend/) |
| Frontend | React 19 + Vite + React Router | [`Frontend/modulo-inventario/`](Frontend/modulo-inventario/) |
| Base de datos | PostgreSQL 17: Neon (compartida entre grupos) o Docker local | [`Backend/db/`](Backend/db/) |
| Calidad | vitest + supertest, oxlint, prettier | |

## Estructura

```
Backend/
├─ db/
│  ├─ ddl/        01_tablas.sql, 02_triggers.sql  (schema inventario)
│  ├─ dml/        temas, bodegas, 120 productos y stock inicial
│  ├─ local/      crea el schema en el Postgres de Docker
│  └─ test/       validar_ddl.sql (prueba restricciones y triggers, termina en ROLLBACK)
├─ src/
│  ├─ catalogo/     productos y temas
│  ├─ stock/        bodegas y stock por bodega
│  ├─ movimientos/  ingresos de stock
│  ├─ health/       estado del servicio
│  ├─ common/       filtro global de errores
│  ├─ config/       validación de variables de entorno
│  └─ database/     conexión TypeORM (synchronize: false)
├─ test/          pruebas e2e
└─ docker-compose.yml
Frontend/modulo-inventario/
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
docker exec inventario-postgres psql -U inventario -d si2_local -v ON_ERROR_STOP=1 -f /db/ddl/01_tablas.sql -f /db/ddl/02_triggers.sql -f /db/dml/01_temas.sql -f /db/dml/02_bodegas.sql -f /db/dml/03_productos.sql -f /db/dml/04_stock_inicial.sql
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
- **El `.env` nunca se sube al repo**, porque contiene las credenciales de Neon.
- La API queda en `http://localhost:3000/api/v1`.
- Swagger queda en `http://localhost:3000/api/docs`, para probar los endpoints sin el front.

### 3. Frontend

Desde `Frontend/modulo-inventario/`:

```bash
npm install
npm run dev
```

- Se abre en `http://localhost:5173`. Vite redirige `/api` al backend en el puerto 3000, así que el backend debe estar corriendo.
- `VITE_USE_MOCK=false` (en `.env`) usa el backend real. Con `true`, el front muestra datos simulados.

## Endpoints

Todos van con el prefijo `/api/v1`.

| Método | Ruta | Qué hace |
| --- | --- | --- |
| `GET` | `/health` | Estado del servicio |
| `GET` | `/productos` | Lista los productos activos, con su tema |
| `GET` | `/productos/temas` | Lista los temas |
| `POST` | `/productos` | Crea un producto |
| `GET` | `/bodegas` | Lista las bodegas |
| `GET` | `/stock` | Resumen por producto: disponible, reservado y mínimo (sumados entre bodegas), y cuántas bodegas están bajo su mínimo |
| `GET` | `/stock/:idProducto` | Stock de un producto en cada bodega |
| `POST` | `/movimientos/ingreso` | Registra un ingreso de stock |

### Ejemplos de body

Crear producto:

```json
{ "id_tema": 1, "sku": "75192-1", "nombre_set": "Millennium Falcon", "cant_piezas": 7541 }
```

Registrar ingreso:

```json
{ "id_empleado": 1, "id_producto": 1, "id_bodega": 1, "cantidad": 10 }
```

`id_empleado` va en el body solo por ahora. Cuando esté la autenticación, saldrá del token.

### Validaciones

Los errores responden con el código HTTP real y un formato común:

```json
{ "statusCode": 409, "error": "CONFLICT", "message": "...", "path": "/api/v1/productos", "timestamp": "..." }
```

| Caso | Código |
| --- | --- |
| Campos faltantes, de tipo incorrecto o no permitidos; cantidad 0 o negativa | 400 |
| Tema, producto o bodega inexistente (o producto inactivo en el ingreso) | 404 |
| SKU repetido | 409 |

## Modelo de datos

Todas las tablas van en el schema `inventario`:

| Tabla | Contenido |
| --- | --- |
| `inv_temas` | Temas de LEGO (Star Wars, City, …) |
| `inv_producto` | Maestro de productos. `sku` es el número de set y es único |
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

- **Sprint 3:** autenticación y roles con el JWT de RRHH, integración con e-Commerce, Logística, Compras y Postventa, y las FKs hacia sus tablas.
- **Sprint 4:** 100 o más registros en una tabla crítica, KPIs y dashboard en Power BI.
- Opcionales del Sprint 2: ajustes de stock, historial de movimientos, y edición y baja de productos.
