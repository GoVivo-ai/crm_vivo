# ERP VIVO — Especificación de diseño (fuente de verdad)

Aprobada por Victor el 2026-08-25. Frontend implementa ESTO fielmente; ante cualquier duda
de interpretación, decide el Diseñador. Los mockups fuente están en `design/artboards/`
(un `.dc.html` por pantalla; `screens/*.frag.html` es el contenido de cada pantalla y
`Main.dc.html` contiene además el shell completo — sidebar + topbar + CSS de tokens.
`build.mjs` regenera las pantallas a partir del shell de Main + los fragmentos).

Los assets de marca ya viven en `public/brand/` (logo-vivo-blue/white.png, logomark-blue/white.png).

---

## 1. Identidad y dirección

- Manual de marca VIVO al pie de la letra: navy `#011640`, verde energía `#04D98B`,
  amarillo `#F2E205`, blanco. Tipografías **Nunito** (display) y **Nunito Sans** (texto).
- **El sidebar navy es el único bloque oscuro de la interfaz** (logo blanco sobre navy).
  El contenido es claro, denso, de ERP real: tablas y cifras protagonistas.
- **Redondez de píldora**: botones, chips, badges e ítems de navegación usan radio 999
  — eco de la geometría redonda del logo.
- **Gradiente firma** `linear-gradient(90deg,#04D98B,#F2E205)`: aparece **una sola vez
  por pantalla** (barra superior de 3–4px en la tarjeta héroe, o el subrayado del tab
  activo). Nunca como fondo grande. En el sidebar vive solo en el anillo "o" (§4).
- Nada de emoji en la UI. Iconos siempre SVG de trazo (§8).
- Prohibido el look genérico "SaaS de IA" (Inter + azul + grilla de cards iguales).

## 2. Tokens de color

```css
:root{
  --navy:#011640;      /* marca: sidebar, títulos, primario */
  --ink:#0A1E3F;       /* texto principal */
  --muted:#5A6B85;     /* texto secundario / metadatos */
  --faint:#8B99B0;     /* labels, placeholders, ejes de gráficas */
  --border:#E3E8F0;    /* bordes de cards, tablas, inputs */
  --line:#EDF0F5;      /* líneas internas (filas de tabla, separadores) */
  --bg:#F6F7F9;        /* lienzo de la app */
  --card:#FFFFFF;
  --green:#04D98B;     /* CTA, activo, pulso */
  --green-ink:#069B66; /* verde para TEXTO/cifras positivas (AA sobre blanco) */
  --green-tint:#E6F9F1;
  --yellow:#F2E205;    /* realce puntual; NUNCA lleva texto ni se usa como texto */
  --gold:#8C7A0A;      /* texto de advertencia */
  --yellow-tint:#FBF7D9;
  --blue:#1E5FBF;      /* informativo, serie 2 de gráficas */
  --blue-tint:#E8F0FB;
  --teal:#0790A8;      /* módulo marketing */
  --red:#C93A3A;       /* vencido, pérdida, riesgo */
  --red-tint:#FAEAEA;
}
```

- Neutro de relleno (columnas kanban, pistas de barras, chips mudos): `#EEF1F6`.
- Borde punteado (dropzones, slots vacíos): `#C6CFDD`, 1.5px dashed.
- Puntos de área en el Home (§10): finanzas `#8C7A0A` · comercial `#069B66` ·
  clientes `#1E5FBF` · equipo `#011640` · marketing `#0790A8`.
- **Gráficas — paleta categórica validada (orden FIJO, nunca ciclar):**
  `#069B66` → `#1E5FBF` → `#8C7A0A` → `#0790A8`. Una sola serie = verde `#069B66`.
  Ingresos siempre `#069B66`, gastos siempre `#1E5FBF`.

## 3. Tipografía

| Rol | Fuente | Ejemplo |
|---|---|---|
| Cifra grande / hero | Nunito 800, 26–54px, letter-spacing −.01/−.015em | `$112,8 M` |
| Título de página (topbar) | Nunito 800 18px | `Tesorería` |
| Título de card | Nunito 800 15px | `Rentabilidad por cliente` |
| Cuerpo / tablas | Nunito Sans 600 13px (dato protagonista en 800) | |
| Label / eyebrow | Nunito Sans 700 10.5px, uppercase, tracking .1em, color `--faint` | `CARTERA POR COBRAR` |
| Badges/chips | Nunito Sans 800 11px | |

