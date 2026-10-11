"use client";

import { createContext, useContext, useState } from "react";
import { CreateCashbookDrawer } from "@/components/cashbook/create-cashbook-drawer";

const CreateCashbookContext = createContext<() => void>(() => {});

export function useOpenCreateCashbook() {
  return useContext(CreateCashbookContext);
}

export function CreateCashbookProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <CreateCashbookContext.Provider value={() => setOpen(true)}>
      {children}
      <CreateCashbookDrawer open={open} onClose={() => setOpen(false)} />
    </CreateCashbookContext.Provider>
  );
}
