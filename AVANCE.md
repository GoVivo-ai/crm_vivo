# ERP VIVO — Estado del proyecto y guía para retomar

> Actualizado: 2026-08-26 (madrugada). Producción: **https://erp.govivo.ai** · Repo: **github.com/GoVivo-ai/crm_vivo** (push a main = deploy automático).

## El equipo de agentes (sesiones de Claude Code, cada una en su consola)

| Agente | Rol | Regla clave |
|---|---|---|
| **Planeador** | Coordina, decide, asigna, pushea a GitHub, habla con Victor | Único que pushea; triage: función nueva con diseño real → disenador primero; cambio sencillo → directo |
| **backend** | Schema Drizzle, casos de uso, server actions, RBAC, OAuth infra, CI | Dueño de toda migración de schema |
| **frontend** | app/ y modules/*/ui — implementa fielmente el DESIGN-SPEC | Nada de lógica/queries en UI; RequiresWrite en toda mutación |
| **Integraciones** | src/integrations (QuickBooks, Meta, ClickUp), crons, syncs | Errores sanitizados; valida shapes reales antes de codificar |
| **QA** | Revisa cada cierre de fase; seguridad, permisos, cifras | Nada cierra con bloqueantes; verifica por API directa, no solo UI |
| **disenador** | Autoridad de diseño; DESIGN-SPEC.md + artboards en design/ | CERO artifacts; pasada de runtime en prod tras cada implementación (sesión: vimasaba44@gmail.com, rol management) |

Reglas de equipo: commits solo con rutas explícitas (nunca `git add -A`); revisar `git status` antes de commitear (staging compartido); árbol siempre compilable (borrados y consumidores en el mismo paso).

## Qué está CONSTRUIDO (todo en producción, verificado)

- **9 módulos**: Home 360 (informe por áreas con veredicto calculado) · CRM (pipeline Kanban, contactos, cuentas, propuestas) · Clientes (Cliente 360, servicios/MRR, proyectos) · Finanzas (facturas, P&L y cashflow calculados de registros propios) · Gastos y compras · Tesorería (bancos, posición de caja) · Rentabilidad por cliente (costo real por empleado, account_staffing) · Equipo/RR.HH. (directorio, expediente completo con contractual/afiliaciones/personal/tallas/checklist, vacaciones en días hábiles CO con aprobación) · Marketing (Meta Ads).
- **Diseño 100% cerrado — 6 sistemas** (DESIGN-SPEC.md es la fuente de verdad fiel a prod): visual base marca VIVO · sidebar "píldora encendida + anillo o" · Home informe · overlays Lomo navy + lomo rojo + Spotlight ⌘K (§12) · expediente de empleado (§14) · fichas de detalle + listas (§15). No queda ninguna vista pre-sistema.
- **Datos**: modelo manual-primero (source manual|quickbooks; manual editable, sync solo lectura) + QuickBooks OAuth listo (falta app de Intuit). Alegra y Windsor fueron ELIMINADOS (eran de otro proyecto — Alto Tráfico).
- **Seguridad**: RBAC 5 roles en 3 capas, deny-by-default (INITIAL_ADMIN_EMAIL=victor@govivo.ai), credenciales cifradas AES-GCM en BD, OAuth con state HMAC, PII minimizada (cédula enmascarada, salarios solo finance/management/admin), anti auto-aprobación y anti auto-lockout.
- **Infra**: Neon (neon-aquamarine-pillow) · Clerk (claves dev; renombrar app a "ERP VIVO" pendiente) · dominio erp.govivo.ai verificado · CI verde en GitHub Actions · crons diarios (plan Hobby de Vercel; cada 6h requiere Pro) · Vercel team "GoVivo's projects" (cuenta victor-2806).
- **Demo**: BD sembrada con 366 registros mock — `npm run db:seed-demo` / `npm run db:unseed-demo` (el unseed borra exacto, respeta usuarios reales y el "ZZ Empleado de Prueba").

## PENDIENTES (todos de Victor, ninguno bloquea al equipo)

1. **Apps OAuth** (activan los botones "Conectar"): Meta (developers.facebook.com, tipo Business, Login for Business) · ClickUp (Settings→Apps→Create App) · Intuit/QuickBooks (developer.intuit.com, QBO, scope accounting). Redirects: `http://localhost:3000/api/oauth/{provider}/callback` y `https://erp.govivo.ai/api/oauth/{provider}/callback` (providers: meta_ads, clickup, quickbooks). Las claves van a `.env.local` y a Vercel (META_APP_ID/SECRET, CLICKUP_CLIENT_ID/SECRET, QBO_CLIENT_ID/SECRET).
2. **Equipo**: pasar listado de correos Google Workspace + rol (management/sales/operations/finance/admin) para pre-aprobación automática — o aprobarlos uno a uno en Ajustes→Usuarios cuando se registren en erp.govivo.ai/sign-up.
3. **Clerk**: renombrar la app "crm_vivo" → "ERP VIVO" (dashboard.clerk.com) y, cuando toque, crear la instancia de producción (claves live + webhook a https://erp.govivo.ai/api/webhooks/clerk).
4. **Vercel**: decidir si consolidar el proyecto en la cuenta victorsandovaldev (hoy vive en victor-2806/"GoVivo's projects") y si subir a plan Pro (syncs cada 6h + maxDuration).
5. **Ver el sign-in en incógnito** (copy nuevo "Hola de nuevo") — único vistazo que falta.
6. **Cuando arranquen en serio**: `npm run db:unseed-demo`, borrar el "ZZ Empleado de Prueba" desde la app, y cargar datos reales (o conectar QuickBooks).

## Cómo retomar mañana

1. Abrir las 6 consolas de Claude Code en `/Volumes/M2.SSD/Developer/CRM VIVO` con sus nombres: **Planeador, backend, frontend, Integraciones, QA, disenador** (el Planeador tiene memoria persistente del proyecto y este archivo como referencia).
2. Dev local: `npm run dev` (Clerk/Neon ya configurados en .env.local). Producción se actualiza sola con cada push a main.
3. Flujo de trabajo vigente: función nueva → disenador diseña (spec+artboards al repo, SIN artifacts) → Victor aprueba → backend/frontend/Integraciones implementan → QA revisa → disenador pasada de runtime en prod → Planeador pushea.
