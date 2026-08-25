/**
 * Error de regla de negocio: su mensaje es seguro para mostrar al usuario.
 * Los runners de actions lo convierten en ActionResult { ok: false, error }.
 * Cualquier otro Error se loguea y se responde con un mensaje genérico.
 */
export class DomainRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainRuleError";
  }
}
