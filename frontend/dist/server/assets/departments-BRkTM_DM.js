import { t as MasterPage } from "./MasterPage-Cg5ijAQt.js";
import { jsx } from "react/jsx-runtime";
//#region src/routes/_authenticated/departments.tsx?tsr-split=component
var FIELDS = [
	{
		key: "name",
		label: "Department / Buyer",
		required: true
	},
	{
		key: "code",
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
		key: "tax_number",
		label: "Tax / Registration No.",
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
	table: "departments",
	title: "Departments / Buyers",
	description: "Departments and buyers that request spare parts",
	fields: FIELDS,
	searchFields: [
		"name",
		"code",
		"contact_person",
		"phone",
		"email"
	]
});
//#endregion
export { SplitComponent as component };
