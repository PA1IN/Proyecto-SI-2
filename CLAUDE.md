# CLAUDE.md: Módulo de Inventario "Lesgo" (Grupo 2)

Contexto y reglas de trabajo para retomar el proyecto en cualquier sesión. Responder siempre en **español neutro**.

## Forma de trabajo (obligatoria)

- **Solo modificar archivos en local.** No hacer `git commit` ni `git push`: el equipo revisa, commitea y pushea. Hacerlo solo si se pide de forma explícita en ese momento.
- **Cambios pequeños o medianos.** Cada entrega de trabajo debe equivaler a un commit revisable (un tema por vez). Si una tarea es grande, dividirla en pasos y detenerse después de cada uno para revisión.
- **Al terminar cada cambio**, dar un resumen breve: qué archivos se tocaron, qué se hizo y para qué. Proponer también un mensaje de commit.
- **Antes de entregar**, correr en `Backend/`: `npm run lint`, `npm test`, `npm run test:e2e` y `npm run build`. Informar el resultado real, aunque falle.
- **Instalar cada dependencia en el paso que la necesita**, para que el diff de `package.json` sea fácil de revisar.
- **Ramas:** `main` es la rama principal y se actualiza solo con PR. Cada sesión trabaja en una rama propia, creada desde `main` actualizada, con el nombre del usuario (`dazztyn`) o de la tarea. Nunca trabajar directo en `main`.
- **Al mergear ramas de otros integrantes a `main`** (por ejemplo, el frontend de `Rama-front` o las ramas del bloque 3), actualizar este archivo: la sección "Estado de ramas", el plan y lo que cambie en el stack.
- **Nunca escribir credenciales** (host, usuario o contraseña de la BD) en archivos versionados, en el chat ni en commits. Van solo en `.env`, que está en `.gitignore`.
- **No crear tablas ni modificar la BD central sin que el equipo lo pida.** Es compartida con los demás grupos.

## Proyecto

- **Asignatura:** Sistemas de Información II (UCN Coquimbo).
- **Qué se construye:** un mini-ERP entre varios grupos: Compras, Inventario, e-Commerce/Ventas, CRM, RRHH, Logística, Finanzas y Postventa.
- **Negocio:** "Lesgo", e-commerce de sets de LEGO.
- **Nuestro módulo (Inventario):** somos dueños del **maestro de productos** (`id_producto`) y del stock por bodega.
- **Problema que resuelve:** registrar y consultar los movimientos de stock para no vender sin stock ni comprar lo que ya existe, dejar trazabilidad de las operaciones de los empleados y generar datos para KPIs.
- **Integraciones:**
  - Ventas/e-Commerce: reserva y egreso.
  - Compras: ingreso.
  - Logística: picking y recepción.
  - Postventa: devoluciones.
  - RRHH: empleados y roles.

### Exigencias del enunciado (`Proyecto_SI2.pdf`)

- Maestros canónicos: `id_cliente` (Ventas), `id_proveedor` (Compras), `id_producto` (Inventario) e `id_empleado` (RRHH).
- Scripts DDL y DML en SQL.
- Al menos 5 tablas, 10 filas por tabla y 100 filas en una tabla crítica (la tabla de usuarios no cuenta).
- Integridad referencial con PK/FK.
- Usuarios y roles basados en el maestro de RRHH.
- Al menos 3 validaciones de datos o errores.
- BPMN del proceso.
- KPIs y dashboard en Power BI, con al menos 2 vistas: táctica y estratégica.

### Entregables por sprint

- **Sprint 1 (entregado):** problemática, backlog, BPMN, modelo ER y tablero ágil.
- **Sprint 2 (actual):**
  - Primera versión del módulo con conexión a la BD.
  - **Al menos 2 formularios** funcionales de ingreso o consulta.
  - Datos iniciales (10 o más por tabla).
  - Al menos 1 validación.
  - Demo del flujo parcial, mostrando lectura y escritura en la BD.
- **Sprint 3:**
  - Integración con los maestros canónicos.
  - Al menos 1 escenario de integración cruzada con otro módulo.
  - Autenticación y roles.
  - 3 validaciones en total.
  - Demo del flujo completo del módulo.
