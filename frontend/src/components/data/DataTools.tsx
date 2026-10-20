import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImportDialog, downloadXlsx, readSpreadsheet } from "./ImportDialog";
import { db } from "@/lib/db";
import type { FieldDef } from "./MasterPage";

/** Template / Export / Import buttons used on every module screen. */
export function DataTools({
  name,
  fields,
  exportRows,
  onImport,
  template = true,
  exportFields = fields,
}: {
  name: string;
  fields: FieldDef[];
  exportRows: () => Promise<Array<Record<string, unknown>>>;
  onImport?: (rows: Array<Record<string, unknown>>) => Promise<string | void>;
  template?: boolean;
  exportFields?: FieldDef[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Array<Record<string, string>> | null>(null);
  const labeled = ["purchases","invoices","sales-tax-invoices"].includes(name);
  const headers = exportFields.map(f=>labeled?f.label:f.key);
  const templateDownload = async () => {
    if(!labeled){downloadXlsx(`${name}-template.xlsx`,[],fields.map(f=>f.key));return;}
    try{const {data,error}=await db.rpc("document_template",{_kind:name==="purchases"?"purchase":"invoice"});if(error)throw new Error(error.message);const bytes=Uint8Array.from(atob(data.base64),(c)=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));const a=document.createElement("a");a.href=url;a.download=data.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){toast.error((e as Error).message);}
  };
  return (
    <>
      {template ? (
        <Button size="sm" variant="outline" onClick={()=>void templateDownload()}>
          <FileSpreadsheet className="mr-1 size-4" /> Template
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          try {
            const data = await exportRows();
            if (!data.length) { toast.info("Nothing to export yet"); return; }
            downloadXlsx(`${name}-export.xlsx`, labeled?data.map(r=>Object.fromEntries(exportFields.map(f=>[f.label,r[f.key]??""]))):data, headers);
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      >
        <Download className="mr-1 size-4" /> Export
      </Button>
      {onImport ? (
        <>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1 size-4" /> Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept=".csv,.xlsx,.xls"
            aria-label={`Import ${name} file`}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return undefined;
              const parsed = await readSpreadsheet(f);
              if (!parsed.length) { toast.error("The file has no rows"); return; }
              setRows(parsed);
            }}
          />
        </>
      ) : null}
      {rows && onImport ? (
        <ImportDialog
          rows={rows}
          grouped={labeled}
          fields={fields}
          onClose={() => setRows(null)}
          onImport={async (m: any) => {
            const msg = await onImport(m);
            toast.success(msg || `${m.length} rows imported`);
          }}
        />
      ) : null}
    </>
  );
}
