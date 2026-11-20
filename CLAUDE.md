# CLAUDE.md: Módulo de Inventario "Lesgo" (Grupo 2)

Contexto y reglas de trabajo para retomar el proyecto en cualquier sesión. Responder siempre en **español neutro**.

## Forma de trabajo (obligatoria)

- **Solo modificar archivos en local.** No hacer `git commit` ni `git push`: el equipo revisa, commitea y pushea. Hacerlo solo si se pide de forma explícita en ese momento.
- **Cambios pequeños o medianos.** Cada entrega de trabajo debe equivaler a un commit revisable (un tema por vez). Si una tarea es grande, dividirla en pasos y detenerse después de cada uno para revisión.
- **Al terminar cada cambio**, dar un resumen breve: qué archivos se tocaron, qué se hizo y para qué. Proponer también un mensaje de commit.
- **Antes de entregar**, correr en `Backend/`: `npm run lint`, `npm test`, `npm run test:e2e` y `npm run build`. Informar el resultado real, aunque falle.
- **Instalar cada dependencia en el paso que la necesita**, para que el diff de `package.json` sea fácil de revisar.
- **Ramas:** `main` es la rama principal y se actualiza solo con PR. Cada sesión trabaja en una rama propia, creada desde `main` actualizada, con el nombre del usuario (`dazztyn`) o de la tarea. Nunca trabajar directo en `main`.
- **Al mergear ramas de otros integrantes a `main`**, actualizar este archivo: la sección "Estado de ramas", el plan y lo que cambie en el stack.
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
- **Sprint 2 (entregado el 28-10-2026):**
  - Primera versión del módulo con conexión a la BD.
  - **Al menos 2 formularios** funcionales de ingreso o consulta.
  - Datos iniciales (10 o más por tabla).
  - Al menos 1 validación.
  - Demo del flujo parcial, mostrando lectura y escritura en la BD.
- **Sprint 3 (actual):**
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
- **Frontend:** React 19 + Vite (puerto 5173) en `Frontend/` (antes estaba en `Frontend/modulo-inventario/`). Ya está en `main`.
  - Páginas: listado de productos con stock, detalle, crear producto, ingreso de stock y bodegas.
  - Proxy de Vite hacia `http://localhost:3000`. Con `VITE_USE_MOCK=false` usa el backend real.
- **BD:** PostgreSQL en un proyecto nuevo de Neon (servicio en la nube), base `si2_22026`.
- **Comunicación entre módulos:** HTTP/REST.
- **Docker (acordado entre los grupos el 16-11-2026):** cada backend se entrega como imagen. `Backend/Dockerfile` (Node 24 alpine, en dos etapas, usuario `node` y healthcheck a `/api/v1/health`) solo trae la API; la BD sigue en Neon y el `.env` se monta al correr (`-v "${PWD}/.env:/app/.env:ro"`). No usar `--env-file`: no quita las comillas, y la contraseña de Neon las necesita por contener `#`. El `.dockerignore` deja fuera el `.env`.

## Base de datos central (servidor nuevo, octubre 2026)

- **Organización:** un schema por grupo, en minúsculas: `compras`, `crm`, `ecommerce_ventas`, `finanzas`, `inventario`, `logistica`, `postventa` y `rrhh`. Las tablas comunes van en `public`.
  - En SQL no hacen falta comillas. En TypeORM: `schema: 'inventario'`.
- **Estado de `inventario` al 16-11-2026:**
  - 8 tablas y triggers. 129 productos: los 120 del DML más 9 creados en pruebas, entre ellos el 121 (`10497-1`) y `12345-1` ("Lego Mr. Beast").
  - **Todos los scripts del repo están ejecutados en Neon:**
    - `db/ddl/03` y `db/dml/05` (11-11): `url_imagen`; 121 productos con imagen de Rebrickable.
    - `db/ddl/04` (13-11): `id_empleado` nullable solo en `RESERVA` y `LIBERACION`.
    - `db/ddl/05` (14-11): índice único de una reserva por pedido.
    - `db/ddl/06`, `db/ddl/07` y `db/dml/06` (16-11): peso y medidas (129 de 129 productos con medidas) e `id_despacho` como `varchar(50)`.
  - Los respaldos con `pg_dump -n inventario` se guardan en el equipo de dazztyn, fuera del repo. El último confirmado es del 11-11; conviene uno nuevo antes del próximo DDL.
  - Un SKU ya usado no sirve para crear otro producto en una demo (da 409).