- **Sprint 4:**
  - Transacción end-to-end validada.
  - 100 o más registros en una tabla crítica.
  - KPIs vinculados a datos del módulo.
  - Dashboard en Power BI.
  - 2 escenarios de integración documentados.
  - Demo final.

## Stack

- **Backend:** `Backend/`, con NestJS 12 (ESM, `"type": "module"`, imports con extensión `.js`), TypeScript 6, TypeORM 1.1 + `pg`, vitest + supertest y oxlint + prettier.
- **Frontend:** React + Vite (puerto 5173) en `Frontend/modulo-inventario/`. En desarrollo en `Rama-front`; todavía no está en `main`. Usa datos simulados (`VITE_USE_MOCK`) y un proxy de Vite hacia `http://localhost:3000`.
- **BD:** PostgreSQL en un proyecto nuevo de Neon (servicio en la nube), base `si2_22026`.
- **Comunicación entre módulos:** HTTP/REST.

## Base de datos central (servidor nuevo, octubre 2026)

- **Organización:** un schema por grupo, en minúsculas: `compras`, `crm`, `ecommerce_ventas`, `finanzas`, `inventario`, `logistica`, `postventa` y `rrhh`. Las tablas comunes van en `public`.
  - En SQL no hacen falta comillas. En TypeORM: `schema: 'inventario'`.
- **Estado al 26-10-2026:** `inventario` cargado con el DDL y el DML del repo (8 tablas, triggers, 120 productos y 400 filas de stock); respaldo previo con `pg_dump` (schema vacío). `compras`, `crm` y `logistica` ya subieron sus tablas.
  - Datos creados en las pruebas: el producto `id_producto` 121 (`10497-1`, Galaxy Explorer, tema Icons), creado con `POST /productos`. Ese SKU ya no sirve para crear otro producto en la demo (da 409).
- **Acceso de superusuario y sin respaldo en el motor** (correo del profesor). Un error puede borrar datos de cualquier grupo sin vuelta atrás. Reglas:
  - Todo SQL califica el schema (`inventario.inv_producto`). Una tabla sin schema cae en `public`, que es compartido.
  - Los scripts del repo no usan `DROP` ni `TRUNCATE`, y el DDL va dentro de `BEGIN … COMMIT`.
  - Antes de cada DDL, respaldar nuestro schema con `pg_dump -n inventario`.
  - Nunca escribir en schemas de otros grupos ni en `public` sin acuerdo entre los grupos.
- **Maestro de productos:** vive en nuestro schema (`inventario.inv_producto`), igual que en la BD del semestre anterior, donde cada maestro estaba en el schema de su módulo. Los otros grupos lo referencian con FKs entre schemas.
- **Las FKs hacia tablas de otros módulos** solo se pueden crear cuando esas tablas existan (Sprint 3). El Sprint 2 no interactúa con otros módulos.
- **Entorno local primero:** el DDL y el DML se prueban en un Postgres local con Docker antes de ejecutarlos en la BD del profesor. `pg_dump` y `psql` se usan desde la imagen de Docker (no están instalados en el equipo).
- **Conexión:**
  - El endpoint de Neon con `-pooler` sirve para la app.
  - Para DDL, usar la conexión directa (el mismo host sin `-pooler`).
  - Neon exige SSL (`sslmode=require`).

## Modelo de datos acordado (DDL en `Backend/db/ddl/`)

```
-- Sprint 2 (schema inventario)
inv_temas(id_tema serial PK, nombre_tema)
inv_producto(id_producto serial PK, id_tema FK, sku UNIQUE, nombre_set, cant_piezas, activo)
inv_bodegas(id_bodega serial PK, nombre_bodega, ubicacion_fisica)
inv_stock_bodega(id_producto PK/FK, id_bodega PK/FK, cantidad_disponible, cantidad_reservada, cantidad_minima)
inv_movimiento(id_movimiento serial PK, id_empleado int, id_pedido int null, id_devolucion int null, fecha_registro, tipo_operacion, estado)
inv_detalles_movimiento(id_detalle serial PK, id_movimiento FK, id_producto FK, id_bodega FK, cantidad)
inv_despachos_operario(id_movimiento PK/FK, id_despacho int UNIQUE, observaciones_picking)        -- vacía hasta el Sprint 3
inv_recepciones_compra(id_movimiento PK/FK, id_proveedor int, id_oc int, nro_guia_proveedor, UNIQUE(id_oc, nro_guia_proveedor))  -- vacía hasta el Sprint 3

-- Sprint 3 (cuando existan las tablas de los otros módulos): agregar las FKs con ALTER TABLE
id_empleado → rrhh, id_pedido → ecommerce_ventas, id_devolucion → postventa,
id_despacho → logistica, id_proveedor e id_oc → compras
```

