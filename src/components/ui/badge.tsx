import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset",
  {
    variants: {
      variant: {
        secondary: "bg-secondary text-secondary-foreground ring-border",
        ok: "bg-ok-soft text-foreground ring-ok/30",
        warn: "bg-warn-soft text-foreground ring-warn/30",
        risk: "bg-risk-soft text-risk ring-risk/30",
        info: "bg-info-soft text-foreground ring-info/30",
      },
    },
    defaultVariants: { variant: "secondary" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
