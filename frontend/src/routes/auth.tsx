import brandLogo from "@/assets/bilal-logo.asset.json";
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, Cog, Wrench, Gauge, Lock, Mail } from "lucide-react";
import { db as supabase } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Bilal Autos Spare Parts System" },
      {
        name: "description",
        content: "Sign in to manage spare parts inventory, purchases, quotations and invoices.",
      },
      { property: "og:title", content: "Sign in — Bilal Autos Spare Parts System" },
      {
        property: "og:description",
        content: "Secure access to the spare parts management and invoicing portal.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data } = await supabase.auth.getSession();
      if (data.session) void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-scene relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* animated background layers */}
      <div className="auth-grid" aria-hidden />
      <div className="auth-road" aria-hidden>
        <div className="auth-road-lines" />
      </div>
      <div className="auth-glow auth-glow-a" aria-hidden />
      <div className="auth-glow auth-glow-b" aria-hidden />

      {/* floating gears */}
      <Cog aria-hidden className="auth-gear left-[8%] top-[14%] size-24 [animation-duration:14s]" />
      <Cog aria-hidden className="auth-gear right-[10%] top-[20%] size-16 [animation-duration:10s] [animation-direction:reverse]" />
      <Cog aria-hidden className="auth-gear bottom-[16%] left-[14%] size-14 [animation-duration:18s] [animation-direction:reverse]" />
      <Wrench aria-hidden className="auth-gear bottom-[22%] right-[12%] size-12 [animation-duration:22s]" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl stat-orange shadow-lg shadow-primary/30">
            <img src={brandLogo.url} alt="Bilal Autos" className="h-full w-full rounded-xl bg-white object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Bilal Autos</h1>
          <p className="mt-1 text-sm text-white/60">
            Spare parts inventory, quotations, approvals &amp; invoicing
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl"
        >
          <div>
            <Label htmlFor="email" className="text-white/80">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/15 bg-white/10 pl-9 text-white placeholder:text-white/35 focus-visible:ring-primary"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password" className="text-white/80">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-white/15 bg-white/10 pl-9 pr-10 text-white placeholder:text-white/35 focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-xs text-white/40">
            Access is managed by the system administrator.
          </p>
        </form>
      </div>
    </div>
  );
}
