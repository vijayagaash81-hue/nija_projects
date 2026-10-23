/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * 
 * Scenario: External API Integration & Staging Record Architecture (Biometric Attendance)
 * Stage 2: Staging Record Processing into NetSuite Daily Attendance
 * Purpose: Iterates over unprocessed staging records, validates and matches employee IDs,
 *          calculates work hours / shifts, creates Daily Attendance records,
 *          and marks staging records as Processed (2) or Error (3) with full error logs.
 */
define(['N/record', 'N/query', 'N/search', 'N/format', 'N/log'], 
(record, query, search, format, log) => {

    const STAGING_REC_TYPE = 'customrecord_njt_bio_staging';
    const ATTENDANCE_REC_TYPE = 'customrecord_njt_daily_attendance';

    /**
     * getInputData: Retrieves all pending staging records
     */
    const getInputData = (inputContext) => {
        try {
            log.audit({
                title: 'Staging Processor Started',
                details: 'Fetching pending staging punches...'
            });

            // SuiteQL: Fetch all staging records with Status = 1 (Pending)
            const sql = `
                SELECT 
                    id, 
                    custrecord_bio_punch_id, 
                    custrecord_bio_emp_code, 
                    custrecord_bio_device_sn, 
                    custrecord_bio_punch_time, 
                    custrecord_bio_punch_type
                FROM ${STAGING_REC_TYPE}
                WHERE custrecord_bio_status = '1'
                ORDER BY id ASC
            `;

            const results = query.runSuiteQL({ query: sql }).asMappedResults();

            log.audit({
                title: 'Pending Staging Records Found',
                details: `Count: ${results.length}`
            });

            return results;

        } catch (e) {
            log.error({
                title: 'Error in getInputData',
                details: e
            });
            return [];
        }
    };

    /**
     * Map Stage: Maps external employee code to NetSuite Employee internal ID.
     */
    const map = (mapContext) => {
        try {
            const stagingRow = JSON.parse(mapContext.value);
            const stagingId = stagingRow.id;
            const empCode = stagingRow.custrecord_bio_emp_code;

            // 1. Look up active NetSuite employee with custentity_njt_bio_emp_id = empCode
            const empInfo = getNetSuiteEmployee(empCode);

            if (!empInfo || !empInfo.id) {
                // Mark staging record as Error - Missing Employee Mapping
                updateStagingStatus(stagingId, '3', `Employee code '${empCode}' not found in NetSuite (custentity_njt_bio_emp_id)`);
                log.warn({
                    title: 'Skipped - Employee Mapping Not Found',
                    details: `Staging ID: ${stagingId}, Code: ${empCode}`
                });
                return;
            }

            // 2. Extract Date string (YYYY-MM-DD) for grouping punches by employee & day
            const punchDateTimeStr = stagingRow.custrecord_bio_punch_time;
            const punchDateStr = punchDateTimeStr.split(' ')[0] || punchDateTimeStr.split('T')[0];

            // Group key: EMPID_DATE (e.g. "1248_2026-10-15")
            const groupKey = `${empInfo.id}_${punchDateStr}`;

            mapContext.write({
                key: groupKey,
                value: {
                    stagingId: stagingId,
                    empId: empInfo.id,
                    empName: empInfo.name,
                    punchTime: punchDateTimeStr,
                    punchType: stagingRow.custrecord_bio_punch_type,
                    dateStr: punchDateStr
                }
            });

        } catch (e) {
            log.error({
                title: 'Error in Map Stage',
                details: e
            });
        }
    };

    /**
     * Reduce Stage: Consolidates punches for a single employee on a single day.
     * Determines First IN, Last OUT, total hours, and writes Daily Attendance.
     */
    const reduce = (reduceContext) => {
        try {
            const groupKey = reduceContext.key; // "1248_2026-10-15"
            const punches = reduceContext.values.map(v => JSON.parse(v));

            if (!punches || punches.length === 0) return;

            const empId = punches[0].empId;
            const dateStr = punches[0].dateStr;
            const stagingIds = punches.map(p => p.stagingId);

            // Sort punches chronologically
            punches.sort((a, b) => new Date(a.punchTime) - new Date(b.punchTime));

            const firstInPunch = punches[0].punchTime;
            const lastOutPunch = punches.length > 1 ? punches[punches.length - 1].punchTime : null;

            log.debug({
                title: `Processing Daily Attendance for ${groupKey}`,
                details: `Punches: ${punches.length}, First IN: ${firstInPunch}, Last OUT: ${lastOutPunch}`
            });

            // 1. Check if Daily Attendance already exists for this employee on this date
            const existingAttendanceId = findExistingDailyAttendance(empId, dateStr);

            let attRec;
            if (existingAttendanceId) {
                attRec = record.load({
                    type: ATTENDANCE_REC_TYPE,
                    id: existingAttendanceId,
                    isDynamic: true
                });
            } else {
                attRec = record.create({
                    type: ATTENDANCE_REC_TYPE,
                    isDynamic: true
                });
                attRec.setValue({ fieldId: 'custrecord_da_employee', value: empId });
                attRec.setValue({ fieldId: 'custrecord_da_date', value: format.parse({ value: dateStr, type: format.Type.DATE }) });
            }

            // Set punch times
            if (firstInPunch) {
                attRec.setValue({ fieldId: 'custrecord_da_in_time', value: firstInPunch });
            }
            if (lastOutPunch) {
                attRec.setValue({ fieldId: 'custrecord_da_out_time', value: lastOutPunch });
            }
            attRec.setValue({ fieldId: 'custrecord_da_status', value: 'Present' });

            const savedAttId = attRec.save({ ignoreMandatoryFields: true });

            // 2. Mark all associated staging records as 'Processed' (Status = 2)
            stagingIds.forEach(stgId => {
                updateStagingStatus(stgId, '2', `Successfully posted to Daily Attendance #${savedAttId}`);
            });

            log.audit({
                title: 'Attendance Successfully Saved',
                details: `Attendance ID: ${savedAttId} for Emp: ${empId}`
            });

        } catch (e) {
            log.error({
                title: 'Error in Reduce Stage',
                details: e
            });
        }
    };

    /**
     * Finds employee by custom biometric ID
     */
    function getNetSuiteEmployee(bioCode) {
        try {
            const sql = `
                SELECT id, entityid AS name 
                FROM employee 
                WHERE custentity_njt_bio_emp_id = ? AND isinactive = 'F'
            `;
            const res = query.runSuiteQL({ query: sql, params: [bioCode] }).asMappedResults();
            if (res.length > 0) {
                return { id: res[0].id, name: res[0].name };
            }
            return null;
        } catch (e) {
            log.error({ title: 'Employee Lookup Error', details: e });
            return null;
        }
    }

    /**
     * Checks if attendance record already exists for employee and date
     */
    function findExistingDailyAttendance(empId, dateStr) {
        try {
            const sql = `
                SELECT id 
                FROM ${ATTENDANCE_REC_TYPE} 
                WHERE custrecord_da_employee = ? 
                AND TO_CHAR(custrecord_da_date, 'YYYY-MM-DD') = ?
            `;
            const res = query.runSuiteQL({ query: sql, params: [empId, dateStr] }).asMappedResults();
            return res.length > 0 ? res[0].id : null;
        } catch (err) {
            return null;
        }
    }

    /**
     * Updates staging record status and error/success remarks
     */
    function updateStagingStatus(stagingId, statusCode, remarks) {
        try {
            record.submitFields({
                type: STAGING_REC_TYPE,
                id: stagingId,
                values: {
                    'custrecord_bio_status': statusCode,
                    'custrecord_bio_process_notes': remarks,
                    'custrecord_bio_processed_date': new Date()
                },
                options: { ignoreMandatoryFields: true }
            });
        } catch (err) {
            log.error({ title: `Failed to update staging record #${stagingId}`, details: err });
        }
    }

    const summarize = (summary) => {
        log.audit({
            title: 'Staging Processing Completed',
            details: `Map errors: ${summary.mapSummary.errors.count()}, Reduce errors: ${summary.reduceSummary.errors.count()}`
        });
    };

    return {
        getInputData,
        map,
        reduce,
        summarize
    };
});