- **Otros schemas (visto en DBeaver el 11-11-2026):**
  - `rrhh`: ya tiene `rrhh.empleado` (PK `id_empleado serial`; el 27-10 tenía 10 empleados).
  - `postventa`: tiene tablas con productos (`cambio_producto`, `registro_producto`).
  - `logistica`: usa tablas de prueba propias (`test_log_inv_producto`, `test_log_inv_mov`, `test_log_ventas_pedido`) en vez de nuestros datos y los de e-Commerce.
  - Hay un schema nuevo, `master`. Falta confirmar quién lo creó y qué contiene.
- **DBeaver:** el editor puede subrayar en rojo tablas que sí existen ("Table … not found"). Es un falso aviso de su validación. Los scripts se ejecutan con Alt+X y lo que vale es el panel de resultados.
- **Acceso de superusuario y sin respaldo en el motor** (correo del profesor). Un error puede borrar datos de cualquier grupo sin vuelta atrás. Reglas:
  - Todo SQL califica el schema (`inventario.inv_producto`). Una tabla sin schema cae en `public`, que es compartido.
  - Los scripts del repo no usan `DROP` ni `TRUNCATE`, y el DDL va dentro de `BEGIN … COMMIT`.
  - Antes de cada DDL, respaldar nuestro schema con `pg_dump -n inventario`.
  - Nunca escribir en schemas de otros grupos ni en `public` sin acuerdo entre los grupos.
- **Maestro de productos:** vive en nuestro schema (`inventario.inv_producto`), igual que en la BD del semestre anterior, donde cada maestro estaba en el schema de su módulo. Los otros grupos lo referencian con FKs entre schemas.
- **Las FKs hacia tablas de otros módulos** solo se pueden crear cuando esas tablas existan y su PK sea del mismo tipo. Se agregan en el Sprint 3 (ver "Sprint 3: plan").
- **Entorno local primero:** el DDL y el DML se prueban en un Postgres local con Docker antes de ejecutarlos en la BD del profesor. `pg_dump` y `psql` se usan desde la imagen de Docker (no están instalados en el equipo).
- **Conexión:**
  - El endpoint de Neon con `-pooler` sirve para la app.
  - Para DDL, usar la conexión directa (el mismo host sin `-pooler`).
  - Neon exige SSL (`sslmode=require`).

## Modelo de datos acordado (DDL en `Backend/db/ddl/`)

```
-- Sprint 2 (schema inventario)
inv_temas(id_tema serial PK, nombre_tema)
inv_producto(id_producto serial PK, id_tema FK, sku UNIQUE, nombre_set, cant_piezas, activo, url_imagen null,
             peso_unitario_kg null, largo_cm null, alto_cm null, ancho_cm null)  -- numeric(10,2), > 0
inv_bodegas(id_bodega serial PK, nombre_bodega, ubicacion_fisica)
inv_stock_bodega(id_producto PK/FK, id_bodega PK/FK, cantidad_disponible, cantidad_reservada, cantidad_minima)
inv_movimiento(id_movimiento serial PK, id_empleado int null (solo en RESERVA y LIBERACION), id_pedido int null, id_devolucion int null, fecha_registro, tipo_operacion, estado)
inv_detalles_movimiento(id_detalle serial PK, id_movimiento FK, id_producto FK, id_bodega FK, cantidad)
inv_despachos_operario(id_movimiento PK/FK, id_despacho varchar(50) UNIQUE, observaciones_picking)        -- vacía hasta el Sprint 3
inv_recepciones_compra(id_movimiento PK/FK, id_proveedor int, id_oc int, nro_guia_proveedor, UNIQUE(id_oc, nro_guia_proveedor))  -- vacía hasta el Sprint 3

-- Sprint 3 (cuando existan las tablas de los otros módulos): agregar las FKs con ALTER TABLE
id_empleado → rrhh, id_pedido → ecommerce_ventas, id_devolucion → postventa,
id_despacho → logistica, id_proveedor e id_oc → compras
```

