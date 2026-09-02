# Documentation for employee daily atten reg post.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Employee Attendance Child Approval Flow/employee daily atten reg post.js`

**Description:** Suitelet (SuiteScript 2.1) serving as the initial entry point for Employee / HR Attendance Regularization submission. Displays daily attendance child records for all employees across the organization, accepts regularized IN/OUT and Overtime IN/OUT hours, and submits them to Map/Reduce for routing to respective Line Managers or HODs.

---

## Log of Changes & Implementation Notes

### 01/09/2026:
- **Global Employee Selection (First Suitelet)**:
  - Reverted `currentUserId` restriction on the initial page so HR/Admin can view and select attendance records for all employees across the company.
- **SuiteQL Query & Duplicate Elimination**:
  - Joined `customrecord_njt_emp_daily_atten_ch`, `employee`, and `customrecord_hris_shift`.
  - Implemented shift matching logic (`TO_CHAR(custrecord_njt_emp_daily_date, 'DY') = 'SAT'`) to filter out inactive weekday shift records on Saturdays and vice-versa, preventing duplicate rows for employees with separate Saturday shifts.
- **Form Controls & Date Filtering**:
  - Filterable by `custpage_emp` (Employee), `custpage_fromdate` (From Date), and `custpage_todate` (To Date).
  - Attached client script `reg total hour cal cs.js` for real-time hour calculations on sublist edit.
- **POST Submission**:
  - Formats selected rows into `selectObj` containing `employeeID`, `employeePost`, `fromPost`, `toPost`, regularized hours, and OT hours.
  - Submits Map/Reduce task `customscript_njt_regulaze_mr_in_daily_a` (`custscript_njt_reg_arr`).