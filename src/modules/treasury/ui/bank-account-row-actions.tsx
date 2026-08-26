"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { BankAccountView } from "@/modules/treasury/domain/types";
import { BankAccountForm } from "@/modules/treasury/ui/bank-account-form";
import { RowMenu } from "@/shared/ui/entity/row-menu";

/** Menú ⋯ de la fila de cuenta bancaria (§15.2). */
export function BankAccountRowActions({
  account,
}: {
  account: BankAccountView;
}) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <RowMenu label={account.name}>
        <DropdownMenuItem onClick={() => setEditOpen(true)}>
          Editar
        </DropdownMenuItem>
      </RowMenu>
      {editOpen && (
        <BankAccountForm
          account={account}
          open={editOpen}
          onOpenChange={setEditOpen}
          hideTrigger
        />
      )}
    </>
  );
}
