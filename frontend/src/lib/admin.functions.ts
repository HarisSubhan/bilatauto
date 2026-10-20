import { api } from "@/lib/db";

export const createUserAccount = ({ data }: { data: { full_name: string; email: string; password: string; phone?: string; role_id: string } }) =>
  api("/users", data) as Promise<{ id: string }>;

export const resetUserPassword = ({ data }: { data: { user_id: string; password: string } }) =>
  api(`/users/${data.user_id}`, { password: data.password }, "PUT") as Promise<{ ok: boolean }>;
