import { t as MasterPage } from "./MasterPage-DF0JlIGf.js";
import { jsx } from "react/jsx-runtime";
//#region src/routes/_authenticated/sro.tsx?tsr-split=component
var SplitComponent = () => /* @__PURE__ */ jsx(MasterPage, {
	table: "sro_master",
	title: "SRO Master",
	description: "SRO / schedule references selectable on invoice items",
	searchFields: ["name"],
	autoSerial: "serial_number",
	fields: [
		{
			key: "serial_number",
			label: "Serial Number"
		},
		{
			key: "name",
			label: "SRO reference",
			required: true
		},
		{
			key: "description",
			label: "Description",
			type: "textarea"
		},
		{
			key: "status",
			label: "Status",
			type: "select",
			options: ["active", "inactive"],
			inList: false
		}
	]
});
//#endregion
export { SplitComponent as component };