### Decisiones tomadas

- **Claves del producto:** `id_producto` es `serial` (PK canónica). `sku` es la clave de negocio única (el número de set de LEGO).
- **Imagen:** `url_imagen` guarda solo la URL, nunca el archivo (acordado con e-Commerce el 09-11-2026). Los productos del dataset usan la URL de Rebrickable (columna `img_url` de `sets.csv`). Para productos propios se puede usar Cloudinary; la subida de archivos no está implementada y la API recibe solo la URL (`https`).
- **Peso y medidas de la caja (16-11-2026):** `peso_unitario_kg`, `largo_cm`, `alto_cm` y `ancho_cm` en `inv_producto`, con los nombres y la precisión de Logística (`numeric(10,2)`, mayores que 0). Somos dueños del dato; el peso volumétrico, la tarifa y los bultos los calcula y guarda Logística.
  - **Estimación acordada con Logística:** peso = 0,20 + 0,0011 × piezas (kg, 2 decimales); caja por rango de piezas: hasta 300 → 26 × 19 × 6, hasta 1.000 → 38 × 26 × 7, hasta 2.500 → 48 × 38 × 9, hasta 5.000 → 58 × 48 × 12, más → 70 × 50 × 17 (cm).
  - La fórmula está en `src/catalogo/utils/estimar-medidas.util.ts` (la usa `POST /productos` para cada medida que no venga) y en `db/dml/06_medidas_productos.sql` (productos existentes). Si cambia una, cambiar la otra. Los valores reales se cargan con `PATCH /productos/:id`.
- **Precio:** lo maneja **e-Commerce** (`CATALOGO.precio_venta`). `inv_producto` no guarda precio y los KPIs propios van en unidades.
  - Un producto se vende solo si está activo, tiene precio en `CATALOGO` y stock disponible mayor a 0.
- **`tipo_operacion`:** `INGRESO`, `EGRESO`, `RESERVA`, `LIBERACION`, `AJUSTE`, `DEVOLUCION`. Van sin tildes en la BD.
- **`estado`:** `PENDIENTE`, `COMPLETADO`, `ANULADO`.
- **Bodega por línea:** `id_bodega` va en el detalle del movimiento, no en la cabecera.
- **Subtablas:** `inv_despachos_operario` e `inv_recepciones_compra` copian el `id_movimiento` del padre como PK y FK.
- **`id_empleado` en movimientos automáticos (13-11-2026):** nullable solo en `RESERVA` y `LIBERACION`, que las dispara e-Commerce sin un empleado detrás (`NULL` = lo hizo el sistema). El `CHECK chk_empleado_requerido` lo exige en los demás tipos. Script `db/ddl/04_empleado_nullable.sql`; no depende de RRHH, porque la futura FK acepta `NULL`.
- **Una sola reserva por pedido (14-11-2026):** índice único parcial `uq_reserva_por_pedido` sobre `id_pedido` en las filas `RESERVA` (`db/ddl/05_reserva_unica.sql`). Hace idempotente la reserva aunque dos reintentos lleguen a la vez: la segunda falla en la BD y el backend devuelve la existente. Incluye las `ANULADO`: acordado con e-Commerce que un pedido cancelado no se reactiva; se crea otro con un id nuevo.
- **`id_despacho` como texto (16-11-2026):** `varchar(50)` con `UNIQUE`, guarda el id de la guía de Logística (`GD-52341`); el `UNIQUE` hace idempotente el despacho. Script `db/ddl/07_despacho_varchar.sql`.
- **Proveedor de la recepción:** el backend valida que `id_proveedor` coincida con el proveedor de la OC.