### Decisiones tomadas

- **Claves del producto:** `id_producto` es `serial` (PK canónica). `sku` es la clave de negocio única (el número de set de LEGO).
- **Precio:** lo maneja **e-Commerce** (`CATALOGO.precio_venta`). `inv_producto` no guarda precio y los KPIs propios van en unidades.
  - Un producto se vende solo si está activo, tiene precio en `CATALOGO` y stock disponible mayor a 0.
- **`tipo_operacion`:** `INGRESO`, `EGRESO`, `RESERVA`, `LIBERACION`, `AJUSTE`, `DEVOLUCION`. Van sin tildes en la BD.
- **`estado`:** `PENDIENTE`, `COMPLETADO`, `ANULADO`.
- **Bodega por línea:** `id_bodega` va en el detalle del movimiento, no en la cabecera.
- **Subtablas:** `inv_despachos_operario` e `inv_recepciones_compra` copian el `id_movimiento` del padre como PK y FK.
- **Proveedor de la recepción:** el backend valida que `id_proveedor` coincida con el proveedor de la OC.

### Reglas de negocio

- **Reserva:** producto de un pedido **ya pagado** que aún no se despacha. El carrito no reserva.
  - Checkout propuesto a e-Commerce: reservar y luego cobrar. Si la reserva responde 409, no se cobra; si el cobro falla, se libera.
- **Efecto de cada tipo en el stock:**

| Tipo | Efecto | Cuándo ocurre |
| --- | --- | --- |
| `INGRESO` | disponible + n | Logística confirma la recepción de una OC |
| `RESERVA` | disponible − n, reservada + n | e-Commerce confirma un pedido pagado |
| `EGRESO` | reservada − n | Logística confirma el despacho |
| `LIBERACION` | reservada − n, disponible + n | Cancelación, anulación o despacho parcial |
| `AJUSTE` | disponible ± n | Diferencias con el conteo físico, merma, pérdida o error |
| `DEVOLUCION` | por definir con Postventa | |

- **Elección de bodega al reservar:** se usa la que tenga más stock del producto, con empate resuelto por el `id_bodega` menor. Si una bodega no alcanza, se completa con la siguiente, generando una línea por bodega.
- **Estados e inmutabilidad:**
  - Solo `RESERVA` nace `PENDIENTE`, y pasa a `COMPLETADO` (con el egreso) o a `ANULADO` (con la liberación). Los demás tipos nacen `COMPLETADO`.
  - Un trigger impide `DELETE` y `UPDATE` en movimientos y detalles. La única excepción es pasar el estado desde `PENDIENTE`. Los errores se corrigen con un `AJUSTE`.
- **Todo cambio de stock pasa por un único servicio,** en una transacción con `UPDATE ... WHERE cantidad_disponible >= :cant`. Si no afecta filas, responde **409**.

### Decisiones del modelo (cerradas el 21-10-2026)

- **Stock mínimo:** `cantidad_minima` en `inv_stock_bodega`, por producto y bodega. La alerta de stock bajo y los quiebres se miden por bodega.
- **Sin `motivo` en el `AJUSTE`:** por tiempo. Los ajustes negativos cuentan juntos como diferencias de inventario.
- **Sin `fecha_cierre`:** el tiempo entre reserva y despacho se calcula cruzando la `RESERVA` con el `EGRESO` del mismo `id_pedido`.
- **Se eliminan `coleccion`, `edad_minima` y `tipo_construccion`** de `inv_producto`, para regirse por el dataset (Rebrickable/Kaggle).
- **Sprint 2 sin FKs a otros módulos:** `id_empleado`, `id_pedido`, `id_devolucion`, `id_despacho`, `id_proveedor` e `id_oc` son `int` sin FK. Las FKs se agregan en el Sprint 3 con `ALTER TABLE`; hay que confirmar con cada grupo que sus PK sean `int`.
- **Subtablas creadas y vacías (21-10-2026):** `inv_despachos_operario` e `inv_recepciones_compra` ya existen para que el esquema del módulo esté completo, pero sin datos de prueba: se llenan cuando Logística y Compras confirmen despachos y recepciones (Sprint 3). Esto justifica que tengan menos de 10 filas.