- **Todos los números en `font-variant-numeric: tabular-nums`** y alineados a la
  derecha en tablas (`text-align:right`).
- Moneda formato es-CO: `$14.600.000`, abreviado `$86,4 M`, dólares `US$ 4.660`.
- Carga: Google Fonts `Nunito:wght@700;800;900` + `Nunito+Sans:opsz,wght@6..12,400..800`.

## 4. Sidebar (la cara del producto)

Ancho **236px**, colapsado **68px**. Padding 22px 14px 16px.

**Fondo con aura**: navy + dos radiales sutiles, borde derecho blanco al 6%:
```css
background:
  radial-gradient(420px 300px at -60px -60px, rgba(4,217,139,.18), transparent 70%),
  radial-gradient(420px 340px at 120% 108%, rgba(30,95,191,.22), transparent 72%),
  #011640;
border-right: 1px solid rgba(255,255,255,.06);
```

**Logo**: `logo-vivo-white.png` alto 28px + tag "ERP" (píldora borde `rgba(4,217,139,.5)`,
texto `--green` 9.5px 800, tracking .14em).

**Grupos**: guion gradiente 12×2px (radio 2) + label Nunito Sans 800 9.5px, uppercase,
tracking .16em, `rgba(255,255,255,.48)`. Grupos: Panorama / Comercial / Dinero / Personas
(+ Ajustes suelto abajo). El menú se filtra por rol (RBAC): sales no ve Dinero,
operations no ve Compensación, Ajustes solo admin.

**Ítem** (píldora completa, radio 999, padding 9px 14px, gap 10px):
- Inactivo: texto `rgba(255,255,255,.72)` 600 13.5px, icono opacidad .8.
- **Hover**: fondo blanco al 8%, texto al 100%, icono opacidad 1, 120ms. Sin rieles ni subrayados.
- **Activo — "la píldora encendida"**: se INVIERTE: fondo `#fff`, texto navy 800,
  icono verde `#069B66`, glow `box-shadow: 0 10px 24px -10px rgba(4,217,139,.65)`.
- **El anillo "o"**: indicador de posición al final del ítem activo — anillo gradiente
  de 12px (fondo `linear-gradient(135deg,#04D98B,#F2E205)` con hueco blanco de 5px).
  Es el "o" del logo convertido en marcador, y el único gradiente del sidebar.
- **Transición de módulo**: la píldora blanca se desliza al nuevo ítem
  (`transform` 220ms ease-out); el anillo entra con `scale` 0→1.

**Zona viva (abajo, `margin-top:auto`)**:
1. Pulso de sincronización: card `rgba(255,255,255,.04)`, borde blanco 10%, radio 12.
   Punto verde 8px con onda animada (`box-shadow` 0→7px rgba(4,217,139,.45→0), 2.4s
   infinite). Texto: "Todo sincronizado" 800 11.5px blanco + "QBO · Meta · ClickUp · 6:00 a. m."
   10.5px blanco 50%. Si una sync falla, el punto pasa a `--gold` o `--red` con el error.
2. Usuario: card `rgba(255,255,255,.06)`, borde 8%, radio 14. Avatar 32px con
   **gradiente de marca** (`linear-gradient(135deg,#04D98B,#F2E205)`, iniciales navy
   Nunito 800) + nombre 800 12.5px + correo 10.5px blanco 50% + chip de rol
   (fondo `rgba(4,217,139,.16)`, texto `--green` 9.5px 800, uppercase).

**Colapsado (68px)**: isotipo `logomark-white.png` arriba; ítems como círculos de 40px
(activo = círculo blanco con icono verde y glow; el anillo "o" de 8px va DEBAJO del
círculo activo); abajo pulso y avatar 30px. Ver lámina en `Sistema.dc.html`.

## 5. Topbar y layout

- Topbar 64px, fondo blanco, borde inferior `--border`, padding 0 28px:
  título (Nunito 800 18px navy) + crumb contextual (`--faint` 12px) + a la derecha:
  buscador píldora 250×36 (fondo `--bg`), campana 36px con punto verde,
  **botón "+ Registrar"** (píldora verde `--green`, texto navy 800 13px) — presente
  en TODAS las pantallas, abre la captura rápida (§11).
- Contenido: padding 24px 28px 32px, columnas con `gap` 16–20px. Ancho de referencia 1440.
- Cards: fondo blanco, borde `--border`, **radio 14**, sombra `0 1px 2px rgba(1,22,64,.04)`.
  Header de card: padding 18px 20px 0, título Nunito 800 15px navy.
