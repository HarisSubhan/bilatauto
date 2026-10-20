import { t as MasterPage } from "./MasterPage-DTuzEODq.js";
import { jsx } from "react/jsx-runtime";
//#region src/routes/_authenticated/suppliers.tsx?tsr-split=component
var FIELDS = [
	{
		key: "name",
		label: "Supplier Name",
		required: true
	},
	{
		key: "supplier_code",
		label: "Code"
	},
	{
		key: "contact_person",
		label: "Contact Person"
	},
	{
		key: "phone",
		label: "Phone"
	},
	{
		key: "email",
		label: "Email",
		type: "email"
	},
	{
		key: "city",
		label: "City"
	},
	{
		key: "country",
		label: "Country",
		inList: false
	},
	{
		key: "tax_number",
		label: "NTN / Tax No.",
		inList: false
	},
	{
		key: "address",
		label: "Address",
		type: "textarea",
		inList: false
	},
	{
		key: "notes",
		label: "Notes",
		type: "textarea",
		inList: false
	},
	{
		key: "status",
		label: "Status",
		type: "select",
		options: [
			"active",
			"inactive",
			"suspended"
		],
		inList: false
	}
];
var SplitComponent = () => /* @__PURE__ */ jsx(MasterPage, {
	table: "suppliers",
	title: "Suppliers",
	description: "Companies you purchase spare parts from",
	fields: FIELDS,
	searchFields: [
		"name",
		"supplier_code",
		"phone",
		"email",
		"city"
	]
});
//#endregion
export { SplitComponent as component };
