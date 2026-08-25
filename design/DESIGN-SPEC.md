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
- Tinta navy `#E7EBF3` (texto `#011640`): tile del área Equipo en dialogs y chip
  activo neutro (p. ej. filtro "Todas").
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
- Registro de sincronizaciones (resuelto): historial vía `listSyncRuns` — las 20
  corridas más recientes con Fuente/Estado/Inicio/Duración/Filas/Detalle.
- Vacaciones (resuelto): unidad y label vienen JUNTOS del contrato
  (`LEAVE_DAY_UNIT` = "días hábiles (Colombia)") en saldo y solicitudes. La banda
  verde en vivo estima en el cliente contando L–V y lo declara: "{N} días L–V · los
  festivos se descuentan al enviar" (solo el server conoce festivos/ley Emiliani);
  el conteo definitivo aparece en la solicitud creada. La banda nunca promete la
  cifra final.
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

## 12. Overlays — sistema "Lomo navy" + capa Spotlight (elegido por Victor 2026-08-25)

Los overlays son parte del sistema, no shadcn crudo. El sistema de dialogs es el
**Lomo navy** (12.1/12.4) con el **Spotlight** como capa power-user de captura
(12.6). Artboards de referencia: `design/artboards/LomoFactura.dc.html`,
`LomoConfirmar.dc.html`, `SpotlightFactura.dc.html`, `SpotlightConfirmar.dc.html`
(menús/selects/toasts siguen en `Overlays.dc.html`).

**Base común**
- Scrim: `rgba(1,22,64,.40)` (navy al 40%), sin blur.
- Panel: blanco, borde `--border`; radio **16 en dialogs**, **12 en menús/popovers/
  selects/toasts**. Sombra de dialog `0 24px 64px -24px rgba(1,22,64,.35),
  0 4px 12px -6px rgba(1,22,64,.12)`; sombra de menú/popover/toast
  `0 12px 32px -12px rgba(1,22,64,.25)`.
- Motion: entrada 160ms ease-out (dialog: fade + scale .98→1; menú/select: fade +
  translateY 4px desde el trigger; toast: fade + translateY 8px). Salida 120ms.
  Con `prefers-reduced-motion`: solo fade.
- A11y: **focus trap** en dialogs; foco visible SIEMPRE
  `outline: 2px solid #04D98B; outline-offset: 2px` (sobre navy del toast: outline
  blanco). Esc cierra todo; clic en scrim cierra menús/selects, y en dialogs con
  cambios sin guardar pregunta antes ("¿Descartar cambios?" — patrón destructivo).

**12.1 Dialog "Lomo navy" (captura y edición)**
La ventana es asimétrica: una franja estructural navy (el LOMO) + costura gradiente
+ cuerpo blanco. Es la firma del sistema — ningún dialog vuelve a ser un rectángulo
blanco centrado.
- Contenedor: 680px (formularios a 2 columnas) o 560px (1 columna); radio 16,
  overflow hidden, sombra `0 32px 80px -28px rgba(1,22,64,.55)`, scrim navy 40%
  (el scrim base de 12.0 es ÚNICO para todos los overlays — sin variantes).
- **Lomo** (150px en 680 / 130px en 560): fondo navy `#011640` con aura verde
  `radial-gradient(220px 200px at -40px -30px, rgba(4,217,139,.20), transparent
  70%)` e **isotipo** `logomark-white.png` como marca de agua (esquina inferior
  derecha, desbordado, opacidad .10, rotación −12°). Contenido de arriba a abajo:
  tile 36px radio 11 `rgba(4,217,139,.18)` con el icono del formulario en
  `#04D98B`; eyebrow del módulo (800 10px, tracking .16em, blanco 55%); título
  corto Nunito 800 15px blanco ("Nueva factura").
- **Contexto vivo** (parte baja del lomo): eyebrow "Contexto vivo" + el dato
  protagonista REFLEJADO mientras se escribe — monto Nunito 800 20px `#04D98B`
  tabular + entidad (blanco 72%) + un hecho útil del módulo si existe (MRR actual,
  saldo de la cuenta, últimos días de saldo; blanco 45%). Vacío: "—" en blanco 35%.
  Se actualiza con transición de 150ms; nunca parpadea por tecla (debounce ~150ms).
- **Costura**: 3px verticales `linear-gradient(180deg,#04D98B,#F2E205)` entre lomo
  y cuerpo — la única firma visible con el overlay abierto.