### Decisiones abiertas (no bloquean el DDL)

- **`DEVOLUCION`:** pendiente con Postventa si reingresa como disponible o queda en revisión.
- **KPIs:** se definen más adelante con los datos que haya.
- **Roles:** propuesta definida (ver "Roles y permisos del módulo"); falta que RRHH confirme los nombres y el formato del JWT.
- **Diagrama draw.io:** quitar las tildes de `tipo_operacion`, corregir la errata "inv_movimientos", cambiar "Hereda de" por "FK a", agregar `cantidad_minima` y quitar `coleccion`, `edad_minima` y `tipo_construccion`.

## Roles y permisos del módulo (propuesta del 25-10-2026, por enviar a RRHH)

RRHH gestiona el login y emite el JWT. Nuestro backend solo lee `id_empleado` y `rol` del token validado; el rol nunca viene del body.

| Rol (valor exacto en el JWT) | Quién es | Qué hace en el módulo |
| --- | --- | --- |
| `JEFE_BODEGA` | Responsable del inventario | Todo: maestro de productos, ajustes, mínimos de stock y reportes |
| `OPERADOR_BODEGA` | Trabajador de bodega | Operación diaria: registrar ingresos y consultar stock |
| `CONSULTA` | Marketing u otras áreas | Solo lectura: catálogo, stock y reportes en unidades |
| `ADMIN` | Administrador general del ERP (lo define RRHH) | Mismos permisos que `JEFE_BODEGA` en nuestros guards |

| Acción | Endpoint (referencial) | Jefe / Admin | Operador | Consulta |
| --- | --- | --- | --- | --- |
| Ver productos, temas y bodegas | `GET /productos`, `/productos/temas`, `/bodegas` | Sí | Sí | Sí |
| Ver stock | `GET /stock`, `/stock/:idProducto` | Sí | Sí | Sí |
| Ver historial de movimientos | `GET /movimientos` | Sí | Sí | No |
| Crear o editar producto, baja lógica | `POST/PATCH/DELETE /productos` | Sí | No | No |
| Registrar ingreso | `POST /movimientos/ingreso` | Sí | Sí | No |
| Registrar ajuste (conteo, merma, error) | `POST /movimientos/ajuste` | Sí | No | No |
| Cambiar el stock mínimo por bodega | `PATCH /stock/...` | Sí | No | No |
| Ver KPIs y alertas | `GET /reportes`, `/alertas` | Sí | No | Sí |

- Ya existen en `main`: `GET /productos`, `GET /productos/temas`, `POST /productos`, `GET /bodegas`, `GET /stock/:idProducto` y `POST /movimientos/ingreso`. Las demás rutas se fijan al construir cada módulo (bloque 3).
- **Integraciones sin rol humano:** reservar, liberar y confirmar despachos o recepciones lo invocan e-Commerce y Logística, no un empleado. Hace falta una credencial de servicio (por ejemplo, rol `SERVICIO` en un token emitido por RRHH, o una API key por módulo). Acordarlo con RRHH junto con los roles.
- **Por confirmar con RRHH:**
  - Nombres exactos de los roles y si un empleado puede tener más de uno (`rol` texto o `roles` arreglo).
  - Claims del token: `id_empleado` (int, el mismo de su maestro), `rol` y `exp`.
  - Firma: secreto compartido (HS256, `JWT_SECRET`) o clave pública (RS256), y cómo se distribuye.
  - Endpoint de login y duración del token.
- **Sugerencia abierta:** permitir que el Operador vea las alertas de stock bajo, porque es quien repone en bodega.

## Coordinación con otros equipos

- **Todos:**
  - API con prefijo `/api/v1`, formato de error común, fechas ISO-8601 y montos en CLP enteros.
  - Los maestros ajenos se leen de la BD (solo lectura) y el estado de otro módulo se escribe solo vía su API.
- **RRHH:** login y emisión del JWT (`id_empleado` + rol). Enviarles la propuesta de "Roles y permisos del módulo" y la necesidad de una credencial de servicio para las integraciones.
- **e-Commerce:** contrato para reservar, confirmar y liberar con `id_pedido`; cómo se enteran de los productos nuevos.
- **Logística:** contenido de la confirmación de despacho y de recepción.
- **Compras:** cómo reciben la alerta de stock bajo.
- **Postventa:** devoluciones.