- Filas de tabla 44px; th uppercase 10.5px `--faint` con borde `--border`; td con
  borde `--line`; última fila sin borde.
- Inputs/controles: radio 10, alto 38–44, borde `--border`;
  **foco** = borde `--green` 1.5px + halo `0 0 0 3px rgba(4,217,139,.15)`.
- Segmented control: pista `#EEF1F6` radio 999; opción activa blanca con sombra
  `0 1px 2px rgba(1,22,64,.12)`, texto navy 800.

## 6. Componentes

- **Botones** (píldora, alto 36, 800 13px): primario verde/texto navy · secundario
  blanco/borde `--border` · navy sólido (máximo 1 por vista) · destructivo = ghost con
  texto `--red` (borde neutro).
- **Badges de estado** (píldora 800 11px, tinta + texto):
  ok `--green-tint`/`--green-ink` (Pagada, Activo, Sana, OK, Bien) ·
  warn `--yellow-tint`/`--gold` (Pendiente, Atención, Renovación) ·
  bad `--red-tint`/`--red` (Vencida, En riesgo, Rechazada) ·
  info `--blue-tint`/`--blue` (Ausente, Planeado, USD) ·
  mut `#EEF1F6`/`--muted` (chips de fuente: QuickBooks, Manual, Meta, ClickUp…).
- **Chip de fuente obligatorio** en todo dato sincronizado. `source='manual'` es
  editable/borrable; lo sincronizado es de solo lectura.
- **Tabs**: texto 700 13px `--muted`; activo navy 800 con subrayado gradiente de 3px
  (`background:linear-gradient(90deg,#04D98B,#F2E205) bottom/100% 3px no-repeat`).
- **Avatares**: iniciales; el usuario propio con gradiente de marca; los demás con
  tinta de estado + inicial (`--blue-tint`/`--blue`, `--green-tint`/`--green-ink`,
  `--yellow-tint`/`--gold`). Pilas con solape −9px y borde blanco 2px.
- **Deltas**: chip up `--green-tint`/`--green-ink`, down `--red-tint`/`--red`, con
  flecha SVG 45°.
- **Kanban**: columnas fondo `#EEF1F6` radio 14; tarjetas blancas radio 12 con borde
  `--border`; el **ring verde + glow queda RESERVADO al estado de arrastre**
  (DragOverlay) — es afordancia de interacción, no un destacado permanente; un negocio
  con evento/cierre próximo se señala con su línea meta de calendario (icono + fecha),
  como en el artboard; slot "+ Nuevo" punteado `#C6CFDD`; chip de días estancado en
  `--gold` cuando ≥ 10 días.
- **Alertas/accionables**: fila con tinta (`--red-tint` o `--yellow-tint`) radio 10,
  icono 14–15px del color del texto, **título con VERBO** ("Gestionar cobro a…",
  "Aprobar 2 ausencias") + meta en `--muted` + link de acción a la derecha.

## 7. Gráficas

- Paleta categórica del §2 en orden fijo; texto de ejes/labels SIEMPRE en tintas de
  texto (`--faint`/`--ink`), nunca del color de la serie (salvo direct labels 800).
- Barras: rx 3–4, gap 2px+ entre pares; grid horizontal `#EDF0F5` (base `#E3E8F0`);
  ejes 10.5px `--faint`; leyenda de chips cuando hay ≥2 series; direct label solo en
  el último punto/grupo.
- Líneas: 2px, área con degradé vertical del color al 16%→0; proyección = dasharray
  `5 5` con punto hueco al final; marcador "Hoy" con label 800.
- Un solo eje siempre. Nada de dual-axis ni rainbow.

## 8. Iconografía

SVG inline, trazo `currentColor` 1.8px (2–2.4 en iconos pequeños/CTA), rejilla 24
renderizada a 14–16px, `stroke-linecap/linejoin: round`. Set base en `Main.dc.html`:
home, kanban, briefcase (clientes), banknote (finanzas), landmark (tesorería),
trending-up (rentabilidad), users (equipo), megaphone (marketing), sliders (ajustes),
search, bell, plus, calendar, check, alert-circle, refresh, chevron, arrows, eye.

## 9. Motion

