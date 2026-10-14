import type { ReactNode } from "react";
import { Inbox, MoreHorizontal, Search, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  verified: "bg-success/12 text-success ring-success/25",
  approved: "bg-success/12 text-success ring-success/25",
  invoiced: "bg-info/12 text-info ring-info/25",
  healthy: "bg-success/12 text-success ring-success/25",
  active: "bg-success/12 text-success ring-success/25",
  submitted: "bg-warning/15 text-warning-foreground ring-warning/40 dark:text-warning",
  pending: "bg-warning/15 text-warning-foreground ring-warning/40 dark:text-warning",
  low: "bg-warning/15 text-warning-foreground ring-warning/40 dark:text-warning",
  rejected: "bg-destructive/12 text-destructive ring-destructive/25",
  out: "bg-destructive/12 text-destructive ring-destructive/25",
  suspended: "bg-destructive/12 text-destructive ring-destructive/25",
  cancelled: "bg-muted text-muted-foreground ring-border",
  draft: "bg-muted text-muted-foreground ring-border",
  unverified: "bg-muted text-muted-foreground ring-border",
  inactive: "bg-muted text-muted-foreground ring-border",
};

const LABELS: Record<string, string> = {
  submitted: "Pending approval",
  low: "Low stock",
  out: "Out of stock",
  healthy: "Healthy",
};

export function StatusBadge({ status, label }: { status: string; label?: string | undefined }) {
  const s = status?.toLowerCase() ?? "draft";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset",
        TONES[s] ?? TONES["draft"],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? LABELS[s] ?? s.replace(/_/g, " ")}
    </span>
  );
}

export type RowAction = {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
  separator?: boolean;
};

export function RowActions({ actions }: { actions: RowAction[] }) {
  const shown = actions.filter((a) => !a.hidden);
  if (!shown.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Row actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {shown.map((a) => (
          <div key={a.label}>
            {a.separator ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              onClick={a.onClick}
              className={cn(a.danger && "text-destructive focus:text-destructive")}
            >
              {a.icon ? <a.icon className="size-4" /> : null}
              {a.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TableState({
  loading,
  empty,
  cols,
  title = "Nothing here yet",
  hint,
  error,
}: {
  loading?: boolean;
  empty?: boolean;
  cols: number;
  title?: string;
  hint?: string;
  error?: string | null;
}) {
  if (loading)
    return (
      <>
        {[0, 1, 2, 3].map((i) => (
          <TableRow key={i} className="hover:bg-transparent">
            <TableCell colSpan={cols}>
              <Skeleton className="h-6 w-full" />
            </TableCell>
          </TableRow>
        ))}
      </>
    );
  if (error)
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={cols} className="py-12 text-center text-sm text-destructive">
          Couldn't load this list. {error}
        </TableCell>
      </TableRow>
    );
  if (!empty) return null;
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={cols} className="py-14">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Inbox className="size-5" />
          </span>
          <p className="text-sm font-medium">{title}</p>
          {hint ? <p className="max-w-sm text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function Toolbar({
  search,
  onSearch,
  placeholder,
  children,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="pl-9" />
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-muted/25 p-4">
      <div className="mb-3">
        <p className="font-heading text-sm font-semibold">{title}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function SummaryBox({ sub, disc, tax, grand, money, labor = 0 }: { labor?: number; laborPercent?: number; sub: number; disc: number; tax: number; grand: number; money: (n: number) => string }) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
      <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums text-foreground">{money(sub)}</span></div>
      <div className="flex justify-between text-muted-foreground"><span>Discount</span><span className="tabular-nums text-foreground">− {money(disc)}</span></div>
      <div className="flex justify-between text-muted-foreground"><span>Sales Tax Value</span><span className="tabular-nums text-foreground">{money(tax)}</span></div>
      <div className="flex justify-between text-muted-foreground"><span>Total Labor</span><span className="tabular-nums text-foreground">{money(labor)}</span></div>
      <div className="flex items-baseline justify-between border-t border-border pt-2">
        <span className="font-semibold">Grand total</span>
        <span className="font-heading text-xl font-semibold tabular-nums text-primary">{money(grand)}</span>
      </div>
    </div>
  );
}

/** Sticky bar shown when rows are selected: bulk verify / unverify / delete / PDF. */
export function BulkBar({ count, onClear, children }: { count: number; onClear: () => void; children: ReactNode }) {
  if (!count) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/60 px-4 py-2 text-sm">
      <span className="font-semibold">{count} selected</span>
      <Button size="sm" variant="ghost" onClick={onClear}>Clear</Button>
      <div className="ml-auto flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
