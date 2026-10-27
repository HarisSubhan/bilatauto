export const DELETABLE_MASTERS = new Set(['departments', 'suppliers', 'fbr_hs_codes', 'custom_hs_codes', 'type_of_goods', 'units_of_measurement', 'sro_master', 'buyer_types']);
/** Retain referenced rows and their snapshots. This avoids destructive cascades or FK disabling. */
export async function deleteMaster(conn, table, where, args) {
  if (!DELETABLE_MASTERS.has(table)) return false;
  await conn.query(`UPDATE \`${table}\` SET deleted_at=COALESCE(deleted_at,NOW())${where}`, args);
  return true;
}