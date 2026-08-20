/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * Description: Map/Reduce script to create HRIS Employee Project Costing Details records
 */
define(['N/record', 'N/file', 'N/log', 'N/runtime', 'N/format', 'N/search', 'N/query'],
    (record, file, log, runtime, format, search, query) => {

        const getInputData = () => {
            try {
                const script = runtime.getCurrentScript();
                const rawData = script.getParameter({ name: 'custscript_hris_projcost_data' });
                log.debug('Input Raw Data', rawData);

                if (!rawData) {
                    log.error('getInputData error', 'No payload data provided.');
                    return [];
                }

                const payload = JSON.parse(rawData);
                if (!payload.employee_ids || payload.employee_ids.length === 0) {
                    log.error('getInputData error', 'No employee IDs provided.');
                    return [];
                }

                // Delete any existing costing details for the selected employees, month, and year
                try {
                    const existingSearch = search.create({
                        type: 'customrecord_hris_emp_projcost_details',
                        filters: [
                            ['custrecord_hris_projcost_empname', 'anyof', payload.employee_ids],
                            'AND',
                            ['custrecord_hris_projcost_month', 'anyof', Number(payload.month)],
                            'AND',
                            ['custrecord_hris_projcost_year', 'anyof', Number(payload.year)]
                        ],
                        columns: ['internalid']
                    });

                    let deletedCount = 0;
                    existingSearch.run().each((result) => {
                        try {
                            record.delete({
                                type: 'customrecord_hris_emp_projcost_details',
                                id: result.id
                            });
                            deletedCount++;
                        } catch (deleteError) {
                            log.error('Error deleting costing detail ID: ' + result.id, deleteError);
                        }
                        return true;
                    });
                    log.audit('Cleaned up existing records', 'Deleted count: ' + deletedCount);
                } catch (cleanupError) {
                    log.error('Cleanup existing costing details failed', cleanupError);
                }

                // Build SQL parameters and optional filters matching the Suitelet logic
                const sqlParams = [Number(payload.month), Number(payload.year)];
                let optionalFilters = '';
                if (payload.paygroup) {
                    optionalFilters += ' AND a.custrecord_hrms_month_paygroup = ?';
                    sqlParams.push(Number(payload.paygroup));
                }
                if (payload.subsidiary) {
                    optionalFilters += ' AND emp.subsidiary = ?';
                    sqlParams.push(Number(payload.subsidiary));
                }

                const sql = `
    SELECT
        q.emp_id,
        q.emp_code,
        q.emp_name,
        q.subsidiary_name,
        q.paygroup_name,
        q.custrecord_njt_emp_daily_date AS attn_date,
        q.custrecord_hris_daily_emp_project_detail AS project_detail,
        q.custrecord_hris_diaily_emp_att_stage AS stage_detail,
        q.projectname,
        q.stagename,
        q.grosspay,
        q.workingdays,
        q.perdayhours,
        q.availablehours,
        q.projecthrs,
        q.paydate,
        q.subsidiary_id,
        q.paygroup_id,

        CASE
            WHEN q.previous_project_hours >= q.perdayhours THEN 0
            WHEN q.previous_project_hours + q.projecthrs <= q.perdayhours THEN q.projecthrs
            ELSE q.perdayhours - q.previous_project_hours
        END AS regularhrs,

        CASE
            WHEN q.previous_project_hours >= q.perdayhours THEN q.projecthrs
            WHEN q.previous_project_hours + q.projecthrs > q.perdayhours
            THEN q.previous_project_hours + q.projecthrs - q.perdayhours
            ELSE 0
        END AS othours,

        ROUND(q.grosspay / NULLIF(q.availablehours, 0), 4) AS hourlyrate,
        ROUND((q.grosspay / NULLIF(q.availablehours, 0)) * 1.5, 4) AS otrate,

        ROUND(
            (q.grosspay / NULLIF(q.availablehours, 0))
            * CASE
                WHEN q.previous_project_hours >= q.perdayhours THEN 0
                WHEN q.previous_project_hours + q.projecthrs <= q.perdayhours THEN q.projecthrs
                ELSE q.perdayhours - q.previous_project_hours
              END
        , 4) AS regularcost,

        ROUND(
            (q.grosspay / NULLIF(q.availablehours, 0)) * 1.5
            * CASE
                WHEN q.previous_project_hours >= q.perdayhours THEN q.projecthrs
                WHEN q.previous_project_hours + q.projecthrs > q.perdayhours
                THEN q.previous_project_hours + q.projecthrs - q.perdayhours
                ELSE 0
              END
        , 4) AS otcost,

        ROUND(
            (q.grosspay / NULLIF(q.availablehours, 0))
            * CASE
                WHEN q.previous_project_hours >= q.perdayhours THEN 0
                WHEN q.previous_project_hours + q.projecthrs <= q.perdayhours THEN q.projecthrs
                ELSE q.perdayhours - q.previous_project_hours
              END
            +
            (q.grosspay / NULLIF(q.availablehours, 0)) * 1.5
            * CASE
                WHEN q.previous_project_hours >= q.perdayhours THEN q.projecthrs
                WHEN q.previous_project_hours + q.projecthrs > q.perdayhours
                THEN q.previous_project_hours + q.projecthrs - q.perdayhours
                ELSE 0
              END
        , 4) AS totalcost

    FROM (
        SELECT
            p.emp_id,
            p.emp_code,
            p.emp_name,
            p.subsidiary_name,
            p.paygroup_name,
            p.custrecord_njt_emp_daily_date,
            p.custrecord_hris_daily_emp_project_detail,
            p.custrecord_hris_diaily_emp_att_stage,
            p.projectname,
            p.stagename,
            p.grosspay,
            p.workingdays,
            p.perdayhours,
            p.availablehours,
            p.projecthrs,
            p.project_row_id,
            p.paydate,
            p.subsidiary_id,
            p.paygroup_id,
            (
                SUM(p.projecthrs) OVER (
                    PARTITION BY p.emp_id, p.custrecord_njt_emp_daily_date
                    ORDER BY p.project_row_id
                ) - p.projecthrs
            ) AS previous_project_hours
        FROM (
            SELECT
                a.custrecord_hrms_month_empid AS emp_id,
                emp.custentity_hris_empcode AS emp_code,
                emp.entityid AS emp_name,
                sub.name AS subsidiary_name,
                pg.name AS paygroup_name,
                b.custrecord_njt_emp_daily_date,
                d.id AS project_row_id,
                d.custrecord_hris_daily_emp_project_detail,
                BUILTIN.DF(d.custrecord_hris_daily_emp_project_detail) AS projectname,
                d.custrecord_hris_diaily_emp_att_stage,
                BUILTIN.DF(d.custrecord_hris_diaily_emp_att_stage) AS stagename,
                a.custrecord_hrms_month_monthid,
                a.custrecord_hrms_month_yearid,
                NVL(f.custrecord_hris_empchange_month_cross_sy, 0) AS grosspay,
                22 AS workingdays,
                10 AS perdayhours,
                220 AS availablehours,
                a.custrecord_hrms_month_paydate AS paydate,
                emp.subsidiary AS subsidiary_id,
                a.custrecord_hrms_month_paygroup AS paygroup_id,
                CASE
                    WHEN d.custrecord_hris_emp_daily_pro_reghrs IS NULL
                         OR d.custrecord_hris_emp_daily_pro_reghrs = 0
                    THEN NVL(d.custrecord_hris_emp_daily_pro_workhrs, 0)
                    ELSE d.custrecord_hris_emp_daily_pro_reghrs
                END AS projecthrs
            FROM customrecord_hrms_monthlyattendance a
            JOIN customrecord_njt_emp_daily_atten_ch b
              ON a.custrecord_hrms_month_empid = b.custrecord_njt_daily_atten_emp
            JOIN customrecord_njt_emp_daily_attendance c
              ON b.custrecord_njt_emp_daily_parent = c.id
             AND c.custrecord_njt_emp_atten_month = a.custrecord_hrms_month_monthid
             AND c.custrecord_njt_emp_atten_year  = a.custrecord_hrms_month_yearid
            JOIN customrecord_hris_emp_daily_attend_proje d
              ON d.custrecord_hris_daily_timesheet_link = b.id
            LEFT JOIN customrecord_hris_employee_compen_change f
              ON f.custrecord_hris_empchange_employee_nam = a.custrecord_hrms_month_empid
             AND f.isinactive = 'F'
            JOIN employee emp ON emp.id = a.custrecord_hrms_month_empid
            LEFT JOIN subsidiary sub ON sub.id = emp.subsidiary
            LEFT JOIN customrecord_hris_process_groupmaster pg
              ON pg.id = a.custrecord_hrms_month_paygroup
            WHERE a.custrecord_hrms_month_monthid = ?
              AND a.custrecord_hrms_month_yearid  = ?
              AND a.custrecord_hrms_month_processcompleted = 'T'
              AND a.custrecord_njt_hrms_monthly_status = 1
              AND a.custrecord_hrms_month_empid IN (${payload.employee_ids.join(',')})
              ${optionalFilters}
        ) p
    ) q
    ORDER BY q.subsidiary_name, q.emp_code, q.custrecord_njt_emp_daily_date, q.project_row_id
                `;

                log.audit('Map/Reduce Query', sql);
                log.audit('Map/Reduce Query Params', sqlParams);

                const results = query.runSuiteQL({
                    query: sql,
                    params: sqlParams
                }).asMappedResults();

                log.audit('Map/Reduce fetched lines count', results.length);

                return results.map(row => ({
                    emp_id: row.emp_id,
                    emp_code: row.emp_code,
                    subsidiary_id: row.subsidiary_id,
                    paygroup_id: row.paygroup_id,
                    attn_date: row.attn_date,
                    project_detail: row.project_detail,
                    stage_detail: row.stage_detail,
                    projecthrs: row.projecthrs,
                    regularhrs: row.regularhrs,
                    othours: row.othours,
                    hourlyrate: row.hourlyrate,
                    otrate: row.otrate,
                    regularcost: row.regularcost,
                    otcost: row.otcost,
                    totalcost: row.totalcost,
                    grosspay: row.grosspay,
                    paydate: row.paydate,
                    month: payload.month,
                    year: payload.year
                }));

            } catch (e) {
                log.error('Error in getInputData', e);
                throw e;
            }
        };

        const map = (context) => {
            try {
                const row = JSON.parse(context.value);
                context.write({
                    key: context.key,
                    value: JSON.stringify(row)
                });
            } catch (e) {
                log.error('Error in map stage for key: ' + context.key, e);
                throw e;
            }
        };

        const reduce = (context) => {
            try {
                const row = JSON.parse(context.values[0]);
                log.debug('Reducing row index ' + context.key, row);

                let parsedAttnDate = null;
                if (row.attn_date) {
                    parsedAttnDate = format.parse({
                        value: row.attn_date,
                        type: format.Type.DATE
                    });
                }

                const recObj = record.create({
                    type: 'customrecord_hris_emp_projcost_details',
                    isDynamic: true
                });

                // 1. Employee Name (List/Record: Employee)
                if (row.emp_id) {
                    recObj.setValue({
                        fieldId: 'custrecord_hris_projcost_empname',
                        value: Number(row.emp_id)
                    });
                }

                // 2. Employee Code (Free-Form Text)
                if (row.emp_code) {
                    recObj.setValue({
                        fieldId: 'custrecord_hris_projcost_empcode',
                        value: row.emp_code
                    });
                }

                // 3. Subsidiary (List/Record: Subsidiary)
                if (row.subsidiary_id) {
                    recObj.setValue({
                        fieldId: 'custrecord_hris_projcost_subsidiary',
                        value: Number(row.subsidiary_id)
                    });
                }

                // 4. Paygroup (List/Record: HRIS Process Group Master)
                if (row.paygroup_id) {
                    recObj.setValue({
                        fieldId: 'custrecord_hris_projcost_paygroup',
                        value: Number(row.paygroup_id)
                    });
                }

                // 5. Attendance Date (Date)
                if (parsedAttnDate) {
                    recObj.setValue({
                        fieldId: 'custrecord_hris_projcost_attendate',
                        value: parsedAttnDate
                    });
                }

                // 6. Project (List/Record: Project)
                if (row.project_detail) {
                    recObj.setValue({
                        fieldId: 'custrecord_hris_projcost_project',
                        value: Number(row.project_detail)
                    });
                }

                // 7. Stage (List/Record: Project Budget Staging List)
                if (row.stage_detail) {
                    recObj.setValue({
                        fieldId: 'custrecord_hris_projcost_stage',
                        value: Number(row.stage_detail)
                    });
                }

                // 8. Project Hours (Decimal)
                recObj.setValue({
                    fieldId: 'custrecord_hris_projcost_projecthours',
                    value: Number(row.projecthrs || 0)
                });

                // 9. Regular Hours (Decimal)
                recObj.setValue({
                    fieldId: 'custrecord_hris_projcost_regularhours',
                    value: Number(row.regularhrs || 0)
                });

                // 10. OT Hours (Decimal)
                recObj.setValue({
                    fieldId: 'custrecord_hris_projcost_othours',
                    value: Number(row.othours || 0)
                });

                // 11. Hourly Rate (Decimal)
                recObj.setValue({
                    fieldId: 'custrecord_hris_projcost_hourlyrate',
                    value: Number(row.hourlyrate || 0)
                });

                // 12. OT Rate (Decimal)
                recObj.setValue({
                    fieldId: 'custrecord_hris_projcost_otrate',
                    value: Number(row.otrate || 0)
                });

                // 13. Regular Cost (Decimal)
                recObj.setValue({
                    fieldId: 'custrecord_hris_projcost_regularcost',
                    value: Number(row.regularcost || 0)
                });

                // 14. OT Cost (Decimal)
                recObj.setValue({
                    fieldId: 'custrecord_hris_projcost_otcost',
                    value: Number(row.otcost || 0)
                });

                // 15. Total Cost (Decimal)
                recObj.setValue({
                    fieldId: 'custrecord_hris_projcost_totalcost',
                    value: Number(row.totalcost || 0)
                });

                // 16. Gross Pay (Decimal)
                recObj.setValue({
                    fieldId: 'custrecord_hris_projcost_grosspay',
                    value: Number(row.grosspay || 0)
                });

                // 17. Pay Date (Date)
                if (row.paydate) {
                    const parsedPayDate = format.parse({
                        value: row.paydate,
                        type: format.Type.DATE
                    });
                    recObj.setValue({
                        fieldId: 'custrecord_hris_projcost_paydate',
                        value: parsedPayDate
                    });
                }

                // 18. Month (List/Record: HRIS Month List)
                if (row.month) {
                    recObj.setValue({
                        fieldId: 'custrecord_hris_projcost_month',
                        value: Number(row.month)
                    });
                }

                // 19. Year (List/Record: HRIS Year Master List)
                if (row.year) {
                    recObj.setValue({
                        fieldId: 'custrecord_hris_projcost_year',
                        value: Number(row.year)
                    });
                }

                const createdId = recObj.save();
                log.debug('Created record internal ID: ' + createdId + ' for index: ' + context.key);

                context.write({
                    key: 'created_record',
                    value: createdId
                });

            } catch (e) {
                log.error('Error in reduce stage for index: ' + context.key, e);
                throw e;
            }
        };

        const summarize = (summary) => {
            try {
                const createdIds = [];
                summary.output.iterator().each((key, value) => {
                    if (key === 'created_record') {
                        createdIds.push(value);
                    }
                    return true;
                });

                log.audit('SUMMARIZE_CREATED_IDS', { count: createdIds.length, ids: createdIds });

                if (createdIds.length > 0) {
                    const userId = runtime.getCurrentUser().id;
                    let folderId = null;

                    // Find a folder to write our result JSON file
                    const folderSearch = search.create({
                        type: 'folder',
                        filters: [['name', 'is', 'HRIS Employee Project Costing']],
                        columns: ['internalid']
                    });
                    folderSearch.run().each(res => {
                        folderId = res.id;
                        return false;
                    });

                    if (!folderId) {
                        const suiteScriptsSearch = search.create({
                            type: 'folder',
                            filters: [['name', 'is', 'SuiteScripts']],
                            columns: ['internalid']
                        });
                        suiteScriptsSearch.run().each(res => {
                            folderId = res.id;
                            return false;
                        });
                    }

                    if (folderId) {
                        const fileName = `projectcost_user_${userId}.json`;

                        // Clean up any existing file
                        try {
                            search.create({
                                type: 'file',
                                filters: [
                                    ['name', 'is', fileName],
                                    'AND',
                                    ['folder', 'anyof', folderId]
                                ]
                            }).run().each(result => {
                                file.delete({ id: result.id });
                                return true;
                            });
                        } catch (delErr) {
                            log.error('Error deleting existing file', delErr);
                        }

                        // Save new created IDs
                        const fileObj = file.create({
                            name: fileName,
                            fileType: file.Type.PLAINTEXT,
                            contents: JSON.stringify(createdIds),
                            folder: folderId
                        });
                        const savedFileId = fileObj.save();
                        log.audit('Saved created IDs to folder ' + folderId, { fileId: savedFileId });
                    } else {
                        log.error('Summarize error', 'Could not locate suitable folder to save result file.');
                    }
                }
            } catch (e) {
                log.error('Error in summarize stage', e);
            }
        };

        return {
            getInputData,
            map,
            reduce,
            summarize
        };
    });
