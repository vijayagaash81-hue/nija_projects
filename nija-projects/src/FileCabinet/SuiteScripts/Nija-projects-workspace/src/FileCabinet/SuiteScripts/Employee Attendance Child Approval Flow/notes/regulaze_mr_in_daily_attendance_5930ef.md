# Documentation for regulaze mr in daily attendance.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Employee Attendance Child Approval Flow/regulaze mr in daily attendance.js`

**Description:** Map/Reduce script (SuiteScript 2.1) triggered by the initial regularization Suitelet (`employee daily atten reg post.js`). Updates attendance child records, sets overall status to `4` (Pending Approval), determines whether to assign to Line Manager or HOD, and sends an email with the Suitelet approval link.
[[line manager approval reg sl.js]]
---

## Log of Changes & Implementation Notes

### 01/09/2026:
- **`getInputData` Stage**:
  - Parses input array parameter `custscript_njt_reg_arr` passed from initial Suitelet.
- **`map` Stage**:
  - Performs lookup on `employee` record for `custentity_hris_emplinemanger` (Line Manager) and `custentity_hris_emphod` (HOD).
  - Routes to Line Manager if present; if Line Manager is not configured, routes directly to HOD.
- **`reduce` Stage**:
  - Updates `customrecord_njt_emp_daily_atten_ch` fields (regularized IN/OUT, OT IN/OUT, working hours, total OT hours).
  - Sets `custrecord_hris_overall_status = 4` (Pending Approval) and updates `custrecord_hris_dailyatten_nextuser` with target manager/HOD ID.
  - **Parameter Passing Fix**: Prioritizes `data.employeeID` (the subordinate employee's ID) over header dropdown selection to build `employeeFilter`, ensuring email URL links carry `&custparam_employee=...&custparam_fromdate=...&custparam_todate=...`.
- **`sendSummaryEmail` Helper**:
  - Resolves target Suitelet URL (`line manager approval reg sl.js` or `hod reg approval process sl.js`) with filter parameters appended so the recipient opens a pre-filtered view.