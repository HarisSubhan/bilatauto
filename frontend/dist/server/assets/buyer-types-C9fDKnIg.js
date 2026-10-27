import { t as MasterPage } from "./MasterPage-DF0JlIGf.js";
import { jsx } from "react/jsx-runtime";
//#region src/routes/_authenticated/buyer-types.tsx?tsr-split=component
var SplitComponent = () => /* @__PURE__ */ jsx(MasterPage, {
	table: "buyer_types",
	title: "Buyer Types",
	description: "Registered and Unregistered buyer classifications",
	searchFields: ["name"],
	autoSerial: "serial_number",
	fields: [
		{
			key: "serial_number",
			label: "Serial Number"
		},
		{
			key: "name",
			label: "Buyer type",
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
