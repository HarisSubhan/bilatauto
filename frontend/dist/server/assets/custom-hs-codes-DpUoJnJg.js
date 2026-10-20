import { t as MasterPage } from "./MasterPage-DTuzEODq.js";
import { jsx } from "react/jsx-runtime";
//#region src/routes/_authenticated/custom-hs-codes.tsx?tsr-split=component
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
	},
	{
		key: "fbr_hs_code",
		label: "FBR HS Code (if different)",
		placeholder: "Leave blank if same as HS code"
	}
];
var SplitComponent = () => /* @__PURE__ */ jsx(MasterPage, {
	table: "custom_hs_codes",
	title: "Custom HS Codes",
	description: "Your own code list with business descriptions and prices",
	fields: FIELDS,
	searchFields: [
		"hs_code",
		"description",
		"serial_number",
		"fbr_hs_code"
	],
	autoSerial: "serial_number"
});
//#endregion
export { SplitComponent as component };