- **Cuerpo**: fila superior con chip de fuente ("Manual") y X ghost 32px; campos
  del §5 (inputs r10, foco verde con halo), gap 15–16px; footer con separador
  `--line` — "Guardar y crear otra" a la izquierda, ghost "Cancelar" + primario
  verde verbo+objeto ("Guardar factura") a la derecha. Foco inicial: primer campo.
- Motion: entrada 200ms ease-out (fade + scale .97→1); salida 120ms; reduced-motion
  solo fade. Dirty guard (§12.4 con lomo rojo, "¿Descartar cambios?").
- Responsive: <1100px el lomo colapsa a CABECERA horizontal (banda navy arriba con
  tile + módulo + contexto vivo en línea, isotipo pequeño a la derecha, costura
  horizontal debajo); en móvil, sheet de borde inferior con la misma cabecera.

**12.2 Dropdown / menú contextual**
- Panel radio 12, padding 6px, min-width 200px.
- Ítem = **píldora, eco del sidebar**: radio 999, padding 8px 12px, Nunito Sans 600
  13px `--ink`, icono 15px `--muted`. Hover/focus: fondo `#EEF1F6` (NUNCA verde — el
  verde es acción, no hover), icono a `--ink`. Ítem destructivo: texto `--red`,
  hover `--red-tint`.
- Separadores 1px `--line` (margen 6px 8px); labels de grupo como eyebrow (§3).
- Menú de usuario (UserButton): cabecera con avatar gradiente + nombre 800 +
  correo `--muted` + chip de rol verde (idéntica a la tarjeta del sidebar), luego
  ítems; "Cerrar sesión" como destructivo.

**12.3 Select y opciones**
- Trigger = input del §5 (r10, chevron `--faint`); abierto = estado de foco (borde
  verde + halo).
- Panel como menú (12.2). Opción hover `#EEF1F6`; **opción seleccionada: fondo
  `--green-tint`, texto navy 800 y check verde a la derecha** (no píldora blanca —
  esa es exclusiva del sidebar). Listas largas: búsqueda arriba dentro del panel
  (input con icono search, autofocus).
- **Cuándo segmented, cuándo select**: segmented (§6) para 2–4 opciones cortas,
  mutuamente excluyentes y que merecen verse siempre (COP/USD, Pagada/Pendiente,
  tipo de ausencia); select para ≥5 opciones, listas dinámicas (clientes, personas,
  cuentas) o cualquier cosa con búsqueda. Un segmented jamás desborda: si no cabe,
  es un select.

**12.4 Confirmación destructiva "lomo rojo" (reemplaza window.confirm)**
Misma anatomía del 12.1 — identidad constante, severidad evidente:
- Contenedor 520px radio 16. **Lomo 110px**: navy con **aura ROJA**
  `radial-gradient(160px 150px at -30px -20px, rgba(201,58,58,.28), transparent
  70%)`, isotipo al .08; tile 36px `rgba(201,58,58,.30)` con icono alerta
  `#F08A8A`; abajo, eyebrow "Irreversible" (blanco 55%) y el **objeto en peligro
  nombrado** en `#F08A8A` 800 13px ("FV-2041"). **Costura roja sólida `#C93A3A`**
  (el gradiente firma jamás aparece en destructivo).
