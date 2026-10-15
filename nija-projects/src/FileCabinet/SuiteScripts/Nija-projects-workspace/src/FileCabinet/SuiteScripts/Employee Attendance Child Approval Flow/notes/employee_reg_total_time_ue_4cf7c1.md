# Documentation for employee reg total time ue.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Employee Attendance Child Approval Flow/employee reg total time ue.js`

**Description:** User Event Script (SuiteScript 2.0) executing `afterSubmit` on `customrecord_njt_emp_daily_atten_ch`. Calculates total working hours, actual working hours (subtracting breaks), late hours based on assigned shift start time, and total regularized hours.

---

## Log of Changes & Implementation Notes

### 09/09/2026:
- **Regularized Hours Calculation Enhancement (`afterSubmit`)**:
  - Fixed issue where `"0"` or `0` in actual IN/OUT fields was treated as non-empty string/valid time, producing inaccurate `16:30` total regularized hours.
  - Implemented multi-case logic for `custrecord_hris_total_regularized_hours`:
    - **CASE 1 (`!hasActualIn && !hasActualOut`)**: When actual IN and OUT are missing (`0`, `"0"`, or empty), calculates full duration from `Regularize IN` to `Regularize OUT` (with overnight shift support).
    - **CASE 2 (`hasActualIn && hasActualOut`)**: When both actual IN and OUT are present, calculates the difference caused by regularization (`diffBefore` for early IN, `diffAfter` for late OUT).
    - **CASE 3**: When only one actual time is available, defaults to `00:00`.
  - Added strict checks for `0` and `"0"` across actual and regularized IN/OUT fields.