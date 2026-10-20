import { t as MasterPage } from "./MasterPage-DTuzEODq.js";
import { jsx } from "react/jsx-runtime";
//#region src/routes/_authenticated/fbr-hs-codes.tsx?tsr-split=component
var FIELDS = [
	{
		key: "serial_number",
		label: "Serial No."
	},
	{
		key: "hs_code",
		label: "HS Code",
		required: true
	},
	{
		key: "description",
		label: "Description",
		required: true,
		type: "textarea"
	}
];
var SplitComponent = () => /* @__PURE__ */ jsx(MasterPage, {
	table: "fbr_hs_codes",
	title: "FBR HS Codes",
	description: "Official FBR code list used on quotations and invoices",
	fields: FIELDS,
	searchFields: [
		"hs_code",
		"description",
		"serial_number"
	],
	autoSerial: "serial_number"
});
//#endregion
export { SplitComponent as component };