- Cuerpo: título Nunito 800 16px navy con el objeto concreto ("¿Eliminar la factura
  FV-2041?"); consecuencia real en 13px `--muted` y qué no se puede deshacer.
- Acciones: ghost "Cancelar" (**foco inicial aquí**) + botón sólido rojo píldora
  (`#C93A3A`, hover `#B53232`) con verbo+objeto — nunca "Aceptar", nunca verde.
  Enter no dispara el destructivo si el foco no está en él. Borrados irreversibles
  en lote exigen además escribir el nombre. El dirty guard usa este patrón
  ("¿Descartar cambios?" / "Seguir editando" con foco inicial / "Descartar" rojo)
  con una variante de lomo: eyebrow **"Sin guardar"** y sin objeto nombrado (el
  registro aún no existe) — "Irreversible" se reserva para borrar cosas reales.

**12.5 Toast**
- Abajo a la derecha, máx 380px, radio 12, **fondo navy `#011640` texto blanco**
  (pieza de marca, se distingue de toda card). Icono en tile 26px: éxito check
  `#04D98B` sobre `rgba(4,217,139,.16)`; error alerta `#F08A8A` sobre
  `rgba(201,58,58,.25)`. Acción opcional en verde `#04D98B` 800 ("Deshacer",
  "Reintentar").
- Voz de marca: verbo + dato concreto, sin jerga técnica — "Factura FV-2041
  guardada · $14.600.000" / "No se pudo sincronizar QuickBooks — revisa la
  conexión". Éxito: 4s, `aria-live=polite`. Error: persistente con X,
  `aria-live=assertive`. Máximo 3 apilados.

**12.6 Spotlight — capa power-user de captura rápida**
Captura teclado-primero sobre el lienzo completo. Es una CAPA sobre el sistema
Lomo, no su reemplazo: crea registros, nunca edita.
- **Invocación**: `Cmd/Ctrl+K` desde cualquier módulo (inerte si hay otro overlay
  abierto). El botón "+ Registrar ⌘K" del topbar abre el MISMO Spotlight — una sola
  entrada, no dos sistemas: la vía de mouse son los chips de tipo CLICABLES (al
  clicar uno, el panel muestra ese formulario vacío listo para llenar con mouse o
  teclado). El botón se oculta a roles sin escritura.
- **Anatomía**: scrim `rgba(1,22,64,.74)` + aura verde
  `radial-gradient(720px 420px at 50% 18%, rgba(4,217,139,.14), transparent 70%)`.
  Barra de comando 720px en el tercio superior: vidrio blanco 10%, borde blanco
  20%, radio 16, texto Nunito 800 17px blanco, caret verde de 2px, chips kbd de
  tipo a la derecha, clicables y filtrados por permisos del rol (`F factura ·
  G gasto · N nómina · M movimiento`; "s" parsea como alias de movimiento). Debajo, el panel
  resultado: card blanca radio 20 con hairline gradiente, **monto protagonista a
  44px** con la entidad interpretada como eyebrow, campos restantes en grid, pie
  con hints ("Enter guarda · Tab siguiente campo · Esc cierra") y acciones.
- **Gramática de parseo**: `{tipo} {entidad} {monto} [fecha]` — tipo por palabra
  ("factura", "gasto"…) o tecla inicial; entidad por fuzzy match sin acentos contra
  clientes/personas/cuentas según el tipo; monto acepta atajos ("14.6" →
  $14.600.000, "890k", "2.4m") y el token de moneda `usd` ("usd 500" → US$ 500
  literal, sin atajos de millones; sin token, COP). Con `usd`, el panel muestra el
  monto protagonista en USD y un campo **TRM (COP por USD)** obligatorio (el
  backend normaliza con exchangeRate); el movimiento no la pide — hereda la moneda
  de su cuenta. Fecha natural opcional ("ayer", "15 sep", "15/08").
  **Lo interpretado se muestra SIEMPRE en el panel antes de guardar** con la línea
  "Entendido del texto: … · corrige abajo si algo no es" — la barra jamás guarda a
  ciegas; ambigüedad (≥2 coincidencias) = aviso "N coincidencias — elige abajo" y
  el combobox del campo ABIERTO (defaultOpen), sin preselección.
- **Cuándo NO aplica**: formularios largos (>~6 campos), con adjuntos (gasto con
  comprobante) o cualquier edición — en esos casos Spotlight abre el dialog Lomo
  con lo ya parseado precargado. Confirmaciones originadas EN Spotlight usan el
  patrón sobre-lienzo (pregunta blanca centrada en el scrim, Cancelar con foco y
  botón rojo; ver `SpotlightConfirmar.dc.html`); las demás siguen en 12.4.

**12.7 Ruta de migración desde el sistema anterior**
Lo construido sobrevive: menús (12.2), selects/combobox/segmented (12.3), toasts
(12.5), dirty guard, `useActionSubmit` y los footers verbo+objeto NO cambian. Lo
que cambia es la envolvente del dialog:
1. `CaptureDialog` → Lomo navy: el tile del header se muda al lomo, el chip de
   fuente y la X quedan en el cuerpo; añadir el contexto vivo (reflejo del campo
   protagonista). Primero los 5 formularios de dinero, luego CRM/clientes/equipo.
2. `ConfirmDialog` → lomo rojo (12.4) en todos los destructivos y en el descarte.
3. Spotlight como feature aparte, DESPUÉS de estabilizar el Lomo (atajo global,
   parser y precarga del Lomo largo).

## 13. Datos y convenciones

- Manual-primero + sync QuickBooks/Meta/ClickUp cada 6h. Moneda COP y USD (TRM visible
  donde se consolida). Todos los datos de los mockups son de EJEMPLO.
- Estados canónicos de factura: Pagada / Pendiente / Vencida. Salud de cuenta:
  Sana / Atención / En riesgo. Veredictos de área: Bien / Atención / Problema.
- Accesibilidad: verde de texto siempre `#069B66` (no `#04D98B`) sobre blanco;
  amarillo jamás como texto ni con texto encima; estados nunca solo-color
  (siempre icono o palabra).

## 14. Expediente de empleado (aprobado por Victor 2026-08-25)

Artboard: `design/artboards/Expediente.dc.html` (fragmento fuente en
`screens/Expediente.frag.html`).

**Página propia** `/people/[id]`, no un dialog: el expediente es la "Cuenta 360 de
una persona" y hereda ese vocabulario — cabecera + tabs + grid 3fr/2fr.

**Cabecera de persona**: avatar 56px (tinta + iniciales), nombre 20px Nunito 800 +
badges (estado Activa/Vacaciones/Retirada; alerta de contrato en warn cuando vence
<45 días), meta línea (cargo · área · correo · teléfono · "En VIVO desde…").
Stats a la derecha según rol: Antigüedad (calculada), Vacaciones disponibles,
Completitud del expediente ("4 de 6", en gold si incompleto; con
people_compensation se suma Salario base). Acción "Editar".

**Tabs**: Resumen · Contractual · Personal y dotación · Compensación (solo
people_compensation) · Documentos · Ausencias. El artboard muestra el RESUMEN, que
reúne lo esencial de las cuatro áreas; cada tab profundiza con el mismo patrón de
tarjetas. La edición es POR SECCIÓN (cada card tiene "Editar sección →" que abre un
Lomo del área Equipo con solo esos campos) — nunca un formulario plano de 30 campos.

**Columna principal (3fr)**:
1. *Contractual*: pares clave/valor a 2 columnas (tipo de contrato: Término fijo /
   Indefinido / Prestación de servicios / Obra-labor; jornada; inicio/fin — el fin
   en `--gold` con "en N días" cuando aplica la alerta existente; cargo; área) +
   fila de 4 chips de afiliación (EPS · AFP/Pensión · ARL con nivel de riesgo ·
   Caja de compensación) como bloques `#F6F7F9` r10 con eyebrow.
2. *Personal y dotación*: nacimiento SIEMPRE como "fecha · edad calculada"
   ("14 mar 1994 · 32 años" — la edad jamás se guarda, se deriva); documento
   ENMASCARADO ("CC ····4821", completo solo tras write); dirección; contacto de
   emergencia (nombre + parentesco + teléfono); RH como badge rojo. **Tallas como
   tokens grandes** (Camisa/Pantalón/Calzado en tiles `#F6F7F9` r12, cifra Nunito
   800 22px) — es dato operativo de dotación, se le da presencia, con nota de
   último kit entregado.
3. *Compensación*: candado visible (badge b-info "Solo finanzas y gestión");
   salario base 26px tabular + moneda; auxilios/bonos recurrentes en línea;
   mini-tabla de últimos pagos (periodo/fecha/neto/chip de fuente) que enlaza al
   historial existente.

**Columna lateral (2fr)**:
4. *Completitud del expediente* (card con borde warn si incompleta): barra de
   progreso con el gradiente firma + checklist — ítems completos con check verde y
   fecha, faltantes con círculo punteado `#C6CFDD`, label en `--gold` y acción
   "Subir →". Lista canónica: hoja de vida, cédula, certificados de afiliación,
   acuerdo de confidencialidad, contrato firmado, examen médico de ingreso
   (extensible por tipo de contrato). El conteo "N de M" alimenta la cabecera y
   las alertas del Home/Equipo.
5. *Ausencias*: saldo del año con la barra segmentada de Vacaciones + próxima
   ausencia.
6. *Notas internas* (badge "Solo gestión"): texto libre de seguimiento.

**Matriz de visibilidad (respeta la minimización de PII vigente)**:
- `people_directory` read (todos los activos): cabecera sin stats sensibles —
  nombre, cargo, área, correo, estado, cumpleaños como día/mes (sin año ni edad).
  Los tabs restringidos ni se pintan.
- `people_directory` write (management/admin): + Contractual completo,
  afiliaciones, Personal y dotación (documento completo solo aquí), Documentos,
  checklist y notas internas.
- `people_compensation` (finance/management/admin): + tab y card Compensación y el
  stat de salario. El guard es de servidor; la UI además no monta la sección.
- El propio empleado ve su expediente completo EXCEPTO notas internas (y
  compensación solo lectura).

**Estados vacíos**: campo sin dato = "—" (nunca inventar); sección vacía = mensaje
honesto + CTA "Completar sección →" (solo write); expediente recién creado abre
con la checklist en 0 de M como guía de onboarding.

**Captura**: los Lomos de sección usan el tile del área Equipo (tinta navy
`#E7EBF3`); los selects cortos (tipo de contrato, jornada, RH) son segmented o
select según la regla §12.3; tallas como inputs cortos de 3 columnas.
