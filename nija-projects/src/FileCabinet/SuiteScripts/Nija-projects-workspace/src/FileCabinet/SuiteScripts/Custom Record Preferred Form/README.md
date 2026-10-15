# Custom Record Preferred Form Details Suitelet

## Overview
This Suitelet (`custom_record_preferred_form_sl.js`) looks up and retrieves the **Form Script ID** (e.g., `custform_hris_leave_app`) and **Form Internal ID** (e.g., `167`) for any given custom record ID or custom record type ID in NetSuite.

## Script Details
- **Script File:** `custom_record_preferred_form_sl.js`
- **SuiteScript Version:** 2.1
- **Script Type:** Suitelet

---

## How to Get the Form Script ID & Internal ID

### Option 1: Via Interactive UI Form
1. Open the Suitelet URL in your browser.
2. Enter the **Custom Record Type Script ID** (e.g. `customrecord_hris_employee`) and **Record Internal ID** (e.g. `1052`).
3. Click **Get Form Details**.
4. A prominent banner displays the **Form Script ID** (e.g. `custform_hris_emp_entry`) and **Form Internal ID** (e.g. `167`).

---

### Option 2: Get Plain Text Form Script ID (For Scripts/APIs)
Add `output=scriptid` to the URL. The Suitelet will respond with **ONLY the Form Script ID** (e.g. `custform_hris_emp_entry`):

```
GET https://<account>.app.netsuite.com/app/site/hosting/scriptlet.nl?script=<SCRIPT_ID>&deploy=<DEPLOY_ID>&rectype=customrecord_hris_employee&recid=1052&output=scriptid
```
**Response Body:**
```
custform_hris_emp_entry
```

---

### Option 3: Get Plain Text Form Internal ID
Add `output=id` to the URL. The Suitelet will respond with **ONLY the raw numeric internal ID** (e.g. `167`):

```
GET https://<account>.app.netsuite.com/app/site/hosting/scriptlet.nl?script=<SCRIPT_ID>&deploy=<DEPLOY_ID>&rectype=customrecord_hris_employee&recid=1052&output=id
```
**Response Body:**
```
167
```

---

### Option 4: Get JSON Response
Add `output=json` to the URL:

```
GET https://<account>.app.netsuite.com/app/site/hosting/scriptlet.nl?script=<SCRIPT_ID>&deploy=<DEPLOY_ID>&rectype=customrecord_hris_employee&recid=1052&output=json
```

**JSON Response:**
```json
{
  "success": true,
  "formScriptId": "custform_hris_emp_entry",
  "formInternalId": 167,
  "formName": "Standard HRIS Employee Form",
  "recordType": "customrecord_hris_employee",
  "recordId": 1052,
  "source": "Explicitly Assigned customform Field on Record Instance",
  "error": null
}
```

---

### Option 5: Direct Record Redirection
Add `action=redirect` to immediately open the custom record in view mode using its preferred form:

```
GET https://<account>.app.netsuite.com/app/site/hosting/scriptlet.nl?script=<SCRIPT_ID>&deploy=<DEPLOY_ID>&rectype=customrecord_hris_employee&recid=1052&action=redirect
```