## Arquitectura del backend

Monolito modular NestJS en capas (controller → service → repositorio). Las integraciones son adaptadores aislados.

```
Backend/
├─ .env.example
├─ db/ddl/*.sql, db/dml/*.sql   ← fuente de verdad del esquema (entregable)
├─ postman/                     ← colección de pruebas de la API (demo por Postman o Swagger)
└─ src/
   ├─ main.ts / setup-app.ts  ← prefijo /api/v1, CORS (Vite :5173), ValidationPipe, Swagger /api/docs
   ├─ config/                 ← validación de variables de entorno
   ├─ common/                 ← filtro global de errores, paginación
   ├─ auth/                   ← JwtAuthGuard + RolesGuard + @Public/@Roles/@CurrentUser (mock → RRHH)
   ├─ health/
   ├─ database/               ← TypeORM (synchronize: false)
   ├─ catalogo/ bodegas/ stock/ movimientos/ alertas/ integraciones/ reportes/
```

### Reglas técnicas (lecciones del repo de referencia heuremi/backend-inventario)

- TypeORM siempre con `synchronize: false`. El esquema lo definen los scripts de `db/ddl`.
- DTOs con class-validator y `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`.
- El rol del usuario sale de un JWT validado por un guard, **nunca del body**.
- Los errores se responden con `HttpException` y el código HTTP real, a través de un filtro global. **Nunca responder 200 con `{error}`.**
- El stock se descuenta siempre en una transacción con un `UPDATE` condicional (sin hacer `findOne` → restar → `save`).
- No modificar tablas de otros equipos.
- Usar vistas SQL para los KPIs.
- Usar baja lógica (`activo`), no borrado físico.
- Si dos entidades se importan mutuamente, el lado `@ManyToOne` declara el tipo como `Relation<T>`. Si no, en ESM la app compilada se cae al iniciar (`Cannot access 'X' before initialization`). Vitest no detecta este error: hay que probar con `npm run build` y arrancar la app.

## Estado de ramas (al 26-10-2026)

