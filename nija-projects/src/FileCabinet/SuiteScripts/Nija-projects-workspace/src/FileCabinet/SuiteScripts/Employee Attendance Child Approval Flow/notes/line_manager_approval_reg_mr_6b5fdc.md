# Documentation for line manager approval reg mr.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Employee Attendance Child Approval Flow/line manager approval reg mr.js`

**Description:** Map/Reduce script (SuiteScript 2.1) processing approvals submitted by Line Managers in `line manager approval reg sl.js`. Updates child record status, forwards next approver to HOD, and sends a single consolidated email with direct Suitelet URL link to the HOD.

---

## Log of Changes & Implementation Notes

### 01/09/2026:
- **Consolidated Email Grouping Fix**:
  - Updated `map` stage `groupKey` to group records by target HOD ID (`var groupKey = hodId ? hodId : ...`) instead of unique child record ID (`data.idchi`).
  - Previously, using `data.idchi` caused Map/Reduce to run a separate `reduce` execution for every line, sending individual emails per line.
  - Grouping by HOD ID consolidates all lines for the same HOD into a single `reduce` execution, sending **ONE single email** containing the total count of approved lines.
- **Duplicate Prevention**:
  - Added `processedRecordIds` array tracking inside `reduce` loop to ensure child records are updated once and counted accurately.
- **Dynamic HOD Name & Parameter Attachment**:
  - Dynamic lookup on HOD Employee record (`altname`) to greet HOD by full name (`Dear Vijay Agaash,`).
  - Appends filter parameters (`&custparam_employee=...&custparam_fromdate=...&custparam_todate=...`) to generated HOD link.