### Reglas de negocio

- **Reserva:** producto de un pedido **ya pagado** que aún no se despacha. El carrito no reserva.
  - Acordado con e-Commerce el 09-11-2026: ellos llaman a la reserva **después de confirmar el pago**. Nosotros implementamos los endpoints de reserva y liberación.
  - Por definir con ellos: qué hacen si la reserva responde 409 con el pago ya confirmado (devolución del dinero o pedido en espera).
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
- **Roles:** ver "Roles y permisos del módulo". Falta que RRHH cree nuestros roles y entregue el secreto del JWT.
- **Diagrama draw.io:** quitar las tildes de `tipo_operacion`, corregir la errata "inv_movimientos", cambiar "Hereda de" por "FK a", agregar `cantidad_minima` y quitar `coleccion`, `edad_minima` y `tipo_construccion`.

## Roles y permisos del módulo (acordado el 09-11-2026; faltan detalles con RRHH)

RRHH gestiona el login y emite el JWT, con roles por módulo. Nuestro backend solo lee el empleado y el rol del token validado; el rol nunca viene del body.

| Rol (valor exacto por confirmar con RRHH) | Quién es | Qué hace en el módulo |
| --- | --- | --- |
| `JEFE_BODEGA` | Responsable del inventario | Todo: maestro de productos, ajustes, mínimos de stock y reportes |
| `OPERADOR_BODEGA` | Trabajador de bodega | Operación diaria: registrar ingresos y consultar stock |
| `CONSULTA` | Marketing u otras áreas | Solo lectura: catálogo, stock y reportes en unidades |

Por decidir: si el rol `Administrador` de RRHH tiene acceso total en nuestros guards (antes lo llamábamos `ADMIN`).

| Acción | Endpoint (referencial) | Jefe | Operador | Consulta |
| --- | --- | --- | --- | --- |
| Ver productos, temas y bodegas | `GET /productos`, `/productos/temas`, `/bodegas` | Sí | Sí | Sí |
| Ver stock | `GET /stock`, `/stock/:idProducto` | Sí | Sí | Sí |
| Ver historial de movimientos | `GET /movimientos` | Sí | Sí | No |
| Crear o editar producto, baja lógica | `POST/PATCH/DELETE /productos` | Sí | No | No |
| Crear o editar bodega | `POST/PATCH /bodegas` | Sí | No | No |
| Registrar ingreso | `POST /movimientos/ingreso` | Sí | Sí | No |
| Registrar ajuste (conteo, merma, error) | `POST /movimientos/ajuste` | Sí | No | No |
| Cambiar el stock mínimo por bodega | `PATCH /stock/...` (no existe aún) | Sí | No | No |
| Ver KPIs y alertas | `GET /reportes`, `/alertas` (no existen aún) | Sí | No | Sí |

- **Hoy ningún endpoint pide token.** Los guards son la tarea S3.2.
- **Sugerencia abierta:** permitir que el Operador vea las alertas de stock bajo, porque es quien repone en bodega.

### Cómo funciona el token de RRHH (repo revisado el 08-11-2026)

- **Login:** `POST /auth/login` con `{ username, password }`. Responde `{ accessToken, user }`. Sin prefijo `/api/v1`.
- **Firma:** HS256 con secreto compartido (`JWT_SECRET`). Dura 8 horas. Lo validamos en nuestro backend con el mismo secreto, sin llamar a RRHH.
- **Claims:** `sub`, `username`, `role` (texto), `employeeId` (el `id_empleado` de `rrhh.empleado`) y `source` (`'demo'` o `'db'`). Ojo: son `employeeId` y `role`, no `id_empleado` ni `rol`.
- **Roles:** tabla `rrhh.rol`, asignados en `rrhh.empleado_rol`.

