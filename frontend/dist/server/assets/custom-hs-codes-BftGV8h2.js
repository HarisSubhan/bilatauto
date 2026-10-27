import { a as db } from "./bilal-logo.asset-DVM5nCcq.js";
import { t as MasterPage } from "./MasterPage-DF0JlIGf.js";
import { jsx } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
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
function CustomHsCodes() {
	const goods = useQuery({
		queryKey: ["type_of_goods", "active"],
		queryFn: async () => {
			const { data, error } = await db.from("type_of_goods").select("id,name").eq("status", "active").order("serial_number");
			if (error) throw new Error(error.message);
			return data ?? [];
		}
	});
	return /* @__PURE__ */ jsx(MasterPage, {
		table: "custom_hs_codes",
		title: "Custom HS Codes",
		description: "Your own code list with business descriptions and prices",
		fields: [...FIELDS, {
			key: "type_of_goods",
			label: "Suggested Type of Goods",
			type: "select",
			options: ["No suggestion", ...(goods.data ?? []).map((g) => g.name)]
		}],
		searchFields: [
			"hs_code",
			"description",
			"serial_number",
			"fbr_hs_code"
		],
		autoSerial: "serial_number"
	});
}
//#endregion
export { CustomHsCodes as component };
