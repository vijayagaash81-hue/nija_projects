# Documentation for hod reg approval mr.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Employee Attendance Child Approval Flow/hod reg approval mr.js`

**Description:** Map/Reduce script (SuiteScript 2.x) handling bulk approval and regularization processing submitted by HODs or Line Managers. Updates daily attendance child records (`CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH`), routes approval states, and sends consolidated email notifications to HR Admin for fully approved records.

---

## Script Architecture & Stages

### 1. `getInputData`
- Retrieves incoming regularization payload (`custscript_hris_hod_approval_mr`) passed from the HOD approval Suitelet.
- Updates custom Status Bar Record (`customrecord_hris_mr_status_bar_rec`, ID 5) to `2` (Processing).

### 2. `map`
- Validates child record ID (`idchi`) and employee ID (`employeeID`).
- Performs lookup on `EMPLOYEE` record for `custentity_hris_emplinemanger` and `custentity_hris_emphod`.
- Groups items by `idchi` (child record ID).

### 3. `reduce`
- Determines logged-in user role (`isLineManager` or `isHod`).
- **Line Manager**: Sets `custrecord_hris_dailyatten_nextuser` to HOD ID and `custrecord_hris_overall_status` to `4` (Pending HOD Approval).
- **HOD**: Sets `custrecord_hris_dailyatten_nextuser` to `""` and `custrecord_hris_overall_status` to `1` (Approved).
- Updates child record fields (`custrecord_njt_emp_daily_reg_in`, `custrecord_njt_emp_daily_reg_out`, `custrecord_hris_reg_overtime_in`, `custrecord_hris_regula_overtime_out`, `custrecord_njt_ot_hours`, `custrecord_njt_emp_daily_working_hours`).
- Writes approved records (status `1`) to output for consolidation in the `summarize` stage.

### 4. `summarize`
- Resets status bar record to `1` (Idle).
- Iterates over fully approved records and triggers `sendHrAdminConsolidatedEmail()`.
- Searches for active HR Admin employees (Role 1019 or name containing 'HR Admin') via SuiteQL / `N/search`.
- Filters out Nijatech internal employees (`isNijatechEmployee()`).
- Sends a single consolidated HTML table email to HR Admin recipients summarizing approved attendance regularizations.
