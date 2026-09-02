# Documentation for line manager approval reg sl.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Employee Attendance Child Approval Flow/line manager approval reg sl.js`

**Description:** Suitelet (SuiteScript 2.1) displaying pending attendance regularization records (`custrecord_hris_overall_status = 4`) for employees reporting to the logged-in Line Manager. Allows Line Manager review and submission to next approval stage.

---

## Log of Changes & Implementation Notes

### 01/09/2026:
- **Header Employee Field Default**:
  - Automatically defaults `custpage_emp` to the **Current Logged-in Line Manager** (`runtimeModule.getCurrentUser().id`).
- **Strict Line Manager Query & Clean Query Generation**:
  - Updated SuiteQL WHERE clause to strictly enforce `employee.custentity_hris_emplinemanger = currentUserId AND custrecord_hris_dailyatten_nextuser = currentUserId`.
  - Removed redundant `AND employee.id = empPost` condition to prevent conflicting employee filters from restricting the Line Manager table results.
- **SuiteQL Query Enhancements**:
  - Filtered by `custrecord_hris_overall_status = 4` (Pending Approval).
  - Added Saturday vs. Weekday shift filter (`TO_CHAR(custrecord_njt_emp_daily_date, 'DY') = 'SAT'`) to eliminate duplicate shift rows.
- **POST Submission**:
  - Collects modified sublist lines, includes `fromPost`, `toPost`, and `employeePost`, and submits Map/Reduce task `customscript_njt_line_manager_approval_` (`line manager approval reg mr.js`).