- Píldora del sidebar: desliza 220ms ease-out; anillo "o" scale 0→1.
- Hover de ítems/botones: 120ms.
- Pulso de sync: onda 2.4s ease-out infinite.
- Una intención por pantalla; nada de micro-animaciones dispersas.

## 10. Home 360 — "informe de estado de la empresa" (estructura aprobada)

El home NO es una grilla de KPIs: es la portada de un briefing que se lee en 10 s.
Orden de lectura fijo:

1. **Titular con veredicto global** (sin card): "Martes 25 de agosto — la empresa
   está *sana*." (fecha + veredicto coloreado) y debajo la frase de contexto del día
   (qué entró, qué venció, qué espera aprobación). A la derecha, badge de sync.
   El veredicto y la frase se calculan de los datos (caja/margen/alertas).
2. **Franja FINANZAS · TESORERÍA** (ancho completo — domina; lleva el único gradiente
   firma de la página): grid `1.5fr 1fr 1.2fr` con divisores `--line`:
   caja disponible (42px + sparkline de saldo mensual, §nota-datos + cobertura en
   meses + proyección 30d) ·
   resultado del mes (26px verde + margen y delta) · cartera (26px + badge de vencida
   + accionable rojo "Gestionar cobro a X →").
3. **Franja COMERCIAL (3fr) + CLIENTES·OPERACIÓN (2fr)**:
   - Comercial: total pipeline + nº negocios + MRR con delta; **funnel horizontal
     segmentado** en degradé de verdes (`#BFE9DA → #7ED4B4 → #2FB183 → #069B66`) con
     anchos ∝ valor por etapa y labels debajo; pie con próximo cierre y ganados del mes.
   - Clientes: **semáforo de cuentas** como chips píldora coloreadas por salud
     (verde/ámbar/rojo con punto), línea resumen ("6 sanas · 1 atención · 1 riesgo",
     proyectos con retraso) + accionable ("Rescatar X →").
4. **Franja EQUIPO (3fr) + MARKETING (2fr)**:
   - Equipo: pila de avatares + hechos del día (vacaciones, cumpleaños) + nómina del
     mes a la derecha; debajo, hasta 2 accionables en ámbar (aprobar ausencias,
     contrato por vencer).
   - Marketing: pauta administrada (26px) + mini-barras de tendencia en teales +
     leads/CPL con delta y mejor cuenta.

Cada franja abre igual: punto 8px del color del área + label uppercase + **veredicto**
(badge Bien/Atención/Problema) + link "Abrir módulo →" a la derecha. El cuerpo de cada
franja es de naturaleza DISTINTA (cifras / funnel / semáforo / personas / spend).
Regla editorial: **ningún dato sin verbo** — todo problema trae su acción.

**Nota-datos (ajustes acordados 2026-08-25 sobre huecos del contrato de datos):**
- Sparkline de caja: no hay serie diaria — se pinta el **saldo al cierre de mes,
  últimos 12 m**, reconstruido hacia atrás desde el saldo actual restando el flujo
  neto de cada mes (línea, no barras: la historia es la trayectoria del saldo). Si la
  reconstrucción no es confiable (multi-moneda), fallback: flujo neto mensual como
  BARRAS (nunca línea) con label explícito.
- Semáforo de clientes (resuelto): chips con NOMBRE por cuenta vía
  `getClientsHealthList`, rojas primero, enlazadas a la vista 360, tooltip con la
  regla del bucket (+ margen solo si el rol puede verlo; tooltip neutral si no),
  línea resumen "N sanas · N atención · N riesgo" y accionable "Rescatar {peor
  cuenta} →" (la roja de menor margen).
- Marketing: sin serie temporal de spend — mini-barras = **top-5 campañas por
  inversión** en la rampa teal, ordenadas ascendente izq→der (la más oscura = mayor
  spend), con label explícito.
- Cumpleaños/aniversarios: no existen en datos hoy; la franja Equipo muestra hechos
  reales (ausencias por aprobar, contratos por vencer). Se reinstauran cuando el
  módulo People (expediente) los aporte.
- Registro de sincronizaciones: interino, solo la corrida MÁS RECIENTE por fuente
  (subtítulo honesto); el objetivo es el historial de 24 h del artboard —
  `listSyncRuns({limit})` pedido a backend.
- Vacaciones: la banda verde calcula y etiqueta **"días calendario"** mientras el
  contrato cuente días corridos; el objetivo es **días hábiles** (L–V y festivos de
  Colombia, pedido a backend) — jamás etiquetar "hábiles" contando corridos, y el
  saldo anual debe usar la misma unidad que la banda.
