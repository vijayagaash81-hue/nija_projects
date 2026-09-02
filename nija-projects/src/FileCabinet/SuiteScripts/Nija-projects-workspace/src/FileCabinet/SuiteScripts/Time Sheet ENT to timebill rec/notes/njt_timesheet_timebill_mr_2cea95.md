# Documentation for njt_timesheet_timebill_mr.js

**Original Path:** `c:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Time Sheet ENT to timebill rec/njt_timesheet_timebill_mr.js`

**Description:** Map/Reduce script (SuiteScript 2.1) that loads approved daily attendance header records (`customrecord_njt_emp_daily_atten_ch`), reads and groups sublist timesheet entries (`recmachcustrecord_hris_daily_timesheet_link`), aggregates working/regularize hours, and generates `timebill` (Time Tracking) records in NetSuite.

**Changes:**

**31/08/2026:**
- **Initial Creation of Map/Reduce Script**:
  - **`getInputData` Stage**: Loads the target attendance header record using script parameter `custscript_njt_atten_mr_rec_id`. Iterates through sublist lines (`custrecord_hris_emp_daily_attend_proje`), extracting Employee (`custrecord_hris_emp_daily_project_emp`), Attendance Date (`custrecord_hris_emp_daily_attend_date`), Regularize Hours (`custrecord_hris_emp_daily_pro_reghrs`), Working Hours (`custrecord_hris_emp_daily_pro_workhrs`), Standard Project (`custrecord_hris_emp_daily_stdproject`), and Project Task (`custrecord_hris_emp_daily_project_task`). Groups matching lines by **Employee + Date + Standard Project + Project Task** and sums total hours (using Regularize Hours if > 0, else Working Hours).
  - **`map` Stage**: Creates a `timebill` record for each aggregated line entry. Maps `employee`, `trandate`, `hours`, `customer` (from `custrecord_hris_emp_daily_stdproject`), `casetaskevent` (from `custrecord_hris_emp_daily_project_task`), and `location` (defaulted to `1`).
  - **Refinements**:
    - Commented out Job record parent lookup logic after confirming `customer` field is populated directly from `custrecord_hris_emp_daily_stdproject`.
    - Added `timeBill.setValue({ fieldId: 'location', value: 1 });` for location assignment.