| Rama | Contenido | Estado |
| --- | --- | --- |
| `main` | Pasos 1 a 7 (config, setup-app, filtro de errores, health, Postgres local, DDL/DML y ORM con TypeORM) y del bloque 3: 3.2, 3.3, `GET /bodegas` y la colección Postman. Endpoints: `GET /productos`, `GET /productos/temas`, `POST /productos`, `GET /bodegas`, `GET /stock/:idProducto` y `POST /movimientos/ingreso` | Al día con `faltante-para-sprint2` (PR #10) |
| `docs-estado-sprint2` | Este archivo, actualizado después del PR #10 | Pendiente de PR |
| `faltante-para-sprint2` | 3.2, 3.3, `GET /bodegas` y la colección Postman | Ya mergeada en `main` (PR #10); el resto del bloque 3 va en ramas nuevas desde `main` |
| `Rama-front` | Frontend React + Vite (`Frontend/modulo-inventario/`): páginas de productos y bodegas, con datos simulados | Pendiente de merge a `main`. Su respuesta esperada de `GET /productos` no calza con la del backend (ver bloque 3) |
| `David-rama`, `Pablo-Rama` | ORM y fixes de los bloques 1 y 2 | Ya mergeadas en `main` (PR #5 y #9); no se usan más |
| `config-base`, `fixes-previo-a-entidades`, `bd-local-prueba`, `dazztyn` | Pasos 1 a 6 y documentación | Ya mergeadas en `main`; no se usan más |

Pendiente aparte: un commit `chore(deps): npm audit fix` (sin `--force`) en su propia rama. Hay 3 vulnerabilidades altas en dependencias de producción (`body-parser` y `multer`, vía `@nestjs/platform-express`).

## Plan inmediato: base del backend y schema propio

Cada paso equivale a un commit, con revisión entre pasos. Los pasos 1 a 7 ya están en `main`.

1. ✅ Configuración validada (`@nestjs/config` + class-validator) y `.env.example`.
2. ✅ `setup-app.ts`: prefijo `/api/v1`, CORS, `ValidationPipe` y Swagger. Se elimina el controlador de ejemplo del scaffold.
3. ✅ Filtro global de errores con un formato único.
4. ✅ `GET /api/v1/health` (sin BD) y los e2e correspondientes.
5. ✅ Postgres local con Docker (`docker-compose.yml`, misma versión mayor que Neon).
6. ✅ DDL y DML del schema `inventario`, probados en local: 8 tablas (2 subtablas vacías hasta el Sprint 3), triggers de inmutabilidad, 120 productos de Rebrickable y `db/test/validar_ddl.sql`.
7. ✅ TypeORM y conexión (local o Neon según el `.env`, con SSL validado). La verificación de la BD en `/health` pasó al bloque 3.
8. Auth simulado: JWT, guards, decoradores y los roles de "Roles y permisos del módulo" (`JEFE_BODEGA`, `OPERADOR_BODEGA`, `CONSULTA`, `ADMIN`), con un token de prueba por rol solo en desarrollo. Usar los mismos claims que se acuerden con RRHH, para que en el Sprint 3 solo cambie quién firma el token.
9. DTO de paginación.
10. README en español.

**Neon:** el DDL/DML ya está ejecutado (26-10-2026, desde DBeaver con conexión sin `-pooler`, pegando cada script y ejecutándolo con Alt+X). Los cambios futuros al esquema van primero a `db/ddl` o `db/dml`, se prueban en local y recién después se ejecutan en Neon. Seguir desarrollando con el Postgres local. Después del bloque 3 siguen los pasos 8, 9 y 10, y el `npm audit fix`.

## Bloque 3: lo que falta para la demo del Sprint 2

Objetivo: los 2 formularios leyendo y escribiendo en la BD. Formulario 1, productos (crear y consultar). Formulario 2, movimientos (registrar un ingreso y ver el stock actualizado). Cada tarea va en su propia rama desde `main` y equivale a un commit o PR.

| # | Rama sugerida | Tarea | Depende de |
| --- | --- | --- | --- |
| 3.1 | `health-bd` | `/health` ejecuta `SELECT 1` con el `DataSource`: 200 `{ status: 'ok', bd: 'ok' }`, o 503 si no hay conexión. Con e2e | — |
| 3.2 ✅ | `entidades-movimiento` | Entidades `InvMovimiento` (`fecha_registro` como `timestamptz`), `InvDetalleMovimiento`, `InvDespachoOperario` e `InvRecepcionCompra`, alineadas con `db/ddl/01_tablas.sql` | — |
| 3.3 ✅ | `ingreso-movimientos` | **Formulario 2.** `POST /movimientos/ingreso` con `RegistrarIngresoDto`. Valida que el producto exista y esté activo, y que la bodega exista (404). En una transacción: cabecera `INGRESO` `COMPLETADO`, detalle y stock con `INSERT ... ON CONFLICT (id_producto, id_bodega) DO UPDATE` que suma la cantidad. Responde 201 con el movimiento y su detalle. `id_empleado` sigue en el body con `// TODO paso 8: sacarlo del token`. Tests unitarios del servicio | 3.2 |
| 3.4 | `ajuste-movimientos` | Opcional para la demo. `POST /movimientos/ajuste` con cantidad distinta de 0; si es negativa, `UPDATE` condicional y 409 si el stock quedaría bajo 0 | 3.2 |
| 3.5 (parcial) | `consultas` | **`GET /bodegas` ✅ (PR #10)**: lo usan la página de bodegas y el selector del formulario de ingreso. Falta, opcional para la demo: `GET /movimientos` (más recientes primero, `?limit=` con máximo 100 hasta el paso 9) y `GET /movimientos/:id` con su detalle | 3.2 (solo movimientos) |
| 3.6 | `contrato-front` | El front espera en `GET /productos` el tema como texto y `cantidad_disponible`, `cantidad_reservada` y `stock_minimo` sumados por producto. **Esencial:** con datos reales, la tabla mostraría `[object Object]` y columnas vacías. Opción más barata: que el front lea `tema.nombre_tema` de `GET /productos` y el stock con `GET /stock/:idProducto`. Alternativa: `GET /stock` con el resumen por producto (usando `cantidad_minima`); `GET /productos` queda como maestro. **Acordarlo con quien hace el front antes de programar** | — |
| 3.7 | `catalogo-crud` | `GET /productos/:id` (404), `PATCH /productos/:id` (DTO con `PartialType` de `@nestjs/swagger`; SKU repetido da 409) y `DELETE /productos/:id` como baja lógica (`activo = false`) | — |
| 3.8 | `tests-unitarios` | `calcularAsignacionReserva` (alcanza una bodega, reparte entre dos, empate por id menor, insuficiente da `null`) y `CatalogoService` (tema inexistente da 404, SKU duplicado da 409) | — |
| 3.9 | `Rama-front` | **Esencial. Formulario 1 en el front:** crear producto (SKU, nombre, piezas y selector de tema desde `GET /productos/temas`) con `POST /productos`; muestra los errores 409/404/400 del backend y luego el producto en el listado | 3.6 |
| 3.10 | `Rama-front` | **Esencial. Formulario 2 en el front:** registrar ingreso (selectores de producto y bodega, y cantidad) con `POST /movimientos/ingreso`; al guardar, muestra el stock actualizado con `GET /stock/:idProducto`. `fetchBodegas()` debe llamar a `GET /bodegas` (hoy devuelve siempre datos simulados) | 3.5 (`GET /bodegas`) |
| 3.11 | — | **Esencial.** Mergear `Rama-front` a `main` por PR y actualizar este archivo | 3.9, 3.10 |

**Estado del front (revisado el 26-10-2026 en `origin/Rama-front`):** solo tiene páginas de lectura (`Productos.tsx` y `Bodegas.tsx`), sin ningún `<form>` ni `POST`. Por eso los formularios del Sprint 2 dependen de 3.9 y 3.10.

**Esencial para la demo:** `GET /bodegas` (3.5) ✅, 3.6, 3.9, 3.10 y 3.11. Lo que falta es todo del front. **Opcional:** 3.1, 3.4, 3.7, 3.8 y `GET /movimientos`. Plan B: demo por Swagger, con el riesgo de que no cuente como formulario (confirmar con el profesor).

Orden sugerido: 3.2 primero, porque desbloquea 3.3, 3.4 y 3.5. Hecho y en `main` (PR #10): 3.2 ✅ → 3.3 ✅ → `GET /bodegas` (3.5) ✅. Sigue, cada una en su rama desde `main`: resto de la 3.5 → 3.1 → 3.8 → 3.4 → 3.7. En paralelo, quien lleva `Rama-front`: acordar la 3.6 y hacer 3.9 y 3.10. Varias tareas tocan `app.module.ts`, pero ahí los conflictos son de una línea.

**Checklist de la demo:**

- [x] DDL y DML ejecutados en Neon (conteos verificados en DBeaver).
- [x] Backend contra Neon: `GET /productos` devuelve 120 productos (121 después de la prueba de creación), y `GET /bodegas`, `GET /stock/:idProducto` y `/health` responden.
- [x] Backend del formulario 1 en Neon: `POST /productos` crea el producto 121 y aparece en `GET /productos`. Falta la pantalla del front (3.9).
- [x] Backend del formulario 2 en el Postgres local: `POST /movimientos/ingreso` crea la fila de stock si no existe y suma si existe. **Falta probarlo en Neon** (el movimiento queda permanente): un ingreso al producto 121 en la bodega 1. Falta la pantalla del front (3.10).
- [ ] Validaciones a mostrar: SKU duplicado (409), tema inexistente (404) y campos inválidos (400) ya probados en Neon; producto o bodega inexistente en el ingreso (404) y cantidad 0 (400) probados en local. Falta stock negativo (409 en el ajuste, 3.4, o `CHECK` en la BD).
- [ ] Frontend conectado al backend (`VITE_USE_MOCK=false`), o la demo con `Backend/postman/inventario.postman_collection.json` (Postman o Swagger) si no alcanza.

## Material de referencia

- Enunciado: `Proyecto_SI2.pdf`.
- Esquema global: `Proy-SI-2-Schema.drawio`.
- ER del módulo: `Modelo_ER_inventario.drawio`.
- Informe Sprint 1: `Entrega_Sprint_1_Grupo_2.pdf`.
- Repo de referencia: https://github.com/heuremi/backend-Inventario
- Documento compartido del plan: https://claude.ai/code/artifact/562b73af-7358-4e2f-a67d-c738c6cec7d6