- Todo dato faltante se etiqueta honesto en la UI; nunca se simula.

## 11. Notas por pantalla

- **Sign-in**: split 640/800. Panel navy con hairline gradiente arriba, isotipo
  gigante al 7% rotado −12° como marca de agua, claim Nunito 800 40px
  ("Toda la agencia, en una sola pantalla."), 3 bullets con check verde. Panel claro
  con card 400px (radio 18, sombra profunda): isotipo azul, "Hola de nuevo",
  correo/contraseña (foco verde), CTA verde píldora, divisor "O", Google SSO,
  "Acceso solo por invitación".
- **CRM · Pipeline**: tabs Pipeline/Contactos/Cuentas; fila de filtros (chips);
  4 columnas kanban con header (nombre 800 + count píldora blanca + suma derecha);
  barra inferior resumen del mes (ganados/perdidos/conversión).
- **Cuenta 360**: cabecera de cuenta (logo iniciales 52px navy radio 14, nombre 20px +
  badge salud, NIT/ciudad/antigüedad/vínculo QBO, stats MRR·cartera·margen + acciones);
  tabs Resumen/Servicios/Proyectos/Facturación/Documentos; col 2fr (servicios activos,
  proyectos ClickUp con barras de progreso, facturación) + col 1fr (equipo asignado
  con % dedicación, pauta del mes, actividad con puntos de color).
- **Finanzas**: tabs; KPIs asimétricos `1.5fr 1fr 1fr 1fr` (héroe 36px con gradiente);
  facturas (tabla con fuente+estado, vencidas con fecha en rojo) + gastos por centro
  de costo (barras azules) + P&L trimestral calculado.
- **Tesorería**: KPIs asimétricos; línea de saldo 45d + proyección punteada con
  labels "Hoy" y proyección; cuentas bancarias (tabla + fila de consolidado con TRM);
  movimientos con iconos entrada/salida verdes/rojos.
- **Rentabilidad**: KPIs asimétricos; barras de margen por cliente (verde ≥25%,
  ocre 10–25%, rojo <10%/pérdida — regla escrita al pie); ranking con fila en
  `--red-tint` para cuentas en pérdida + banner accionable al pie de la tabla.
- **Equipo**: tabs Directorio/Ausencias/Compensación; chips de área (activo navy);
  tabla directorio (avatar+correo, contrato con badge de vencimiento) + col derecha:
  ausencias de la semana, "Por aprobar" (card con borde verde) y fechas del equipo.
- **Vacaciones (colaborador)**: form 3fr (segmented de tipo, fechas, cálculo en vivo
  de días hábiles en banda verde, nota opcional, cobertura con select de persona,
  CTA) + col 2fr: saldo del año (34px + barra segmentada navy/amarillo/verde con
  leyenda tomados/solicitados/libres), historial, "quién más está fuera".
  Regla de negocio visible: aprueba management distinto al solicitante.
- **Integraciones (admin)**: intro + "3 de 3 conectadas"; 3 cards OAuth (logo 42px
  tinta, estado, cuenta/última sync/próxima, "Sincronizar ahora" + "Desconectar"
  rojo), card punteada "próximamente"; tabla registro de sincronizaciones
  (fuente/inicio/duración/filas/resultado).
- **Captura rápida (+ Registrar)**: se abre como MODAL centrado sobre cualquier
  módulo (overlay navy al 40%). Selector de 4 tiles (factura/gasto/nómina/saldo) +
  formulario del tipo activo (borde verde). Todo registro manual lleva chip "Manual".
  Gasto: centro de costo + cliente asociado opcional (alimenta rentabilidad) +
  dropzone de comprobante. Factura: "Guardar y crear otra" para carga en lote.

## 12. Datos y convenciones

- Manual-primero + sync QuickBooks/Meta/ClickUp cada 6h. Moneda COP y USD (TRM visible
  donde se consolida). Todos los datos de los mockups son de EJEMPLO.
- Estados canónicos de factura: Pagada / Pendiente / Vencida. Salud de cuenta:
  Sana / Atención / En riesgo. Veredictos de área: Bien / Atención / Problema.
- Accesibilidad: verde de texto siempre `#069B66` (no `#04D98B`) sobre blanco;
  amarillo jamás como texto ni con texto encima; estados nunca solo-color
  (siempre icono o palabra).