**Pendiente con RRHH:**
- **Secreto real:** si no configuran `JWT_SECRET`, su código usa un valor por defecto que está en su repo. Deben fijar uno y entregarlo por fuera del repo.
- **Crear nuestros roles** en `rrhh.rol` con nombres exactos y asignarlos a empleados de prueba.
- **Un solo rol por token:** toman el primer rol del empleado por `id_rol`. Con roles por módulo, pedir un arreglo `roles` o un solo rol por empleado.
- **Admin de prueba:** su usuario `admin` (`source: 'demo'`) no existe en la BD. Decidir si lo aceptamos.
- **Revocación:** validando solo la firma, un empleado bloqueado conserva el acceso hasta que venza su token.
- **CORS de su login:** solo acepta sus propios front. Para que nuestro front inicie sesión, deben agregar nuestro origen.

### Integraciones sin rol humano

Reservar, liberar y confirmar despachos o recepciones lo invocan e-Commerce y Logística, no un empleado. El JWT de RRHH no sirve ahí, porque identifica a una persona. Ver "`id_empleado` en movimientos automáticos" en las decisiones tomadas.

**Credencial de servicio (decidido el 12-11-2026): API key por módulo.**
- Cada módulo consumidor envía su clave como `Authorization: Bearer <clave>` (e-Commerce ya lo hace con `INVENTORY_API_TOKEN`).
- Las claves van en `.env`, en `INTEGRACION_API_KEYS=modulo:clave,modulo:clave` (16 caracteres o más por clave). Se entregan a cada grupo por fuera del repo.
- `ApiKeyGuard` (`Backend/src/auth/api-key.guard.ts`) responde 401 si la clave falta o no coincide, y deja el nombre del módulo en `request.moduloCliente`. Con la variable vacía rechaza todo.
- Se aplica con `@UseGuards(ApiKeyGuard)` y `@ApiBearerAuth()` en cada endpoint de integración. Lo usan los endpoints de integración: reserva, liberación, `GET /reservas`, despacho y recepción. Swagger tiene el botón Authorize para probarlos.
- Claves generadas: e-Commerce y Logística (16-11). Cada backend que se conecte a Neon necesita ambas en su `.env`.

## Coordinación con otros equipos

- **Todos:**
  - API con prefijo `/api/v1`, formato de error común, fechas ISO-8601 y montos en CLP enteros. Al 08-11, RRHH, e-Commerce y Logística no usan el prefijo.
  - Los maestros ajenos se leen de la BD (solo lectura) y el estado de otro módulo se escribe solo vía su API.
  - Todos los módulos deben usar nuestros productos (`inventario.inv_producto`, `id_producto int`). Sus implementaciones están pendientes.
  - Puertos: RRHH y nosotros usamos el 3000 y todos los front el 5173. Para una demo integrada hay que asignar puertos fijos y ajustar el CORS.
