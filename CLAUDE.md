# CLAUDE.md: Módulo de Inventario "Lesgo" (Grupo 2)

Contexto y reglas de trabajo para retomar el proyecto en cualquier sesión. Responder siempre en **español neutro**.

## Forma de trabajo (obligatoria)

- **Solo modificar archivos en local.** No hacer `git commit` ni `git push`: el equipo revisa, commitea y pushea. Hacerlo solo si se pide de forma explícita en ese momento.
- **Cambios pequeños o medianos.** Cada entrega de trabajo debe equivaler a un commit revisable (un tema por vez). Si una tarea es grande, dividirla en pasos y detenerse después de cada uno para revisión.
- **Al terminar cada cambio**, dar un resumen breve: qué archivos se tocaron, qué se hizo y para qué. Proponer también un mensaje de commit.
- **Antes de entregar**, correr en `Backend/proyecto-inventario/`: `npm run lint`, `npm test`, `npm run test:e2e` y `npm run build`. Informar el resultado real, aunque falle.
- **Instalar cada dependencia en el paso que la necesita**, para que el diff de `package.json` sea fácil de revisar.
- **Rama de trabajo actual:** `config-base`.
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

- **Backend:** `Backend/proyecto-inventario/`, con NestJS 12 (ESM, `"type": "module"`, imports con extensión `.js`), TypeScript 6, vitest + supertest y oxlint + prettier.
- **Frontend:** React + Vite (puerto 5173). Todavía no existe en el repo.
- **BD:** PostgreSQL en Neon (servicio en la nube), base `si2`.
- **Comunicación entre módulos:** HTTP/REST.

## Base de datos central (lo que se sabe)

- **Organización:** hay un schema por módulo: `Compras`, `Inventario`, `Logistica`, `Maestros`, `RRHH`, `Ventas`, además de `SI1`, `SIA` y `public`.
- **Mayúsculas en los nombres:** los schemas llevan mayúscula inicial, así que en SQL manual van entre comillas (`"Inventario"`). En TypeORM basta con `schema: 'Inventario'`.
- **El schema `Inventario` tiene tablas del semestre pasado,** que no corresponden a nuestro modelo:
  - `"Producto"`: con id `uuid`, `precio` y un único `stock_actual`.
  - `inv_movimiento`: con id `uuid` y un enum `tipo`.
  - El resto de los schemas también tiene datos antiguos y faltan los módulos nuevos de este semestre.
- **Pendiente:**
  - Confirmar con el profesor si se pueden reemplazar esas tablas (respaldarlas antes).
  - Revisar el schema `Maestros`, permisos y FKs entre schemas.
  - Acordar con los demás grupos el tipo de `id_producto`.
- **Conexión:**
  - El endpoint de Neon con `-pooler` sirve para la app.
  - Para DDL, usar la conexión directa (el mismo host sin `-pooler`).
  - Neon exige SSL (`sslmode=require`).

## Modelo de datos acordado (aún sin DDL)

```
inv_temas(id_tema serial PK, nombre_tema)
inv_producto(id_producto serial PK, id_tema FK, sku UNIQUE, nombre_set, coleccion, cant_piezas, edad_minima, tipo_construccion, activo)
inv_bodegas(id_bodega serial PK, nombre_bodega, ubicacion_fisica)
inv_stock_bodega(id_producto PK/FK, id_bodega PK/FK, cantidad_disponible, cantidad_reservada)
inv_movimiento(id_movimiento serial PK, id_empleado FK→rrhh_empleado, id_pedido FK→PEDIDO null, id_devolucion FK→DEVOLUCION null, fecha_registro, tipo_operacion, estado)
inv_detalles_movimiento(id_detalle serial PK, id_movimiento FK, id_producto FK, id_bodega FK, cantidad)
inv_despachos_operario(id_movimiento PK/FK, id_despacho FK→DESPACHO UNIQUE, observaciones_picking)
inv_recepciones_compra(id_movimiento PK/FK, id_proveedor FK→PROVEEDOR, id_oc FK→ORDEN_COMPRA, nro_guia_proveedor, UNIQUE(id_oc, nro_guia_proveedor))
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

### Decisiones abiertas (bloquean DDL y entidades)

- **`stock_minimo`:** propuesta, columna en `inv_producto`.
- **`motivo` del `AJUSTE`** (`CONTEO`, `MERMA`, `PERDIDA`, `CORRECCION`): propuesta, nullable con un `CHECK` que lo exija en `AJUSTE`.
- **`coleccion`:** duplica a `id_tema`. Propuesta: eliminarla.
- **`edad_minima` y `tipo_construccion`:** no vienen en el dataset de Kaggle/Rebrickable. Propuesta: nullable.
- **`fecha_cierre` opcional en `inv_movimiento`:** propuesta, agregarla.
- **`DEVOLUCION`:** pendiente con Postventa si reingresa como disponible o queda en revisión.
- **KPIs:** rotación, quiebres, merma, tiempo entre reserva y despacho, y días de cobertura.
- **Matriz de roles:** Jefe de Bodega, Operador, Marketing y Admin, con nombres alineados con RRHH.
- **Diagrama draw.io:** quitar las tildes de `tipo_operacion`, corregir la errata "inv_movimientos" y cambiar "Hereda de" por "FK a".

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
Backend/proyecto-inventario/
├─ .env.example
├─ db/ddl/*.sql, db/dml/*.sql   ← fuente de verdad del esquema (entregable)
└─ src/
   ├─ main.ts / setup-app.ts  ← prefijo /api/v1, CORS (Vite :5173), ValidationPipe, Swagger /api/docs
   ├─ config/                 ← validación de variables de entorno
   ├─ common/                 ← filtro global de errores, paginación
   ├─ auth/                   ← JwtAuthGuard + RolesGuard + @Public/@Roles/@CurrentUser (mock → RRHH)
   ├─ health/
   ├─ database/               ← TypeORM (synchronize: false)   [cuando se cierre el modelo]
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

## Plan inmediato: base del backend sin BD (rama `config-base`)

Cada paso equivale a un commit, con revisión entre pasos:

1. Configuración validada (`@nestjs/config` + class-validator) y `.env.example`.
2. `setup-app.ts`: prefijo `/api/v1`, CORS, `ValidationPipe` y Swagger. Se elimina el controlador de ejemplo del scaffold.
3. Filtro global de errores con un formato único.
4. `GET /api/v1/health` (sin BD) y los e2e correspondientes.
5. Auth simulado: JWT, guards, decoradores, roles provisionales y token de prueba solo en desarrollo.
6. DTO de paginación.
7. README en español.

**Después, cuando se cierren las decisiones abiertas:** TypeORM y conexión a Neon o Postgres local, DDL/DML, entidades, los módulos de productos y movimientos (los 2 formularios de la demo del Sprint 2) y el frontend.

## Material de referencia

- Enunciado: `Proyecto_SI2.pdf`.
- Esquema global: `Proy-SI-2-Schema.drawio`.
- ER del módulo: `Modelo_ER_inventario.drawio`.
- Informe Sprint 1: `Entrega_Sprint_1_Grupo_2.pdf`.
- Repo de referencia: https://github.com/heuremi/backend-Inventario
- Documento compartido del plan: https://claude.ai/code/artifact/562b73af-7358-4e2f-a67d-c738c6cec7d6
