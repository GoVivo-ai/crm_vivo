/**
 * db:seed-demo — contenido MOCK coherente para ver la plataforma viva.
 * Historia: agencia colombiana con clientes ficticios verosímiles.
 * TODO lo insertado se registra en scripts/.demo-seed.json (manifest);
 * db:unseed-demo borra EXACTAMENTE eso y nada más (nunca truncate: hay
 * datos reales de Victor conviviendo).
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { writeFileSync } from "fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { asc } from "drizzle-orm";
// tsx no re-exporta `export * from "@/..."` del agregador: se importa
// cada schema por ruta relativa y se combinan.
import * as identity from "../src/modules/identity/schema";
import * as crm from "../src/modules/crm/schema";
import * as clients from "../src/modules/clients/schema";
import * as finance from "../src/modules/finance/schema";
import * as marketing from "../src/modules/marketing/schema";
import * as purchases from "../src/modules/purchases/schema";
import * as people from "../src/modules/people/schema";
import * as treasury from "../src/modules/treasury/schema";
import * as profitability from "../src/modules/profitability/schema";

const schema = {
  ...identity,
  ...crm,
  ...clients,
  ...finance,
  ...marketing,
  ...purchases,
  ...people,
  ...treasury,
  ...profitability,
};

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const manifest: Record<string, string[]> = {};

function track(table: string, rows: { id: string }[]): string[] {
  manifest[table] = [...(manifest[table] ?? []), ...rows.map((r) => r.id)];
  return rows.map((r) => r.id);
}

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const d = (offsetDays: number) => {
  const x = new Date(today);
  x.setUTCDate(x.getUTCDate() + offsetDays);
  return iso(x);
};
const m = (offsetMonths: number) => {
  const x = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offsetMonths, 1));
  return iso(x).slice(0, 7);
};
const ts = (offsetDays: number) => {
  const x = new Date(today);
  x.setUTCDate(x.getUTCDate() + offsetDays);
  return x;
};

async function main() {
  // ---------- CRM ----------
  const ACCOUNTS = [
    { name: "Andina Café SAS", status: "active", nit: "901234561-1", industry: "Alimentos" },
    { name: "Logística del Norte", status: "active", nit: "901234562-2", industry: "Transporte" },
    { name: "Clínica Vida Plena", status: "active", nit: "901234563-3", industry: "Salud" },
    { name: "Constructora Cimientos", status: "active", nit: "901234564-4", industry: "Construcción" },
    { name: "TecnoHogar Online", status: "active", nit: "901234565-5", industry: "E-commerce" },
    { name: "Finca La Esperanza", status: "prospect", nit: null, industry: "Agro" },
    { name: "Moda Urbana Co", status: "prospect", nit: null, industry: "Retail" },
    { name: "Transportes Rápido Ya", status: "paused", nit: "901234568-8", industry: "Transporte" },
    { name: "Hotel Mirador del Valle", status: "churned", nit: "901234569-9", industry: "Turismo" },
    { name: "Ferretería El Tornillo", status: "prospect", nit: null, industry: "Retail" },
  ] as const;
  const accountRows = await db
    .insert(schema.accounts)
    .values(ACCOUNTS.map((a) => ({ ...a, notes: "[DEMO]" })))
    .returning({ id: schema.accounts.id, name: schema.accounts.name });
  track("accounts", accountRows);
  const acc = (name: string) => accountRows.find((a) => a.name === name)!.id;

  const CONTACTS = [
    ["Carolina Méndez", "Andina Café SAS", "gerente comercial"],
    ["Julián Restrepo", "Andina Café SAS", "director de marca"],
    ["Marta Quintero", "Logística del Norte", "gerente general"],
    ["Andrés Peña", "Clínica Vida Plena", "director administrativo"],
    ["Lucía Cardona", "Constructora Cimientos", "jefe de mercadeo"],
    ["Felipe Torres", "TecnoHogar Online", "CEO"],
    ["Rosa Jiménez", "Finca La Esperanza", "propietaria"],
    ["Camilo Vargas", "Moda Urbana Co", "fundador"],
    ["Diana Salazar", "Transportes Rápido Ya", "gerente"],
    ["Óscar Molina", "Hotel Mirador del Valle", "administrador"],
    ["Paula Ríos", "Ferretería El Tornillo", "gerente"],
    ["Iván Castaño", "TecnoHogar Online", "líder de growth"],
  ] as const;
  const contactRows = await db
    .insert(schema.contacts)
    .values(
      CONTACTS.map(([name, account, jobTitle]) => ({
        name,
        jobTitle,
        accountId: acc(account),
        email: `${name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}@demo.example.com`,
      })),
    )
    .returning({ id: schema.contacts.id });
  track("contacts", contactRows);

  const stages = await db
    .select()
    .from(schema.pipelineStages)
    .orderBy(asc(schema.pipelineStages.position));
  const stage = (name: string) => stages.find((s) => s.name === name)!.id;

  const DEALS: Array<[string, string, string, number, number | null, boolean?]> = [
    // [título, cuenta, etapa, monto, díasEnEtapa (null=reciente)]
    ["Campaña lanzamiento café premium", "Andina Café SAS", "Negociación", 18_000_000, 4],
    ["Rediseño e-commerce", "TecnoHogar Online", "Propuesta", 32_000_000, 15],
    ["Pauta digital B2B", "Logística del Norte", "Propuesta", 12_000_000, 2],
    ["Estrategia de contenido salud", "Clínica Vida Plena", "Contactado", 8_500_000, 18],
    ["Branding proyecto inmobiliario", "Constructora Cimientos", "Negociación", 25_000_000, 6],
    ["Plan digital cosecha 2027", "Finca La Esperanza", "Lead", 6_000_000, 1],
    ["Lanzamiento colección", "Moda Urbana Co", "Lead", 9_000_000, 12],
    ["SEO + pauta ferretera", "Ferretería El Tornillo", "Contactado", 5_500_000, 3],
    ["Reactivación de marca", "Transportes Rápido Ya", "Propuesta", 10_000_000, 22],
    ["Campaña ocupación hotelera", "Hotel Mirador del Valle", "Perdido", 14_000_000, null],
    ["Fee mensual growth", "TecnoHogar Online", "Ganado", 7_500_000, null],
    ["Fee mensual pauta", "Andina Café SAS", "Ganado", 4_800_000, null],
  ];
  const dealRows = await db
    .insert(schema.deals)
    .values(
      DEALS.map(([title, account, stageName, amount, daysInStage], i) => ({
        title,
        accountId: acc(account),
        stageId: stage(stageName),
        amount: String(amount),
        currency: "COP",
        position: i,
        expectedCloseDate: stageName === "Ganado" || stageName === "Perdido" ? null : d(15 + i * 3),
        stageEnteredAt: ts(-(daysInStage ?? 30)),
        closedAt: stageName === "Ganado" || stageName === "Perdido" ? ts(-20 - i) : null,
      })),
    )
    .returning({ id: schema.deals.id });
  track("deals", dealRows);

  const activityRows = await db
    .insert(schema.activities)
    .values([
      { type: "call", subject: "Llamada de descubrimiento", dealId: dealRows[0].id, createdAt: ts(-3) },
      { type: "meeting", subject: "Presentación de propuesta", dealId: dealRows[1].id, createdAt: ts(-6) },
      { type: "email", subject: "Envío de cotización", dealId: dealRows[2].id, createdAt: ts(-1) },
      { type: "task", subject: "Preparar benchmark de competencia", dealId: dealRows[4].id, dueDate: ts(3) },
      { type: "note", subject: "Cliente pide referencia de casos agro", dealId: dealRows[5].id, createdAt: ts(-2) },
    ] as (typeof schema.activities.$inferInsert)[])
    .returning({ id: schema.activities.id });
  track("activities", activityRows);

  const proposalRows = await db
    .insert(schema.proposals)
    .values([
      { dealId: dealRows[1].id, title: "Propuesta rediseño e-commerce v2", status: "sent", amount: "32000000", sentAt: ts(-5), url: "https://docs.example.com/propuesta-tecnohogar" },
      { dealId: dealRows[8].id, title: "Propuesta reactivación de marca", status: "draft", amount: "10000000" },
    ] as (typeof schema.proposals.$inferInsert)[])
    .returning({ id: schema.proposals.id });
  track("proposals", proposalRows);

  // ---------- Clientes ----------
  const SERVICES = [
    ["Pauta digital (Meta/Google)", 4_500_000],
    ["Gestión de redes sociales", 3_200_000],
    ["SEO y contenido", 2_800_000],
    ["Diseño y branding", 3_500_000],
    ["Desarrollo web y CRO", 5_000_000],
  ] as const;
  const serviceRows = await db
    .insert(schema.services)
    .values(SERVICES.map(([name, fee]) => ({ name: `${name} [DEMO]`, defaultMonthlyFee: String(fee) })))
    .returning({ id: schema.services.id });
  track("services", serviceRows);

  const AS: Array<[string, number, number, string]> = [
    ["Andina Café SAS", 0, 4_800_000, "COP"],
    ["Andina Café SAS", 1, 3_200_000, "COP"],
    ["Logística del Norte", 2, 2_800_000, "COP"],
    ["Clínica Vida Plena", 1, 3_500_000, "COP"],
    ["Constructora Cimientos", 3, 3_500_000, "COP"],
    ["TecnoHogar Online", 4, 5_500_000, "COP"],
    ["TecnoHogar Online", 0, 1_500, "USD"],
  ];
  const asRows = await db
    .insert(schema.accountServices)
    .values(
      AS.map(([account, svc, fee, currency]) => ({
        accountId: acc(account),
        serviceId: serviceRows[svc].id,
        monthlyFee: String(fee),
        currency,
        startDate: d(-200),
      })),
    )
    .returning({ id: schema.accountServices.id });
  track("account_services", asRows);

  const projectRows = await db
    .insert(schema.projects)
    .values([
      { accountId: acc("Andina Café SAS"), name: "Always-on redes [DEMO]", health: "green" },
      { accountId: acc("Logística del Norte"), name: "SEO técnico [DEMO]", health: "yellow" },
      { accountId: acc("Clínica Vida Plena"), name: "Contenido médico [DEMO]", health: "green" },
      { accountId: acc("Constructora Cimientos"), name: "Branding torre norte [DEMO]", health: "red" },
      { accountId: acc("TecnoHogar Online"), name: "CRO checkout [DEMO]", health: "green" },
    ] as (typeof schema.projects.$inferInsert)[])
    .returning({ id: schema.projects.id });
  track("projects", projectRows);

  // ---------- Equipo ----------
  const EMP: Array<Record<string, unknown>> = [
    { fullName: "Valentina Ortiz [DEMO]", position: "Directora de cuentas", area: "Cuentas", birthDate: "1990-03-14", contractType: "indefinido", baseSalary: "6500000", monthly: 6_500_000 },
    { fullName: "Santiago Herrera [DEMO]", position: "Diseñador senior", area: "Creativo", birthDate: "1993-07-22", contractType: "indefinido", baseSalary: "4800000", monthly: 4_800_000 },
    { fullName: "Laura Gómez [DEMO]", position: "Performance manager", area: "Pauta", birthDate: "1996-11-02", contractType: "termino_fijo", contractEndDate: d(20), baseSalary: "4200000", monthly: 4_200_000 },
    { fullName: "Daniel Mora [DEMO]", position: "Desarrollador web", area: "Tecnología", birthDate: "1998-01-30", contractType: "prestacion_servicios", baseSalary: "5000000", monthly: 5_000_000 },
    { fullName: "Sara Pineda [DEMO]", position: "Community manager", area: "Contenido", birthDate: "2000-05-18", contractType: "termino_fijo", contractEndDate: d(160), baseSalary: "2800000", monthly: 2_800_000 },
    { fullName: "Jorge Ramírez [DEMO]", position: "Analista SEO", area: "Contenido", birthDate: "1995-09-09", contractType: "obra_labor", baseSalary: "3100000", monthly: 3_100_000 },
  ];
  const employeeRows = await db
    .insert(schema.employees)
    .values(
      EMP.map((e, i) => ({
        fullName: e.fullName as string,
        identification: `10203040${i}`,
        email: `equipo${i}@demo.example.com`,
        phone: `+57 30${i} 555 12${10 + i}`,
        hiredAt: d(-400 - i * 90),
        position: e.position as string,
        area: e.area as string,
        active: true,
        contractType: e.contractType as "indefinido",
        contractEndDate: (e.contractEndDate as string) ?? null,
        workSchedule: "L-V 8:00-17:00",
        eps: ["Sura", "Sanitas", "Compensar"][i % 3],
        afp: ["Protección", "Porvenir"][i % 2],
        arl: "Sura ARL",
        cajaCompensacion: "Compensar",
        birthDate: e.birthDate as string,
        address: `Calle ${10 + i} # ${20 + i}-30, Bogotá`,
        emergencyContactName: "Contacto de emergencia demo",
        emergencyContactPhone: "+57 300 555 0000",
        bloodType: ["O+", "A+", "B-"][i % 3],
        shirtSize: ["S", "M", "L"][i % 3],
        pantsSize: ["30", "32", "34"][i % 3],
        shoeSize: ["37", "40", "42"][i % 3],
        baseSalary: e.baseSalary as string,
        annualLeaveDays: 15,
        notes: "Expediente de demostración",
      })),
    )
    .returning({ id: schema.employees.id });
  track("employees", employeeRows);

  const payrollValues: (typeof schema.payrollPayments.$inferInsert)[] = [];
  for (let mo = -7; mo <= 0; mo++) {
    EMP.forEach((e, i) => {
      payrollValues.push({
        employeeId: employeeRows[i].id,
        period: m(mo),
        amount: String(e.monthly as number),
        currencyCode: "COP",
        paidAt: `${m(mo)}-28` <= d(0) ? `${m(mo)}-28` : d(-1),
        notes: "[DEMO]",
      });
    });
  }
  const payrollRows = await db
    .insert(schema.payrollPayments)
    .values(payrollValues)
    .returning({ id: schema.payrollPayments.id });
  track("payroll_payments", payrollRows);

  // Ausencias: requieren users reales (solo referencia, no se modifican).
  const users = await db.select().from(schema.users).limit(2);
  if (users.length > 0) {
    const requester = users[0].id;
    const decider = users[1]?.id ?? users[0].id;
    const leaveRows = await db
      .insert(schema.leaveRequests)
      .values([
        { employeeId: employeeRows[1].id, type: "vacation", startDate: d(20), endDate: d(26), status: "requested", requestedBy: requester, reason: "Vacaciones familiares [DEMO]" },
        { employeeId: employeeRows[2].id, type: "personal", startDate: d(-10), endDate: d(-9), status: "approved", requestedBy: requester, decidedBy: decider, decidedAt: ts(-12), reason: "Diligencia personal [DEMO]" },
        { employeeId: employeeRows[4].id, type: "unpaid", startDate: d(5), endDate: d(9), status: "rejected", requestedBy: requester, decidedBy: decider, decidedAt: ts(-2), decisionNote: "Semana de lanzamiento, reprogramar [DEMO]", reason: "Viaje [DEMO]" },
      ] as (typeof schema.leaveRequests.$inferInsert)[])
      .returning({ id: schema.leaveRequests.id });
    track("leave_requests", leaveRows);
  }

  // ---------- Tesorería ----------
  const bankRows = await db
    .insert(schema.bankAccounts)
    .values([
      { name: "Bancolombia corriente [DEMO]", type: "bank", currencyCode: "COP", balance: "48500000", balanceUpdatedAt: ts(0) },
      { name: "Cuenta USD Chase [DEMO]", type: "bank", currencyCode: "USD", balance: "6200", exchangeRate: "4100", balanceUpdatedAt: ts(0) },
      { name: "Tarjeta crédito empresarial [DEMO]", type: "credit-card", currencyCode: "COP", balance: "-7800000", balanceUpdatedAt: ts(0) },
    ] as (typeof schema.bankAccounts.$inferInsert)[])
    .returning({ id: schema.bankAccounts.id });
  track("bank_accounts", bankRows);

  const txValues: (typeof schema.bankTransactions.$inferInsert)[] = [];
  for (let day = -58; day <= 0; day += 2) {
    const inflow = day % 6 === 0;
    txValues.push({
      bankAccountId: bankRows[0].id,
      date: d(day),
      amount: String(inflow ? 4_000_000 + (Math.abs(day) % 5) * 900_000 : 1_200_000 + (Math.abs(day) % 4) * 450_000),
      direction: inflow ? "in" : "out",
      description: inflow ? "Pago de cliente [DEMO]" : ["Nómina", "Proveedores", "Pauta Meta", "Arriendo"][Math.abs(day) % 4] + " [DEMO]",
    });
  }
  const txRows = await db
    .insert(schema.bankTransactions)
    .values(txValues)
    .returning({ id: schema.bankTransactions.id });
  track("bank_transactions", txRows);

  // ---------- Finanzas ----------
  const invoiceValues: (typeof schema.invoices.$inferInsert)[] = [];
  const billing: Array<[string, number]> = [
    ["Andina Café SAS", 8_000_000],
    ["Logística del Norte", 2_800_000],
    ["Clínica Vida Plena", 3_500_000],
    ["Constructora Cimientos", 3_500_000],
    ["TecnoHogar Online", 5_500_000],
  ];
  let inv = 100;
  for (let mo = -11; mo <= 0; mo++) {
    for (const [account, amount] of billing) {
      if ((mo + 12) % 2 === 0 && account === "Logística del Norte") continue; // variación
      const issue = `${m(mo)}-05`;
      if (issue > d(0)) continue;
      const overdue = mo === -2 || mo === -3;
      const open = mo >= -1 || overdue;
      invoiceValues.push({
        number: `DEMO-${inv++}`,
        accountId: acc(account),
        issueDate: issue,
        dueDate: `${m(mo)}-25`,
        status: open ? "open" : "paid",
        total: String(amount),
        totalPaid: open ? "0" : String(amount),
        balance: open ? String(amount) : "0",
        currencyCode: "COP",
        notes: "[DEMO]",
      });
    }
  }
  // 2 USD con TRM + 2 sin cuenta
  invoiceValues.push(
    { number: `DEMO-${inv++}`, accountId: acc("TecnoHogar Online"), issueDate: `${m(-1)}-10`, dueDate: `${m(-1)}-30`, status: "paid", total: "1500", totalPaid: "1500", balance: "0", currencyCode: "USD", exchangeRate: "4080", notes: "[DEMO]" },
    { number: `DEMO-${inv++}`, accountId: acc("TecnoHogar Online"), issueDate: `${m(0)}-10`, dueDate: d(20), status: "open", total: "1500", totalPaid: "0", balance: "1500", currencyCode: "USD", exchangeRate: "4100", notes: "[DEMO]" },
    { number: `DEMO-${inv++}`, clientName: "Taller puntual sin cuenta [DEMO]", issueDate: `${m(0)}-08`, status: "paid", total: "2400000", totalPaid: "2400000", balance: "0", currencyCode: "COP", notes: "[DEMO]" },
    { number: `DEMO-${inv++}`, clientName: "Consultoría express [DEMO]", issueDate: `${m(-1)}-18`, status: "paid", total: "1800000", totalPaid: "1800000", balance: "0", currencyCode: "COP", notes: "[DEMO]" },
  );
  const invoiceRows = await db
    .insert(schema.invoices)
    .values(invoiceValues)
    .returning({ id: schema.invoices.id });
  track("invoices", invoiceRows);

  const expenseValues: (typeof schema.expenses.$inferInsert)[] = [];
  const vendors: Array<[string, number, string, "bill" | "direct"]> = [
    ["Meta Platforms", 3_800_000, "Pauta clientes", "direct"],
    ["Google Ads", 2_200_000, "Pauta clientes", "direct"],
    ["Arriendo oficina Chapinero", 4_200_000, "Gastos Administrativos", "bill"],
    ["Hosting y herramientas", 950_000, "Tecnología", "direct"],
    ["Contabilidad externa", 1_400_000, "Gastos Administrativos", "bill"],
  ];
  for (let mo = -11; mo <= 0; mo++) {
    for (const [providerName, total, costCenter, kind] of vendors) {
      const txn = `${m(mo)}-12`;
      if (txn > d(0)) continue;
      const open = kind === "bill" && mo === 0;
      expenseValues.push({
        kind,
        providerName: `${providerName} [DEMO]`,
        costCenter,
        txnDate: txn,
        dueDate: kind === "bill" ? `${m(mo)}-28` : null,
        status: open ? "open" : "paid",
        total: String(total),
        balance: open ? String(total) : "0",
        currencyCode: "COP",
        paymentAccountName: kind === "direct" ? "Tarjeta crédito empresarial" : null,
        notes: "[DEMO]",
      });
    }
  }
  const expenseRows = await db
    .insert(schema.expenses)
    .values(expenseValues)
    .returning({ id: schema.expenses.id });
  track("expenses", expenseRows);

  // ---------- Rentabilidad ----------
  const staffingRows = await db
    .insert(schema.accountStaffing)
    .values([
      { accountId: acc("Andina Café SAS"), employeeId: employeeRows[0].id, dedicationPercent: 40 },
      { accountId: acc("Andina Café SAS"), employeeId: employeeRows[4].id, dedicationPercent: 50 },
      { accountId: acc("TecnoHogar Online"), employeeId: employeeRows[3].id, dedicationPercent: 60 },
      { accountId: acc("TecnoHogar Online"), employeeId: employeeRows[2].id, dedicationPercent: 40 },
      // Margen NEGATIVO: mucha dedicación para poca facturación
      { accountId: acc("Logística del Norte"), employeeId: employeeRows[5].id, dedicationPercent: 90 },
      { accountId: acc("Logística del Norte"), employeeId: employeeRows[1].id, dedicationPercent: 45 },
      { accountId: acc("Clínica Vida Plena"), employeeId: employeeRows[1].id, dedicationPercent: 30 },
    ] as (typeof schema.accountStaffing.$inferInsert)[])
    .returning({ id: schema.accountStaffing.id });
  track("account_staffing", staffingRows);

  // ---------- Marketing ----------
  const adAccountRows = await db
    .insert(schema.adAccounts)
    .values([
      { accountId: acc("Andina Café SAS"), platform: "meta", externalAccountId: "act_demo_meta_1", name: "Andina Café — Meta [DEMO]", accountCurrency: "COP" },
      { accountId: acc("TecnoHogar Online"), platform: "meta", externalAccountId: "act_demo_meta_2", name: "TecnoHogar — Meta [DEMO]", accountCurrency: "COP" },
      { accountId: acc("Clínica Vida Plena"), platform: "google_ads", externalAccountId: "demo_gads_1", name: "Vida Plena — Google Ads [DEMO]", accountCurrency: "COP" },
    ] as (typeof schema.adAccounts.$inferInsert)[])
    .returning({ id: schema.adAccounts.id, platform: schema.adAccounts.platform });
  track("ad_accounts", adAccountRows);

  const metricValues: (typeof schema.syncedCampaignMetrics.$inferInsert)[] = [];
  const campaigns: Array<[number, string, string, number, number, boolean]> = [
    // [adAccountIdx, campaignId, nombre, spendDiario, leadsDiarios, conPurchases]
    [0, "demo_meta_c1", "Leads café B2B [DEMO]", 130_000, 6, false],
    [1, "demo_meta_c2", "Ventas e-commerce [DEMO]", 210_000, 3, true],
    [2, "demo_gads_c1", "Búsqueda salud [DEMO]", 95_000, 4, false],
  ];
  for (let day = -29; day <= 0; day++) {
    for (const [idx, campaignId, name, spend, leads, withPurchases] of campaigns) {
      const wiggle = 1 + ((Math.abs(day) * 7) % 10) / 20;
      const daySpend = Math.round(spend * wiggle);
      const dayLeads = Math.max(1, Math.round(leads * wiggle));
      const clicks = dayLeads * 14;
      const impressions = clicks * 30;
      const purchases = withPurchases ? Math.max(1, Math.round(dayLeads / 2)) : 0;
      const purchaseValue = withPurchases ? purchases * 380_000 : 0;
      metricValues.push({
        adAccountId: adAccountRows[idx].id,
        platform: adAccountRows[idx].platform,
        campaignExternalId: campaignId,
        campaignName: name,
        metricDate: d(day),
        spend: String(daySpend),
        clicks,
        impressions,
        cpc: String(Math.round(daySpend / clicks)),
        cpm: String(Math.round((daySpend / impressions) * 1000)),
        ctr: String((clicks / impressions).toFixed(6)),
        leads: dayLeads,
        costPerLead: String(Math.round(daySpend / dayLeads)),
        purchases,
        purchaseValue: String(purchaseValue),
        roas: withPurchases ? String((purchaseValue / daySpend).toFixed(4)) : null,
      });
    }
  }
  const metricRows = await db
    .insert(schema.syncedCampaignMetrics)
    .values(metricValues)
    .returning({ id: schema.syncedCampaignMetrics.id });
  track("synced_campaign_metrics", metricRows);

  writeFileSync("scripts/.demo-seed.json", JSON.stringify(manifest, null, 2));
  const total = Object.values(manifest).reduce((a, v) => a + v.length, 0);
  console.log(`Seed demo listo: ${total} registros en ${Object.keys(manifest).length} tablas.`);
  console.log("Manifest: scripts/.demo-seed.json (usa db:unseed-demo para revertir)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
