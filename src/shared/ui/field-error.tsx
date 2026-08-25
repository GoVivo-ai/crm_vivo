type FieldErrorProps = {
  errors?: string[];
};

/** Mensaje de error de un campo, alimentado por fieldErrors del ActionResult. */
export function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
