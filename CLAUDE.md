# CLAUDE.md: Módulo de Inventario "Lesgo" (Grupo 2)

Contexto y reglas de trabajo para retomar el proyecto en cualquier sesión. Responder siempre en **español neutro**.

## Forma de trabajo (obligatoria)

- **Solo modificar archivos en local.** No hacer `git commit` ni `git push`: el equipo revisa, commitea y pushea. Hacerlo solo si se pide de forma explícita en ese momento.
- **Cambios pequeños o medianos.** Cada entrega de trabajo debe equivaler a un commit revisable (un tema por vez). Si una tarea es grande, dividirla en pasos y detenerse después de cada uno para revisión.
- **Al terminar cada cambio**, dar un resumen breve: qué archivos se tocaron, qué se hizo y para qué. Proponer también un mensaje de commit.
- **Antes de entregar**, correr en `Backend/`: `npm run lint`, `npm test`, `npm run test:e2e` y `npm run build`. Informar el resultado real, aunque falle.
- **Instalar cada dependencia en el paso que la necesita**, para que el diff de `package.json` sea fácil de revisar.
- **Rama de trabajo actual:** `fixes-previo-a-entidades`.
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

- **Backend:** `Backend/`, con NestJS 12 (ESM, `"type": "module"`, imports con extensión `.js`), TypeScript 6, vitest + supertest y oxlint + prettier.
- **Frontend:** React + Vite (puerto 5173). Todavía no existe en el repo.
- **BD:** PostgreSQL en un proyecto nuevo de Neon (servicio en la nube), base `si2_22026`.
- **Comunicación entre módulos:** HTTP/REST.

## Base de datos central (servidor nuevo, octubre 2026)

- **Organización:** un schema por grupo, en minúsculas: `compras`, `crm`, `ecommerce_ventas`, `finanzas`, `inventario`, `logistica`, `postventa` y `rrhh`. Las tablas comunes van en `public`.
  - En SQL no hacen falta comillas. En TypeORM: `schema: 'inventario'`.
- **Estado al 20-10-2026:** todos los schemas están vacíos, `public` incluido. Se parte de cero: no hay tablas viejas que respetar.
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
- **Subtablas creadas y vacías (22-10-2026):** `inv_despachos_operario` e `inv_recepciones_compra` ya existen para que el esquema del módulo esté completo, pero sin datos de prueba: se llenan cuando Logística y Compras confirmen despachos y recepciones (Sprint 3). Esto justifica que tengan menos de 10 filas.

### Decisiones abiertas (no bloquean el DDL)

- **`DEVOLUCION`:** pendiente con Postventa si reingresa como disponible o queda en revisión.
- **KPIs:** se definen más adelante con los datos que haya.
- **Matriz de roles:** Jefe de Bodega, Operador, Marketing y Admin, con nombres alineados con RRHH.
- **Diagrama draw.io:** quitar las tildes de `tipo_operacion`, corregir la errata "inv_movimientos", cambiar "Hereda de" por "FK a", agregar `cantidad_minima` y quitar `coleccion`, `edad_minima` y `tipo_construccion`.

## Coordinación con otros equipos

- **Todos:**
  - API con prefijo `/api/v1`, formato de error común, fechas ISO-8601 y montos en CLP enteros.
  - Los maestros ajenos se leen de la BD (solo lectura) y el estado de otro módulo se escribe solo vía su API.
- **RRHH:** emisión del JWT (`id_empleado` + rol) y definición de los roles.
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

## Plan inmediato: base del backend y schema propio (rama `fixes-previo-a-entidades`)

Cada paso equivale a un commit, con revisión entre pasos. Los pasos 1 a 5 ya están hechos.

1. ✅ Configuración validada (`@nestjs/config` + class-validator) y `.env.example`.
2. ✅ `setup-app.ts`: prefijo `/api/v1`, CORS, `ValidationPipe` y Swagger. Se elimina el controlador de ejemplo del scaffold.
3. ✅ Filtro global de errores con un formato único.
4. ✅ `GET /api/v1/health` (sin BD) y los e2e correspondientes.
5. ✅ Postgres local con Docker (`docker-compose.yml`, misma versión mayor que Neon).
6. DDL y DML del schema `inventario`, probados en local (6a: DDL y triggers; 6b: DML).
7. TypeORM y conexión (local o Neon según el `.env`), con `/health` verificando la BD.
8. Auth simulado: JWT, guards, decoradores, roles provisionales y token de prueba solo en desarrollo.
9. DTO de paginación.
10. README en español.

**Después:** ejecutar el DDL/DML en la BD del profesor (con `pg_dump` previo), entidades, los módulos de productos y movimientos (los 2 formularios de la demo del Sprint 2) y el frontend. Los pasos 8 y 9 pueden adelantarse mientras el equipo cierra las decisiones abiertas.

## Material de referencia

- Enunciado: `Proyecto_SI2.pdf`.
- Esquema global: `Proy-SI-2-Schema.drawio`.
- ER del módulo: `Modelo_ER_inventario.drawio`.
- Informe Sprint 1: `Entrega_Sprint_1_Grupo_2.pdf`.
- Repo de referencia: https://github.com/heuremi/backend-Inventario
- Documento compartido del plan: https://claude.ai/code/artifact/562b73af-7358-4e2f-a67d-c738c6cec7d6
