"use client";

import * as React from "react";
import { createContext, useContext, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface EntityCreateDrawerContextValue {
  close: () => void;
}

const EntityCreateDrawerContext = createContext<EntityCreateDrawerContextValue | null>(null);

export function useEntityCreateDrawerClose(): () => void {
  const context = useContext(EntityCreateDrawerContext);
  if (!context) {
    throw new Error("useEntityCreateDrawerClose must be used within an <EntityCreateDrawer>");
  }
  return context.close;
}

export interface EntityCreateDrawerProps {
  triggerLabel: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function EntityCreateDrawer({
  triggerLabel,
  title,
  description,
  children,
}: EntityCreateDrawerProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button">{triggerLabel}</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <EntityCreateDrawerContext.Provider value={{ close }}>
            {children}
          </EntityCreateDrawerContext.Provider>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
