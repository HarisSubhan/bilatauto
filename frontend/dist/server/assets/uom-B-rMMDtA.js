import { t as MasterPage } from "./MasterPage-DF0JlIGf.js";
import { jsx } from "react/jsx-runtime";
//#region src/routes/_authenticated/uom.tsx?tsr-split=component
var SplitComponent = () => /* @__PURE__ */ jsx(MasterPage, {
	table: "units_of_measurement",
	title: "Unit of Measurement (UOM)",
	description: "",
	searchFields: ["name"],
	autoSerial: "serial_number",
	fields: [
		{
			key: "serial_number",
			label: "Serial Number"
		},
		{
			key: "name",
			label: "Unit of Measurement (UOM)",
			required: true
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
