/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @Description Processes approved daily timesheet records, aggregates hours, and creates time bill records.
 */
define(['N/record', 'N/search', 'N/log', 'N/runtime', 'N/format'], 
    (record, search, log, runtime, format) => {

        /**
         * Get input data - Load parent attendance record and return grouped timesheet lines.
         * @returns {Array<Object>} Grouped lines for processing
         */
        const getInputData = () => {
            try {
                const script = runtime.getCurrentScript();
                const parentId = script.getParameter({ name: 'custscript_njt_atten_mr_rec_id' });

                log.audit('getInputData started', { parentId: parentId });

                if (!parentId) {
                    log.error('getInputData error', 'No approved attendance record ID provided in script parameter custscript_njt_atten_mr_rec_id.');
                    return [];
                }

                // Load the daily attendance header record
                const parentRec = record.load({
                    type: 'customrecord_njt_emp_daily_atten_ch',
                    id: parentId
                });

                const sublistId = 'recmachcustrecord_hris_daily_timesheet_link';
                const lineCount = parentRec.getLineCount({ sublistId: sublistId });
                log.audit('Processing sublist lines', { lineCount: lineCount });

                if (lineCount <= 0) {
                    log.audit('No lines found', 'The sublist ' + sublistId + ' is empty.');
                    return [];
                }

                const groupedData = {};

                for (let i = 0; i < lineCount; i++) {
                    const employee = parentRec.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_hris_emp_daily_project_emp',
                        line: i
                    });

                    const attendDateVal = parentRec.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_hris_emp_daily_attend_date',
                        line: i
                    });

                    // Format/normalize date value to string
                    let attendDateStr = '';
                    if (attendDateVal) {
                        if (attendDateVal instanceof Date) {
                            attendDateStr = format.format({ value: attendDateVal, type: format.Type.DATE });
                        } else {
                            attendDateStr = String(attendDateVal);
                        }
                    }

                    const regHrs = Number(parentRec.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_hris_emp_daily_pro_reghrs',
                        line: i
                    }) || 0);

                    const workHrs = Number(parentRec.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_hris_emp_daily_pro_workhrs',
                        line: i
                    }) || 0);

                    // Use Regularize Hours if available, otherwise use Working Hours
                    const hours = regHrs > 0 ? regHrs : workHrs;

                    const stdProject = parentRec.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_hris_emp_daily_stdproject',
                        line: i
                    });

                    const projectTask = parentRec.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_hris_emp_daily_project_task',
                        line: i
                    });

                    log.debug(`Line ${i} details`, {
                        employee: employee,
                        attendDateStr: attendDateStr,
                        regHrs: regHrs,
                        workHrs: workHrs,
                        hours: hours,
                        stdProject: stdProject,
                        projectTask: projectTask
                    });

                    // Group entries by: Employee + Attendance Date + Standard Project + Project Task
                    if (employee && attendDateStr && stdProject && projectTask) {
                        const key = `${employee}_${attendDateStr}_${stdProject}_${projectTask}`;
                        
                        if (!groupedData[key]) {
                            groupedData[key] = {
                                employee: employee,
                                attendDate: attendDateStr,
                                stdProject: stdProject,
                                projectTask: projectTask,
                                hours: 0
                            };
                        }
                        groupedData[key].hours += hours;
                    } else {
                        log.warning('Skipped line ' + i + ' due to missing required fields (Employee, Date, Project, or Task).');
                    }
                }

                // Convert grouped map to an array
                const results = [];
                for (let key in groupedData) {
                    results.push(groupedData[key]);
                }

                log.audit('Grouped lines count', results.length);
                return results;

            } catch (e) {
                log.error('Error in getInputData', e);
                throw e;
            }
        };

        /**
         * Map stage - Process each unique grouped line and create the Time Bill record.
         * @param {Object} context
         */
        const map = (context) => {
            try {
                const row = JSON.parse(context.value);
                log.debug('Mapping row key: ' + context.key, row);

                const employee = row.employee;
                const attendDateStr = row.attendDate;
                const stdProject = row.stdProject;
                const projectTask = row.projectTask;
                const hours = row.hours;

                /*
                // 1. Look up job record's "parent" field from Standard Project
                let jobParent = null;
                if (stdProject) {
                    try {
                        const jobLookup = search.lookupFields({
                            type: record.Type.JOB,
                            id: stdProject,
                            columns: ['parent']
                        });
                        
                        if (jobLookup.parent && jobLookup.parent.length > 0) {
                            jobParent = jobLookup.parent[0].value;
                        }
                        log.debug('Job Lookup Success', { stdProject: stdProject, jobParent: jobParent });
                    } catch (jobErr) {
                        log.error('Error looking up parent for Job ID: ' + stdProject, jobErr);
                    }
                }
                */

                // 2. Parse attendance date string back into Date object
                const parsedDate = format.parse({
                    value: attendDateStr,
                    type: format.Type.DATE
                });

                // 3. Create a NetSuite timebill (Time Tracking) record
                const timeBill = record.create({
                    type: record.Type.TIME_BILL,
                    isDynamic: true
                });

                timeBill.setValue({ fieldId: 'employee', value: employee });
                timeBill.setValue({ fieldId: 'trandate', value: parsedDate });
                timeBill.setValue({ fieldId: 'hours', value: hours });
                timeBill.setValue({ fieldId: 'customer', value: stdProject });
                timeBill.setValue({ fieldId: 'casetaskevent', value: projectTask });
                timeBill.setValue({ fieldId: 'location', value: 1 });

                /*
                // If there's a custom field to hold the Job Parent on the timebill, set it here:
                if (jobParent) {
                    log.debug('Job Parent found', { jobParentId: jobParent });
                    // Example configuration if target custom field is known:
                    // timeBill.setValue({ fieldId: 'custcol_timebill_parent_cust', value: jobParent });
                }
                */

                const timeBillId = timeBill.save();
                log.audit('Time Bill Created successfully', {
                    timeBillId: timeBillId,
                    employee: employee,
                    date: attendDateStr,
                    stdProject: stdProject,
                    hours: hours
                });

                context.write({
                    key: 'created_timebill',
                    value: timeBillId
                });

            } catch (e) {
                log.error('Error in map stage for key: ' + context.key, e);
                throw e;
            }
        };

        /**
         * Summarize stage - Log summary of execution
         * @param {Object} summary
         */
        const summarize = (summary) => {
            try {
                let createdCount = 0;
                summary.output.iterator().each((key, value) => {
                    if (key === 'created_timebill') {
                        createdCount++;
                    }
                    return true;
                });

                log.audit('Execution Summary', {
                    totalCreated: createdCount,
                    mapErrors: summary.mapSummary.errors.size(),
                    inputSummaryError: summary.inputSummary.error
                });

                // Log any errors that occurred in map
                summary.mapSummary.errors.iterator().each((key, error, executionNo) => {
                    log.error(`Map Error on key ${key} (execution #${executionNo})`, error);
                    return true;
                });

            } catch (e) {
                log.error('Error in summarize stage', e);
            }
        };

        return {
            getInputData,
            map,
            summarize
        };

    });
