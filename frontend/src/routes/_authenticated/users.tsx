import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { DataTools } from "@/components/data/DataTools";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { createUserAccount, resetUserPassword } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — Spare Parts System" },
      { name: "description", content: "Manage user accounts, roles and module permissions." },
      { property: "og:title", content: "Users & Roles — Spare Parts System" },
      { property: "og:description", content: "Manage user accounts, roles and module permissions." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const roles = useQuery({ queryKey: ["roles"], queryFn: async () => (await db.from("roles").select("*").order("name")).data ?? [] });
  const users = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const [{ data: p }, { data: ur }] = await Promise.all([
        db.from("profiles").select("*").order("created_at"),
        db.from("user_roles").select("user_id, role_id"),
      ]);
      return (p ?? []).map((u: any) => ({ ...u, role_id: ur?.find((r: any) => r.user_id === u.id)?.role_id ?? "" }));
    },
  });

  const setRole = async (userId: string, roleId: string) => {
    await db.from("user_roles").delete().eq("user_id", userId);
    const { error } = await db.from("user_roles").insert({ user_id: userId, role_id: roleId });
    if (error) { toast.error(error.message); return; }
    toast.success("Role updated");
    void qc.invalidateQueries({ queryKey: ["users"] });
  };
  const setStatus = async (userId: string, status: "active" | "suspended") => {
    const { error } = await db.from("profiles").update({ status }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["users"] });
  };
  const reset = resetUserPassword;
  const doReset = async (userId: string) => {
    const pw = window.prompt("New password (min 8 characters)");
    if (!pw) return;
    try { await reset({ data: { user_id: userId, password: pw } }); toast.success("Password changed"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <AppShell title="Users & Roles" description="Only the Super Admin can add users or change access"
      actions={<div className="flex gap-2"><DataTools name="users" template={false}
        fields={[{ key: "full_name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "role", label: "Role" }, { key: "status", label: "Status" }]}
        exportRows={async () => (users.data ?? []).map((u: any) => ({ ...u, role: roles.data?.find((r: any) => r.id === u.role_id)?.name ?? "" }))} />
        {isSuperAdmin ? <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 size-4" />Add user</Button> : null}</div>}>
      <Tabs defaultValue="users">
        <TabsList><TabsTrigger value="users">Users</TabsTrigger><TabsTrigger value="perms">Roles & Permissions</TabsTrigger></TabsList>
        <TabsContent value="users" className="panel overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {(users.data ?? []).map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.phone}</TableCell>
                  <TableCell className="min-w-44">
                    <Select disabled={!isSuperAdmin} value={u.role_id} onValueChange={(v) => void setRole(u.id, v)}>
                      <SelectTrigger><SelectValue placeholder="No role" /></SelectTrigger>
                      <SelectContent>{(roles.data ?? []).map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="capitalize">{u.status}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    {isSuperAdmin && <>
                      <Button size="sm" variant="outline" onClick={() => void setStatus(u.id, u.status === "active" ? "suspended" : "active")}>{u.status === "active" ? "Suspend" : "Activate"}</Button>
                      <Button size="icon" variant="ghost" aria-label="Reset password" onClick={() => void doReset(u.id)}><KeyRound className="size-4" /></Button>
                    </>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="perms"><PermissionMatrix canEdit={isSuperAdmin} /></TabsContent>
      </Tabs>
      {open && <AddUser roles={roles.data ?? []} onClose={() => setOpen(false)} onDone={() => { setOpen(false); void qc.invalidateQueries({ queryKey: ["users"] }); }} />}
    </AppShell>
  );
}

function AddUser({ roles, onClose, onDone }: { roles: Array<{ id: string; name: string }>; onClose: () => void; onDone: () => void }) {
  const create = createUserAccount;
  const [f, setF] = useState({ full_name: "", email: "", password: "", phone: "", role_id: "" });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try { await create({ data: f }); toast.success("User created"); onDone(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add user</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label>Password (min 8)</Label><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <div><Label>Role</Label>
            <Select value={f.role_id} onValueChange={(v) => setF({ ...f, role_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose role" /></SelectTrigger>
              <SelectContent>{roles.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={submit} disabled={busy || !f.role_id}>{busy ? "Creating…" : "Create user"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PermissionMatrix({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["perm-matrix"],
    queryFn: async () => {
      const [r, p, rp] = await Promise.all([
        db.from("roles").select("*").order("name"),
        db.from("permissions").select("*").order("module"),
        db.from("role_permissions").select("*"),
      ]);
      return { roles: r.data ?? [], perms: p.data ?? [], links: rp.data ?? [] };
    },
  });
  const toggle = async (role_id: string, permission_id: string, on: boolean) => {
    const res = on
      ? await db.from("role_permissions").insert({ role_id, permission_id })
      : await db.from("role_permissions").delete().eq("role_id", role_id).eq("permission_id", permission_id);
    if (res.error) { toast.error(res.error.message); return; }
    void qc.invalidateQueries({ queryKey: ["perm-matrix"] });
  };
  const d = q.data;
  if (!d) return null;
  const roles = d.roles.filter((r: any) => r.slug !== "super_admin");
  return (
    <div className="overflow-x-auto panel overflow-hidden">
      <Table>
        <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Action</TableHead>{roles.map((r: any) => <TableHead key={r.id} className="text-center">{r.name}</TableHead>)}</TableRow></TableHeader>
        <TableBody>
          {d.perms.map((p: any) => (
            <TableRow key={p.id}>
              <TableCell className="capitalize">{p.module.replace(/_/g, " ")}</TableCell><TableCell className="capitalize">{p.action}</TableCell>
              {roles.map((r: any) => {
                const on = d.links.some((l: any) => l.role_id === r.id && l.permission_id === p.id);
                return <TableCell key={r.id} className="text-center"><Checkbox disabled={!canEdit} checked={on} onCheckedChange={(v) => void toggle(r.id, p.id, v === true)} /></TableCell>;
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="p-3 text-xs text-muted-foreground">Super Admin always has full access.</p>
    </div>
  );
}