- **RRHH** (https://github.com/Pabluntt/Lesgo-RRHH): login y JWT. Ver "Cómo funciona el token de RRHH" y sus pendientes.
- **e-Commerce** (https://github.com/benjatorress/LesGo-ECommerce), reunión del 09-11-2026:
  - **Acordado:** reservan tras confirmar el pago; nosotros implementamos reserva y liberación; las imágenes viven en nuestro maestro.
  - **Ya les sirve:** `GET /productos/catalogo` y `GET /productos/:id` (producto, tema, `url_imagen`, medidas y `cantidad_disponible`), y `POST /movimientos/reserva` y `/movimientos/liberacion` con su API key.
  - **Su adaptador** (`inventoryService.js`) llama a una URL de listado y otra de detalle, mapea campos con `INVENTORY_FIELD_MAP` y manda `INVENTORY_API_TOKEN` como `Bearer`.
  - **Diferencias que deben corregir (visto el 08-11):** esperan `id_producto` como UUID (`ecom_detalle_pedido.id_producto UUID`) y un precio desde Inventario; no reservan, solo comparan contra el stock; no tienen cancelación de pedidos; usan montos con decimales.
  - **Su tabla de pedidos:** `ecommerce_ventas.ecom_pedido` (PK `INTEGER`). Falta confirmar que exista en Neon.
- **Logística** (https://github.com/ElMatsiii/ERP-Logistica), visto el 08-11 y propuesta del 13-11 (`Propuesta_Integracion_Logistica_Inventario.pdf`):
  - **Acordado el 16-11:** peso y medidas en nuestro maestro, con la estimación por piezas. Ellos guardan los bultos (`log_bulto`) y calculan el peso volumétrico. Las 8 diferencias de su propuesta quedan cerradas (`id_despacho` texto, ubicación por bodega, despacho parcial en una llamada).
  - **Para el picking:** `GET /reservas?id_pedido=` devuelve `{ id_pedido, id_movimiento, estado, fecha_registro, lineas: [{ id_producto, sku, nombre_set, id_bodega, nombre_bodega, ubicacion_fisica, cantidad }] }`. Su propuesta pedía un arreglo de líneas; lo envolvemos para incluir el `estado`.
  - **Respuestas del 16-11 (documento "Pendientes Inventario y Logística"), todas como propusimos:**
    - Despacho: `lineas` con todos los productos de la reserva (0 si no se recolectó); un pedido, una OT, una guía (varias cajas = varios bultos de la misma guía); `num_seguimiento` opcional y no se guarda.
    - Recepción: `id_recepcion_logistica` y `fecha_recepcion` opcionales e ignorados; un reintento con el mismo `id_oc` + `nro_guia_proveedor` devuelve la recepción ya registrada, **pero 409 si llega el mismo par con líneas distintas**.
  - **`POST /movimientos/despacho`** (rama `integracion-logistica`): con `{ id_despacho, num_seguimiento?, id_pedido, id_empleado, observaciones_picking?, lineas }`. Por producto, lo recolectado sale de las bodegas en el orden de la reserva y el resto se libera. Idempotente por `id_despacho`; la misma guía en otro pedido da 409.
  - **`POST /movimientos/recepcion`** (rama `integracion-logistica`): con `{ id_oc, id_proveedor, nro_guia_proveedor, id_empleado, id_recepcion_logistica?, fecha_recepcion?, lineas: [{ id_producto, id_bodega, cantidad }] }`, cantidad neta. Un reintento con los mismos datos devuelve la recepción ya registrada; la misma guía con otras líneas u otro proveedor da 409. Una OC puede llegar en varias guías.
  - **Les toca a ellos:** pasar `id_pedido` a `int`, agregar `id_proveedor` y `nro_guia_proveedor` a `log_recepcion`, y reemplazar sus tablas de prueba (`test_log_*`) por llamadas a nuestra API con su clave.
- **Compras:** FKs de `id_proveedor` e `id_oc`, y cómo reciben la alerta de stock bajo (`GET /stock` ya trae `bodegas_bajo_minimo`). Sin reunión todavía.
- **Postventa:** efecto de una devolución en el stock. Sin reunión todavía.

## Arquitectura del backend

Monolito modular NestJS en capas (controller → service → repositorio). Las integraciones son adaptadores aislados.

```
Backend/
├─ .env.example
├─ db/ddl/*.sql, db/dml/*.sql   ← fuente de verdad del esquema (entregable)
└─ src/
   ├─ main.ts / setup-app.ts  ← prefijo /api/v1, CORS (Vite :5173), ValidationPipe, Swagger /api/docs
   ├─ config/                 ← validación de variables de entorno
   ├─ common/                 ← filtro global de errores, paginación
   ├─ auth/                   ← JwtAuthGuard + RolesGuard + @Public/@Roles/@CurrentUser (mock → RRHH)
   ├─ health/
   ├─ database/               ← TypeORM (synchronize: false)
   ├─ catalogo/ bodegas/ stock/ movimientos/ alertas/ integraciones/ reportes/
```

Al 16-11-2026 existen `config/`, `common/`, `health/`, `database/`, `auth/` (solo el `ApiKeyGuard`; los guards de JWT y roles son S3.2), `catalogo/`, `stock/` (incluye bodegas) y `movimientos/` (incluye `GET /reservas`). Faltan `alertas/`, `integraciones/` y `reportes/`.

**Endpoints en `main`:**
- `GET /health`
- `GET /productos`, `/productos/temas`, `/productos/catalogo`, `/productos/:id`; `POST /productos`; `PATCH` y `DELETE /productos/:id`
- `GET` y `POST /bodegas`; `PATCH /bodegas/:id`
- `GET /stock`, `/stock/:idProducto`
- `GET /movimientos`, `/movimientos/:id`; `POST /movimientos/ingreso`, `/movimientos/ajuste`
- Con `ApiKeyGuard` (integraciones): `POST /movimientos/reserva`, `/movimientos/liberacion`, `/movimientos/despacho` y `/movimientos/recepcion`; `GET /reservas?id_pedido=`

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

## Estado de ramas (al 16-11-2026)

`main` tiene todo lo desarrollado. Cada tarea nueva va en una rama propia desde `main` actualizada y entra por PR.

| PR | Rama | Contenido |
| --- | --- | --- |
| #5, #9, #10 | varias | Base del backend, ORM, ingreso, `GET /bodegas` |
| #12, #14 | `Rama-front`, `mejoras-front` | Frontend: listado, detalle, crear producto e ingreso de stock |
| #13 | `stock-resumen` | `GET /stock` con el resumen por producto |
| #15 | `fix-david-rama` | CRUD de productos y bodegas, historial y ajuste (trabajo de `David-rama` más correcciones) |
| #16 | `catalogo-ecommerce` | `GET /productos/catalogo` y `GET /productos/:id` |
| #17 | `imagenes-productos` | Columna `url_imagen` y su DML |
| #18 | `docs-estado-sprint3` | Este archivo y el README al día con el Sprint 3 |
| #19 | `api-key-integraciones` | `ApiKeyGuard` e `id_empleado` nullable (DDL 04) |
| #20 | `reserva-liberacion` | Reserva y liberación para e-Commerce, índice único (DDL 05) y tests de `calcularAsignacionReserva` |
| #21 | `integracion-logistica` | Peso y medidas (DDL/DML 06), `id_despacho` texto (DDL 07), `GET /reservas`, despacho y recepción para Logística |
| — | `docker-backend` | `Dockerfile` y `.dockerignore` del backend |

## Plan base del backend

Los pasos 1 a 7 y el 10 están en `main`: configuración validada, `setup-app.ts`, filtro global de errores, `/health`, Postgres local con Docker, DDL y DML, TypeORM y README.

Pendientes del plan base:
- **Paso 8, autenticación:** ahora es la tarea S3.2.
- **Paso 9, paginación:** `GET /movimientos` está limitado a los 100 más recientes.
- **`/health` con `SELECT 1`:** 200 `{ status: 'ok', bd: 'ok' }`, o 503 si no hay conexión.
- **`npm audit fix`** (sin `--force`) en su propia rama: 3 vulnerabilidades altas (`body-parser` y `multer`, vía `@nestjs/platform-express`).
- **Colección Postman:** se borró de `main` en el commit `0da7e73`. Se recupera con `git checkout 8d5c97a -- Backend/postman/inventario.postman_collection.json` si se necesita.

**Cambios al esquema:** van primero a `db/ddl` o `db/dml`, se prueban en el Postgres local y después se ejecutan en Neon desde DBeaver (conexión sin `-pooler`, abriendo el archivo y ejecutando con Alt+X), con un `pg_dump -n inventario` previo.

## Sprint 2 (cerrado)

Entregado el 28-10-2026: dos formularios (crear producto e ingreso de stock) leyendo y escribiendo en Neon, datos iniciales y validaciones (409 por SKU repetido, 404 y 400). El bloque 3 quedó completo salvo los pendientes listados en "Plan base del backend".

## Sprint 3: plan

Exige: integración con los maestros canónicos, al menos 1 escenario de integración cruzada, autenticación y roles, 3 validaciones en total y demo del flujo completo. Las validaciones ya están cubiertas.

| # | Tarea | Depende de |
| --- | --- | --- |
| S3.1 | **Reserva y liberación para e-Commerce.** `POST /movimientos/reserva` con `{ id_pedido, lineas: [{ id_producto, cantidad }] }`: un movimiento `RESERVA` `PENDIENTE`, todo o nada (409 si una línea no alcanza), idempotente por `id_pedido`. `POST /movimientos/liberacion` con `{ id_pedido }`: devuelve lo reservado, crea la `LIBERACION` y deja la reserva `ANULADO`. Usa `ReservaStrategy`. El `RegistrarReservaDto` actual recibe un solo producto: cambiarlo a `lineas` | **En `main` (PR #20).** Falta entregar la API key a e-Commerce y probar con ellos |
| S3.2 | **Autenticación y roles.** Guard de JWT (lee `employeeId` y `role`, secreto en `.env`), guard de roles con los nombres en constantes, tokens de prueba solo en desarrollo y sacar `id_empleado` del body | Se puede avanzar ya; el secreto y los nombres finales los da RRHH |
| S3.3 | **Credencial de servicio** para los endpoints de integración. `ApiKeyGuard` con claves por módulo en `INTEGRACION_API_KEYS`, aplicado a S3.1, S3.4, S3.5 y `GET /reservas` | **Hecho.** Claves de e-Commerce y Logística generadas; falta entregarlas por un canal privado |
| S3.4 | **Despacho.** `POST /movimientos/despacho` (nombre acordado con Logística): `EGRESO` de lo recolectado y `LIBERACION` del resto en una llamada, su fila en `inv_despachos_operario`, y la reserva `COMPLETADO` | **Implementado (16-11, `integracion-logistica`)** |
| S3.5 | **Recepción de OC.** `POST /movimientos/recepcion`: `INGRESO` con su fila en `inv_recepciones_compra`; idempotente por `id_oc` + `nro_guia_proveedor` (409 si cambian los datos) | **Implementado (16-11, `integracion-logistica`).** Falta validar que `id_proveedor` sea el de la OC cuando exista la tabla de Compras |
| S3.6 | **FKs a otros módulos** con `ALTER TABLE`. La de `id_empleado` → `rrhh.empleado` ya se puede crear: todos los movimientos usan el empleado 1, que existe. Avisar antes a RRHH, porque `ON DELETE RESTRICT` les impide borrar a ese empleado | Tablas de cada grupo |
| S3.7 | **Front:** mostrar la imagen del producto, inicio de sesión con RRHH y pantallas de ajuste e historial | S3.2 para el login |
| S3.8 | **Devoluciones** con Postventa | Reunión con Postventa |

**Integración cruzada para la demo:** checkout de e-Commerce con nuestra reserva (S3.1). S3.1, S3.3, S3.4 y S3.5 están hechos; falta probar los flujos con e-Commerce y Logística. Siguen S3.2 (autenticación con RRHH), S3.6 (FKs) y S3.7 (front).

## Material de referencia

- Enunciado: `Proyecto_SI2.pdf`.
- Esquema global: `Proy-SI-2-Schema.drawio`.
- ER del módulo: `Modelo_ER_inventario.drawio`.
- Informe Sprint 1: `Entrega_Sprint_1_Grupo_2.pdf`.
- Repo de referencia: https://github.com/heuremi/backend-Inventario
- Repos de otros módulos: ver "Coordinación con otros equipos".
- Documento compartido del plan: https://claude.ai/code/artifact/562b73af-7358-4e2f-a67d-c738c6cec7d6
