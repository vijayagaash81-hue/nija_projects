# Documentation for tax invoice print ue.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/SJS Invoice Template Enhancement/tax invoice print ue.js`

**Description:** User Event script (v2.x) attached to Transaction / Invoice records to inject the custom "Print" button on the record view mode.

**Changes:**

**17/09/2026:**
- **Client Script Path Binding**: Linked form client script module path (`form.clientScriptModulePath`) to `'SuiteScripts/Layouts/tax invoice cs.js'`.
- **Custom Button**: Injected `custpage_print_button` with label `🖶 Print` on invoice `VIEW` mode to call `printSelectedTemplate()`.

---

## Technical Overview

- **Script Type:** User Event Script (`@NScriptType UserEventScript`)
- **API Version:** SuiteScript 2.0 (`@NApiVersion 2.x`)
- **Scope:** Public (`@NModuleScope Public`)
- **Client Script Module Path:** `'SuiteScripts/Layouts/tax invoice cs.js'`

---

## Functions & Entry Points

### `beforeLoad(context)`
- **Trigger Condition:** Executed when the Invoice record is loaded in `VIEW` mode (`context.type == context.UserEventType.VIEW`).
- **Functionality:**
  1. Associates the Client Script module (`tax invoice cs.js`) to the current form using `form.clientScriptModulePath`.
  2. Adds a custom form button:
     - **Button ID:** `custpage_print_button`
     - **Label:** `🖶 Print`
     - **Function Name:** `printSelectedTemplate()` (invokes the function defined in the Client Script).