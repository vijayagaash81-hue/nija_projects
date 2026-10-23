# Scenario 1: Open Record via Button & Source Fields in Create Mode

## Overview
A frequent requirement in NetSuite ERP customizations is navigating from an existing transaction or custom parent record (e.g., Material Request, Production Order, Sales Quotation) to a new child/downstream transaction (e.g., Work Order, Purchase Order, Child SO) with **pre-populated header fields and sublist line items**.

## Architecture & Flow
```
+-----------------------------+
| Source Record (VIEW Mode)   |
| [Generate Work Order Button]|
+--------------+--------------+
               |
               | Clicking button resolves URL with &customSourceId=123
               v
+-----------------------------+
| Target Record (CREATE Mode) |
| pageInit triggers           |
+--------------+--------------+
               |
               | Reads ?customSourceId=123
               | Loads Source Record
               | Sets Header (Subsidiary, Dept, Customer)
               | Loops lines -> selectNewLine -> commitLine
               v
+-----------------------------+
| Ready for User Review/Save  |
+-----------------------------+
```

## Script Components
1. **User Event Script (`ue_add_record_button.js`)**
   - **Deployment Target:** Source Record (e.g., `customrecord_material_request`).
   - **Trigger:** `beforeLoad` on `type === context.UserEventType.VIEW`.
   - **Action:** Dynamically generates target create URL using `N/url` and embeds an action button.

2. **Client Script (`cs_source_fields_on_create.js`)**
   - **Deployment Target:** Target Record (e.g., `workorder` or `customrecord_work_order`).
   - **Trigger:** `pageInit` on `context.mode === 'create'`.
   - **Action:** Extracts `customSourceId`, loads source record via `N/record`, copies values, and populates sublist lines dynamically.

## Best Practices & Tips
- **Always check `context.mode === 'create'`:** Prevents unwanted overwrites when opening an existing record in `edit` or `view` mode.
- **Dynamic Sublist Commits:** Use `currentRecord.selectNewLine()`, `setCurrentSublistValue()`, and `commitLine()` to ensure client scripts and standard pricing/taxation engines fire properly.
- **Traceability Field:** Store the source record ID in a custom field (e.g. `custbody_source_trans_ref`) so users can audit where the record came from.
