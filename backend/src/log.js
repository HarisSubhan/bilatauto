import { randomUUID } from "node:crypto";
export async function log(c, user, action, module, recordId, label, oldV = null, newV = null) {
  await c.query("INSERT INTO activity_logs(id,user_id,user_name,action,module,record_id,record_label,old_value,new_value) VALUES (?,?,?,?,?,?,?,?,?)",
    [randomUUID(), user?.id ?? null, user?.full_name ?? null, action, module, recordId, label, oldV && JSON.stringify(oldV), newV && JSON.stringify(newV)]);
}
