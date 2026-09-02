# Documentation for njt_timesheet_approval_ue.js

**Original Path:** `c:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Time Sheet ENT to timebill rec/njt_timesheet_approval_ue.js`

**Description:** User Event script (SuiteScript 2.1) deployed on the custom record type `customrecord_njt_emp_daily_atten_ch` (Daily Attendance Header). It listens for status changes to "Approved" and automatically triggers the Map/Reduce script `customscript_njt_timesheet_timebill_mr` to generate `timebill` records.

**Changes:**

**31/08/2026:**
- **Initial Creation of User Event Script**:
  - **Trigger Hook**: Implemented `afterSubmit` hook handling `CREATE`, `EDIT`, and `XEDIT` (Inline Edit / Approve button trigger from View Mode).
  - **Approval Status Verification**: Checks if `custrecord_njt_emp_daily_approval_status` transitions to internal ID `2` ("Approved"). Evaluates `oldRecord` vs `newRecord` on edits to prevent duplicate triggers.
  - **Task Submission**: Spawns a Map/Reduce task for `customscript_njt_timesheet_timebill_mr` (`customdeploy_njt_timesheet_timebill_mr`), passing the header record ID as parameter `custscript_njt_atten_mr_rec_id`.