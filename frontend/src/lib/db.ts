/**
 * Small data client for the Node.js + MySQL backend.
 * Mirrors the query style used across the screens:
 *   db.from("purchases").select("*, suppliers(name)").eq("id", x).single()
 * Every call is sent to POST /api/rest/:table and checked on the server.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const API_URL: string = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "";
const TOKEN_KEY = "ba-token";
const USER_KEY = "ba-user";

type Result<T = any[]> = { data: T; error: { message: string } | null; count?: number | null };
type Session = { access_token: string; user: { id: string; email: string } };
type Listener = (event: string, session: Session | null) => void;

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem(TOKEN_KEY);
  const u = localStorage.getItem(USER_KEY);
  return t && u ? { access_token: t, user: JSON.parse(u) } : null;
}

export async function api(path: string, body?: unknown, method = body === undefined ? "GET" : "POST"): Promise<any> {
  const s = readSession();
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(s ? { Authorization: `Bearer ${s.access_token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && s) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    emit("SIGNED_OUT", null);
  }
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

const resultData = <T,>(data:any) => data as T;

class Query<T = any[]> implements PromiseLike<Result<T>> {
  private q: Record<string, any> = { op: "select", filters: [] as any[] };
  constructor(private table: string) {}
  select(columns = "*", opts?: { count?: string; head?: boolean }) {
    if (this.q["op"] === "select") this.q["op"] = "select";
    this.q["select"] = columns;
    if (opts?.count) this.q["count"] = true;
    if (opts?.head) this.q["head"] = true;
    return this;
  }
  insert(values: any) { this.q["op"] = "insert"; this.q["values"] = values; return this; }
  upsert(values: any, opts?: { onConflict?: string }) { this.q["op"] = "upsert"; this.q["values"] = values; this.q["onConflict"] = opts?.onConflict; return this; }
  update(values: any) { this.q["op"] = "update"; this.q["values"] = values; return this; }
  delete() { this.q["op"] = "delete"; return this; }
  private f(op: string, col: string, val: unknown) { this.q["filters"].push({ op, col, val }); return this; }
  eq(c: string, v: unknown) { return this.f("eq", c, v); }
  neq(c: string, v: unknown) { return this.f("neq", c, v); }
  gt(c: string, v: unknown) { return this.f("gt", c, v); }
  gte(c: string, v: unknown) { return this.f("gte", c, v); }
  lt(c: string, v: unknown) { return this.f("lt", c, v); }
  lte(c: string, v: unknown) { return this.f("lte", c, v); }
  ilike(c: string, v: unknown) { return this.f("ilike", c, v); }
  like(c: string, v: unknown) { return this.f("ilike", c, v); }
  in(c: string, v: unknown[]) { return this.f("in", c, v); }
  is(c: string, v: unknown) { return this.f("is", c, v); }
  or(expr: string) { this.q["filters"].push({ op: "or", val: expr }); return this; }
  order(col: string, opts?: { ascending?: boolean }) { (this.q["order"] ??= []).push({ col, asc: opts?.ascending !== false }); return this; }
  limit(n: number) { this.q["limit"] = n; return this; }
  range(from: number, to: number) { this.q["offset"] = from; this.q["limit"] = to - from + 1; return this; }
  single(): Query<any> { this.q["single"] = true; return this as Query<any>; }
  maybeSingle(): Query<any> { this.q["maybe"] = true; return this as Query<any>; }
  async run(): Promise<Result<T>> {
    try {
      const r = await api(`/rest/${this.table}`, this.q);
      return { data: resultData<T>(r.data ?? null), count: r.count ?? null, error: null };
    } catch (e) {
      return { data: resultData<T>(null), count: null, error: { message: (e as Error).message } };
    }
  }
  then<A = Result<T>, B = never>(ok?: ((v: Result<T>) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return this.run().then(ok, bad);
  }
}

const listeners = new Set<Listener>();
function emit(event: string, s: Session | null) { listeners.forEach((l) => l(event, s)); }

export const db = {
  from: (table: string) => new Query(table),
  rpc: async (fn: string, args: Record<string, unknown>) => {
    try { return { data: (await api(`/rpc/${fn}`, args)).data, error: null }; }
    catch (e) { return { data: null, error: { message: (e as Error).message } }; }
  },
  auth: {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const r = await api("/auth/login", { email, password });
        const user = { id: r.user.id, email: r.user.email };
        localStorage.setItem(TOKEN_KEY, r.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        const session = { access_token: r.token, user };
        emit("SIGNED_IN", session);
        return { data: { session, user }, error: null };
      } catch (e) {
        return { data: { session: null, user: null }, error: { message: (e as Error).message } };
      }
    },
    async getSession() { return { data: { session: readSession() }, error: null }; },
    async getUser() {
      const s = readSession();
      return s ? { data: { user: s.user }, error: null } : { data: { user: null }, error: { message: "Not signed in" } };
    },
    onAuthStateChange(cb: Listener) {
      listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },
    async signOut() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      emit("SIGNED_OUT", null);
      return { error: null };
    },
  },
};
