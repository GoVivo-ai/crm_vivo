import { esES } from "@clerk/localizations";

/**
 * Copy canónico del auth con voz VIVO (§11, spec a63e522): overrides
 * sobre esES. Regla: directa, cálida, de "tú"; «para continuar a X»
 * prohibido. Lo que esES traduce bien y no choca, se queda.
 *
 * Limitación conocida: `formButtonPrimary` es GLOBAL en Clerk (no hay
 * clave por pantalla ni localization por componente) — «Entrar» manda
 * porque el sign-in es la superficie diaria; el sign-up (solo por
 * invitación) hereda ese texto.
 */
export const vivoLocalization = {
  ...esES,
  formButtonPrimary: "Entrar",
  formFieldLabel__emailAddress: "Correo",
  formFieldLabel__password: "Contraseña",
  formFieldAction__forgotPassword: "¿La olvidaste?",
  dividerText: "o",
  signIn: {
    ...esES.signIn,
    start: {
      ...esES.signIn?.start,
      title: "Hola de nuevo",
      subtitle: "Entra y mira cómo va el negocio hoy.",
      // Sin registro público: el pie invita a pedir acceso, no a signup.
      actionText: "El acceso es por invitación —",
      actionLink: "pídesela a tu admin.",
    },
    forgotPasswordAlternativeMethods: {
      ...esES.signIn?.forgotPasswordAlternativeMethods,
      label__alternativeMethods: "O entra con",
    },
  },
  signUp: {
    ...esES.signUp,
    start: {
      ...esES.signUp?.start,
      title: "Crea tu cuenta",
      titleCombined: "Crea tu cuenta",
      subtitle: "Un minuto y quedas dentro.",
      subtitleCombined: "Un minuto y quedas dentro.",
      actionText: "¿Ya tienes cuenta?",
      actionLink: "Entra.",
    },
    emailCode: {
      ...esES.signUp?.emailCode,
      title: "Revisa tu correo",
      subtitle: "Te enviamos un código para verificar tu cuenta.",
      formTitle: "Código de verificación",
      formSubtitle: "Escribe el código que te llegó al correo.",
      resendButton: "¿No llegó? Reenviar código",
    },
  },
  unstable__errors: {
    ...esES.unstable__errors,
    form_password_incorrect:
      "Ese correo y esa contraseña no coinciden. Inténtalo de nuevo.",
    form_identifier_not_found:
      "Ese correo y esa contraseña no coinciden. Inténtalo de nuevo.",
  },
};
