# HRIS Attendance Comp-Off - Integration Documentation

This document explains the modifications made to the Suitelet and Map/Reduce scripts to calculate, display, and save comp-off and roundoff values for employee attendance.

---

## 1. Suitelet: [hris_dailymanualtomonthly_process_sl.js](file:///C:/Users/EDWIN/Documents/Nija%20Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/HRIS%20Attendance%20Comp-Off/hris_dailymanualtomonthly_process_sl.js)

### **A. Added UI Columns in Sublist**
Two fields were added to the employee monthly attendance sublist:
* **Comp Off (`custpage_compoff`)**: Displays the calculated float value of comp-off.
* **Comp Off Roundoff (`custpage_compoffround`)**: Displays the rounded value (standard roundoff).

```javascript
var compOffField = salesSublist.addField({
    id: "custpage_compoff",
    type: serverWidget.FieldType.TEXT,
    label: "Comp Off"
});
var compOffRoundField = salesSublist.addField({
    id: "custpage_compoffround",
    type: serverWidget.FieldType.TEXT,
    label: "Comp Off Roundoff"
});
```

---

### **B. SuiteQL SQL Query Modification**
Modified both SQL queries in `setSublistvalue` (with and without location filtering) to perform the division check dynamically:
* Calculates the daily comp-off as `custrecord_njt_ot_hours` / `custrecord_njt_emp_daily_working_hours`.
* Added a `CASE WHEN` condition to avoid division by zero if `custrecord_njt_emp_daily_working_hours` is `0` or `NULL`.
* Fixed a spacing bug before `GROUP BY` which was causing `Invalid or unsupported search` error (e.g. `1GROUP BY`).

**Query Addition:**
```sql
SUM(CASE WHEN NVL(emp.custrecord_njt_emp_daily_working_hours, 0) = 0 THEN 0 ELSE NVL(emp.custrecord_njt_ot_hours, 0) / emp.custrecord_njt_emp_daily_working_hours END) AS comp_off
```

---

### **C. Sublist Value & Rounding Logic**
* Formats Comp Off to 2 decimal places using `.toFixed(2)`.
* Computes standard roundoff using `Math.round(compOff)`.

```javascript
var compOff = rec.comp_off || 0;
var compOffRound = Math.round(compOff);

sublist.setSublistValue({
    id: "custpage_compoff",
    line: i,
    value: compOff.toFixed(2),
    ignoreFieldChange: true,
});
sublist.setSublistValue({
    id: "custpage_compoffround",
    line: i,
    value: compOffRound.toString(),
    ignoreFieldChange: true,
});
```

---

### **D. Sublist Column Index Realignment in POST Handler**
Since `weeklyOt` and `holidayOt` columns are commented out in `createSublist`, the columns submitted in `employeesheetdata` shifted left by 2 indices. 
The POST parsing indices were realigned:
* `selectObj.noweeklyId` = `""` (No weekly OT field in sublist)
* `selectObj.noholiId` = `""` (No holiday OT field in sublist)
* `selectObj.norotId` = `columnArray[9]` (maps to `custpage_rothours`)
* `selectObj.intempId` = `columnArray[10]` (maps to `custpage_de_empintid`)
* `selectObj.parId` = `columnArray[11]` (maps to `custpage_parid`)
* `selectObj.compOff` = `columnArray[12]` (maps to `custpage_compoff`)
* `selectObj.compOffRound` = `columnArray[13]` (maps to `custpage_compoffround`)

---

## 2. Map/Reduce: [hris_dailytomonthlyattend_process_mrs.js](file:///C:/Users/EDWIN/Documents/Nija%20Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/HRIS%20Attendance%20Comp-Off/hris_dailytomonthlyattend_process_mrs.js)

### **A. Setting Values on Record**
Modified the `createMonthlyAttendanceRecord` function to set the values on the Monthly Attendance record directly as they were computed in the Suitelet:

* **Comp-Off Days (`custrecord_compoff_days`)** gets `data.compOff`.
* **Comp-Off Days Round Off (`custrecord_compoff_days_round_off`)** gets `data.compOffRound`.

```javascript
var newCompOff = parseFloat(data.compOff || 0);
var newCompOffRound = parseFloat(data.compOffRound || 0);

monthlyAttendanceRecord.setValue({ fieldId: 'custrecord_compoff_days', value: newCompOff });
monthlyAttendanceRecord.setValue({ fieldId: 'custrecord_compoff_days_round_off', value: newCompOffRound });
```
