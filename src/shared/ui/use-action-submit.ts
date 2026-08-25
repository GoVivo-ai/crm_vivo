"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/shared/actions/result";

/**
 * Envío estándar de formularios contra Server Actions del proyecto:
 * consume ActionResult (nunca throws), reparte fieldErrors por campo,
 * notifica con toast y refresca los datos del server en éxito.
 */
export function useActionSubmit<T>() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function submit(
    run: () => Promise<ActionResult<T>>,
    opts: { successMessage: string; onSuccess?: (data: T) => void },
  ) {
    startTransition(async () => {
      const result = await run();
      if (result.ok) {
        setFieldErrors({});
        toast.success(opts.successMessage);
        router.refresh();
        opts.onSuccess?.(result.data);
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        // §12.5: el error persiste hasta que el usuario lo cierre.
        toast.error(result.error, { duration: Infinity });
      }
    });
  }

  return { submit, pending, fieldErrors };
}
