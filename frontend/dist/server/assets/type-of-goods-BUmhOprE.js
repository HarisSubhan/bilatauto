import { t as MasterPage } from "./MasterPage-DF0JlIGf.js";
import { jsx } from "react/jsx-runtime";
//#region src/routes/_authenticated/type-of-goods.tsx?tsr-split=component
var SplitComponent = () => /* @__PURE__ */ jsx(MasterPage, {
	table: "type_of_goods",
	title: "Type of Goods",
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
			label: "Type of Goods",
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
