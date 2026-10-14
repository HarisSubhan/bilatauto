import brandLogo from "@/assets/bilal-logo.asset.json";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Truck,
  Building2,
  FileSpreadsheet,
  Tags,
  LogOut,
  Menu,
  Moon,
  Sun,
  ShoppingCart,
  Boxes,
  FileText,
  Receipt,
  BarChart3,
  Users,
  History,
  Settings,
  Sparkles,
  Bell,
  Search,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { db as supabase } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type NavItem = { label: string; to: string; icon: typeof LayoutDashboard };
type NavGroup = { heading: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  { heading: "Overview", items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }] },
  {
    heading: "Operations",
    items: [
      { label: "Purchases", to: "/purchases", icon: ShoppingCart },
      { label: "Quotations", to: "/quotations", icon: FileText },
      { label: "Invoices", to: "/invoices", icon: Receipt },
       { label: "Sales Tax Invoices", to: "/sales-invoices", icon: Receipt },
      { label: "Inventory", to: "/stock", icon: Boxes },
      { label: "AI Quotation", to: "/ai-quotation", icon: Sparkles },
      { label: "Reports", to: "/reports", icon: BarChart3 },
    ],
  },
  {
    heading: "Master Data",
    items: [
      { label: "Suppliers", to: "/suppliers", icon: Truck },
      { label: "Departments / Buyers", to: "/departments", icon: Building2 },
      { label: "FBR HS Codes", to: "/fbr-hs-codes", icon: FileSpreadsheet },
      { label: "Custom HS Codes", to: "/custom-hs-codes", icon: Tags },
    ],
  },
  {
    heading: "Administration",
    items: [
      { label: "Users & Roles", to: "/users", icon: Users },
      { label: "Activity Logs", to: "/activity-logs", icon: History },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

const COLLAPSE_KEY = "ba-sidebar-collapsed";

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** @deprecated theme is global now */
  darkByDefault?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { profile, roles, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  };

  const { data: pending = [] } = useQuery({
    queryKey: ["shell-pending-quotations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quotations")
        .select("id, quotation_number, grand_total, quotation_date")
        .eq("status", "submitted")
        .order("quotation_date", { ascending: false })
        .limit(6);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: brand } = useQuery({
    queryKey: ["system-brand"],
    queryFn: async () => {
      const { data } = await supabase.from("system_settings").select("key, value");
      const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));
      return {
        name: (map["system_name"] as string) || (map["company_name"] as string) || "Bilal Autos",
        logo: (map["logo_url"] as string) || "",
        favicon: (map["favicon_url"] as string) || "",
      };
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!brand?.favicon) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = brand.favicon;
    link.type = "image/png";
  }, [brand?.favicon]);

  const group = NAV.find((g) => g.items.some((i) => i.to === pathname));
  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((s: any) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = roles[0]?.replace(/_/g, " ") ?? "member";
  const brandName = brand?.name ?? "Bilal Autos";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="app-canvas flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
            collapsed ? "lg:w-[76px]" : "lg:w-64",
            "w-64",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center gap-3 px-4">
            <img src={brandLogo.url} alt="Bilal Autos" className="size-10 shrink-0 rounded-lg bg-white object-contain" />
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <p className="truncate font-heading text-sm font-semibold text-sidebar-foreground">{brandName}</p>
              <p className="truncate text-[11px] text-muted-foreground">Spare Parts Portal</p>
            </div>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
            {NAV.map((g) => (
              <div key={g.heading}>
                <p
                  className={cn(
                    "px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80",
                    collapsed && "lg:invisible lg:h-2 lg:p-0",
                  )}
                >
                  {g.heading}
                </p>
                <ul className="space-y-0.5">
                  {g.items.map((item) => {
                    const active = pathname === item.to;
                    const Icon = item.icon;
                    const link = (
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                          collapsed && "lg:justify-center lg:px-0",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        {active ? (
                          <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-primary" />
                        ) : null}
                        <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
                        <span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>
                      </Link>
                    );
                    return (
                      <li key={item.to}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{link}</TooltipTrigger>
                            <TooltipContent side="right" className="hidden lg:block">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          link
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="space-y-2 border-t border-sidebar-border p-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg bg-muted/60 p-1",
                collapsed && "lg:flex-col",
              )}
            >
              <button
                onClick={() => theme === "dark" && toggle()}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
                  theme === "light" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
                aria-label="Light mode"
              >
                <Sun className="size-3.5" />
                <span className={cn(collapsed && "lg:hidden")}>Light</span>
              </button>
              <button
                onClick={() => theme === "light" && toggle()}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
                  theme === "dark" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
                aria-label="Dark mode"
              >
                <Moon className="size-3.5" />
                <span className={cn(collapsed && "lg:hidden")}>Dark</span>
              </button>
            </div>
            <button
              onClick={toggleCollapse}
              className="hidden w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground lg:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="mx-auto size-4" /> : <PanelLeftClose className="size-4" />}
              <span className={cn(collapsed && "hidden")}>Collapse</span>
            </button>
          </div>
        </aside>

        {open ? (
          <button
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <nav className="flex items-center gap-1 text-[11px] text-muted-foreground" aria-label="Breadcrumb">
                <Link to="/dashboard" className="hover:text-foreground">Home</Link>
                {group && group.heading !== "Overview" ? (
                  <>
                    <ChevronRight className="size-3" />
                    <span>{group.heading}</span>
                  </>
                ) : null}
                <ChevronRight className="size-3" />
                <span className="truncate text-foreground/80">{title}</span>
              </nav>
              <h1 className="truncate font-heading text-base font-semibold leading-tight sm:text-lg">{title}</h1>
            </div>

            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 w-60 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40 md:flex"
            >
              <Search className="size-4" />
              <span className="flex-1 text-left">Search pages…</span>
              <kbd className="rounded border border-border bg-muted px-1.5 text-[10px] font-medium">Ctrl K</kbd>
            </button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search className="size-4" />
            </Button>

            {actions}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="size-4" />
                  {pending.length ? (
                    <span className="absolute right-1.5 top-1.5 flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-primary" />
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="text-xs text-muted-foreground">Quotations waiting for approval</p>
                </div>
                {pending.length ? (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {pending.map((q: any) => (
                      <li key={q.id}>
                        <Link
                          to="/quotations"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted"
                        >
                          <span className="flex size-8 items-center justify-center rounded-full bg-warning/15 text-warning">
                            <FileText className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{q.quotation_number}</span>
                            <span className="block text-xs text-muted-foreground">{q.quotation_date}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</div>
                )}
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="hidden sm:inline-flex">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted">
                  <span className="stat-blue flex size-8 items-center justify-center rounded-full text-xs font-semibold">
                    {initials}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-tight">{profile?.full_name ?? "User"}</span>
                    <span className="block text-[11px] capitalize text-muted-foreground">{roleLabel}</span>
                  </span>
                  <ChevronsUpDown className="hidden size-3.5 text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{profile?.full_name ?? "User"}</p>
                  <p className="text-xs font-normal capitalize text-muted-foreground">{roleLabel}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void navigate({ to: "/settings" })}>
                  <Settings className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggle}>
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()} className="text-destructive focus:text-destructive">
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="page-enter flex-1 p-4 sm:p-6 lg:p-8">
            {description ? <p className="-mt-1 mb-5 text-sm text-muted-foreground">{description}</p> : null}
            {children}
          </main>
        </div>

        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
          <CommandInput placeholder="Jump to a page…" />
          <CommandList>
            <CommandEmpty>No page found.</CommandEmpty>
            {NAV.map((g) => (
              <CommandGroup key={g.heading} heading={g.heading}>
                {g.items.map((i) => (
                  <CommandItem
                    key={i.to}
                    onSelect={() => {
                      setSearchOpen(false);
                      void navigate({ to: i.to });
                    }}
                  >
                    <i.icon className="size-4" /> {i.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </CommandDialog>
      </div>
    </TooltipProvider>
  );
}
