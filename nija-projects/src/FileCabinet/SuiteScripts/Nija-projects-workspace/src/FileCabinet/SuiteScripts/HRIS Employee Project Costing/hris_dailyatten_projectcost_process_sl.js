/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * Description: Employee Daily Attendance Project Cost Report
 *              - Receives parameters from Criteria Suitelet
 *              - Multi-project hour distribution (10 regular hrs / day)
 *              - Native NetSuite sublist & selection POST
 *              - Emails SQL via N/email for debugging
 */
define(['N/ui/serverWidget', 'N/query', 'N/url', 'N/runtime', 'N/log', 'N/file', 'N/encode', 'N/email', 'N/task', 'N/redirect', 'N/search'],
    (serverWidget, query, url, runtime, log, file, encode, email, task, redirect, search) => {

        const onRequest = (context) => {
            const { request, response } = context;

            if (request.method === 'POST') {
                try {
                    const month = request.parameters.custpage_hidden_month;
                    const year = request.parameters.custpage_hidden_year;
                    const paygroup = request.parameters.custpage_hidden_paygroup;
                    const subsidiary = request.parameters.custpage_hidden_subsidiary;

                    const lineCount = request.getLineCount({ group: 'custpage_employee_list' });
                    const selectedEmployeeIds = [];
                    for (let i = 0; i < lineCount; i++) {
                        const isChecked = request.getSublistValue({
                            group: 'custpage_employee_list',
                            name: 'custpage_col_select',
                            line: i
                        });
                        if (isChecked === 'T' || isChecked === true) {
                            const empId = request.getSublistValue({
                                group: 'custpage_employee_list',
                                name: 'custpage_col_empid',
                                line: i
                            });
                            selectedEmployeeIds.push(empId);
                        }
                    }

                    log.debug('POST Selected Employees Count', selectedEmployeeIds.length);

                    if (selectedEmployeeIds.length === 0) {
                        response.write('Please select at least one employee to create records.');
                        return;
                    }

                    const payload = {
                        month: month,
                        year: year,
                        paygroup: paygroup,
                        subsidiary: subsidiary,
                        employee_ids: selectedEmployeeIds
                    };

                    const selectedDataStr = JSON.stringify(payload);

                    // Trigger Map/Reduce script directly with data string parameter
                    const mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_hris_emp_projcost_mr',
                        deploymentId: 'customdeploy_hris_emp_projcost_mr',
                        params: {
                            custscript_hris_projcost_data: selectedDataStr
                        }
                    });
                    const mrTaskId = mrTask.submit();
                    log.debug('Triggered MR Task ID', mrTaskId);

                    // Redirect to Status Suitelet
                    redirect.toSuitelet({
                        scriptId: 'customscript_hris_emp_projcost_status_sl',
                        deploymentId: 'customdeploy_hris_emp_projcost_status_sl',
                        parameters: {
                            custscript_chqall_tskid: mrTaskId
                        }
                    });
                    return;

                } catch (postErr) {
                    log.error('POST processing error', postErr);
                    response.write('An error occurred during submission: ' + postErr.message);
                    return;
                }
            }

            const params = {
                month: request.parameters.custparam_month || request.parameters.month || null,
                year: request.parameters.custparam_year || request.parameters.year || null,
                paygroup: request.parameters.custparam_paygroup || request.parameters.paygroup || null,
                subsidiary: request.parameters.custparam_subsi || request.parameters.subsidiary || null,
                location: request.parameters.custparam_location || request.parameters.location || null,
                export: request.parameters.export === 'T'
            };

            log.debug('Incoming Params', params);

            try {
                if (!params.month || !params.year) {
                    response.write('Please select Month and Year from the criteria screen.');
                    return;
                }

                const reportData = getProjectCostData(params);
                const headerInfo = getHeaderDetails(params);

                let reportTitle = `Project Cost Report – ${headerInfo.monthName} ${headerInfo.yearName}`;
                if (headerInfo.subsidiaryName) reportTitle += ` | Subsidiary: ${headerInfo.subsidiaryName}`;
                if (headerInfo.paygroupName) reportTitle += ` | Pay Group: ${headerInfo.paygroupName}`;

                if (params.export) {
                    const excelFile = buildExcelExport(reportData, headerInfo, reportTitle);
                    response.writeFile({
                        file: excelFile,
                        isInline: false
                    });
                    return;
                }

                const form = serverWidget.createForm({ title: 'Generate Project Costing' });

                form.addFieldGroup({
                    id: 'custpage_body_group',
                    label: 'Parameters'
                });

                // Hidden fields to carry variables to the POST request
                const hiddenMonth = form.addField({
                    id: 'custpage_hidden_month',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Hidden Month'
                });
                hiddenMonth.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                hiddenMonth.defaultValue = params.month;

                const hiddenYear = form.addField({
                    id: 'custpage_hidden_year',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Hidden Year'
                });
                hiddenYear.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                hiddenYear.defaultValue = params.year;

                const hiddenPaygroup = form.addField({
                    id: 'custpage_hidden_paygroup',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Hidden Paygroup'
                });
                hiddenPaygroup.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                hiddenPaygroup.defaultValue = params.paygroup || '';

                const hiddenSubsidiary = form.addField({
                    id: 'custpage_hidden_subsidiary',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Hidden Subsidiary'
                });
                hiddenSubsidiary.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                hiddenSubsidiary.defaultValue = params.subsidiary || '';

                // Column 1
                const payGroupField = form.addField({
                    id: 'custpage_paygroup_display',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Pay Group',
                    source: 'customrecord_hris_process_groupmaster',
                    container: 'custpage_body_group'
                });
                payGroupField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                if (params.paygroup) {
                    payGroupField.defaultValue = params.paygroup;
                }

                const subsidiaryField = form.addField({
                    id: 'custpage_subsidiary_display',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Subsidiary',
                    source: 'subsidiary',
                    container: 'custpage_body_group'
                });
                subsidiaryField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                if (params.subsidiary) {
                    subsidiaryField.defaultValue = params.subsidiary;
                }

                const payDateField = form.addField({
                    id: 'custpage_paydate',
                    type: serverWidget.FieldType.DATE,
                    label: 'Pay Date',
                    container: 'custpage_body_group'
                });
                payDateField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                const firstRow = reportData.flat && reportData.flat.length ? reportData.flat[0] : null;
                if (firstRow && firstRow.paydate) {
                    payDateField.defaultValue = firstRow.paydate;
                }

                // Column 2
                const monthField = form.addField({
                    id: 'custpage_month_display',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Pay Month',
                    source: 'customlist_hris_month_list',
                    container: 'custpage_body_group'
                });
                monthField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                if (params.month) {
                    monthField.defaultValue = params.month;
                }
                monthField.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });

                const yearField = form.addField({
                    id: 'custpage_year_display',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Year',
                    source: 'customlist_hris_year_master',
                    container: 'custpage_body_group'
                });
                yearField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                if (params.year) {
                    yearField.defaultValue = params.year;
                }

                // Employee Count calculation
                let totalEmployees = 0;
                if (reportData && reportData.hierarchy) {
                    for (const subName in reportData.hierarchy) {
                        totalEmployees += Object.keys(reportData.hierarchy[subName]).length;
                    }
                }

                const empCountField = form.addField({
                    id: 'custpage_emp_count',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Employee Count',
                    container: 'custpage_body_group'
                });
                empCountField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                empCountField.defaultValue = totalEmployees;



                form.addButton({
                    id: 'custpage_back',
                    label: 'Back to Criteria',
                    functionName: 'window.history.back()'
                });

                // Create Native NetSuite Sublist
                const sublist = form.addSublist({
                    id: 'custpage_employee_list',
                    type: serverWidget.SublistType.LIST,
                    label: 'Employee List'
                });

                const selectCol = sublist.addField({
                    id: 'custpage_col_select',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Checkbox'
                });

                const empIdCol = sublist.addField({
                    id: 'custpage_col_empid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Employee ID'
                });
                empIdCol.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                sublist.addField({
                    id: 'custpage_col_empcode',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Employee Code'
                });

                sublist.addField({
                    id: 'custpage_col_empname',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Employee Name'
                });

                // Populate Sublist
                let sublistIndex = 0;
                if (reportData && reportData.hierarchy) {
                    for (const subName in reportData.hierarchy) {
                        const emps = reportData.hierarchy[subName];
                        for (const code in emps) {
                            const emp = emps[code];

                            sublist.setSublistValue({
                                id: 'custpage_col_empid',
                                line: sublistIndex,
                                value: String(emp.emp_id)
                            });

                            if (code) {
                                sublist.setSublistValue({
                                    id: 'custpage_col_empcode',
                                    line: sublistIndex,
                                    value: code
                                });
                            }

                            if (emp.emp_name) {
                                sublist.setSublistValue({
                                    id: 'custpage_col_empname',
                                    line: sublistIndex,
                                    value: emp.emp_name
                                });
                            }

                            sublistIndex++;
                        }
                    }
                }

                form.addSubmitButton({
                    label: 'Generate Project Costing'
                });

                response.writePage(form);

            } catch (e) {
                log.error('Error in onRequest', e);
                response.write('An error occurred generating the report: ' + e.message);
            }
        };

        /* ------------------------------------------------------------------
         *  SuiteQL – Multi-project cost (distributes 10 regular hrs/day)
         * ------------------------------------------------------------------ */
        const getProjectCostData = (p) => {
            const sqlParams = [Number(p.month), Number(p.year)];

            // Optional filters – must be inside the innermost WHERE
            let optionalFilters = '';
            if (p.paygroup) {
                optionalFilters += ' AND a.custrecord_hrms_month_paygroup = ?';
                sqlParams.push(Number(p.paygroup));
            }
            if (p.subsidiary) {
                optionalFilters += ' AND emp.subsidiary = ?';
                sqlParams.push(Number(p.subsidiary));
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
          ${optionalFilters}
    ) p
) q
ORDER BY q.subsidiary_name, q.emp_code, q.custrecord_njt_emp_daily_date, q.project_row_id
            `;

            log.debug('Project Cost SQL', sql);
            log.debug('SQL Params', sqlParams);

            // Debug email – sends the final SQL
            try {
                email.send({
                    author: -5,
                    recipients: 'florence@nijatech.com',
                    subject: 'Project Cost Query – ' + (p.month || '') + '/' + (p.year || ''),
                    body: 'Params: ' + JSON.stringify(sqlParams) + '\n\n' + sql,
                    isInternalOnly: true
                });
            } catch (mailErr) {
                log.error('Debug email failed', mailErr);
            }

            const results = query.runSuiteQL({
                query: sql,
                params: sqlParams
            }).asMappedResults();

            const hierarchy = {};
            results.forEach(row => {
                const sub = row.subsidiary_name || 'Default';
                const code = row.emp_code || 'N/A';
                if (!hierarchy[sub]) hierarchy[sub] = {};
                if (!hierarchy[sub][code]) {
                    hierarchy[sub][code] = {
                        emp_id: row.emp_id,
                        emp_name: row.emp_name,
                        paygroup: row.paygroup_name || '',
                        rows: []
                    };
                }
                hierarchy[sub][code].rows.push(row);
            });

            return { hierarchy, flat: results };
        };

        /* ------------------------------------------------------------------
         *  Header helpers
         * ------------------------------------------------------------------ */
        const getHeaderDetails = (p) => {
            const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const details = {
                monthName: months[Number(p.month)] || p.month,
                yearName: '',
                subsidiaryName: '',
                paygroupName: ''
            };

            if (p.year) {
                try {
                    const yr = query.runSuiteQL({
                        query: 'SELECT name FROM customlist_hris_year_master WHERE id = ?',
                        params: [Number(p.year)]
                    }).asMappedResults();
                    details.yearName = yr.length ? yr[0].name : p.year;
                } catch (e) {
                    details.yearName = p.year;
                }
            }

            if (p.subsidiary) {
                try {
                    const sub = query.runSuiteQL({
                        query: 'SELECT name FROM subsidiary WHERE id = ?',
                        params: [Number(p.subsidiary)]
                    }).asMappedResults();
                    if (sub.length) details.subsidiaryName = sub[0].name;
                } catch (e) { /* ignore */ }
            }

            if (p.paygroup) {
                try {
                    const pg = query.runSuiteQL({
                        query: 'SELECT name FROM customrecord_hris_process_groupmaster WHERE id = ?',
                        params: [Number(p.paygroup)]
                    }).asMappedResults();
                    if (pg.length) details.paygroupName = pg[0].name;
                } catch (e) { /* ignore */ }
            }

            return details;
        };

        /* ------------------------------------------------------------------
         *  Excel Export
         * ------------------------------------------------------------------ */
        const buildExcelExport = (data, header, title) => {
            const { hierarchy } = data;
            const colCount = 3;

            let xml = '<?xml version="1.0"?>\n';
            xml += '<?mso-application progid="Excel.Sheet"?>\n';
            xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
            xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
            xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
            xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
            xml += '<Styles>\n';
            xml += '    <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>\n';
            xml += '    <Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="16"/></Style>\n';
            xml += '    <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#103B6D" ss:Pattern="Solid"/></Style>\n';
            xml += '</Styles>\n';
            xml += '<Worksheet ss:Name="Employee List"><Table>\n';

            xml += '<Row ss:Height="25"><Cell ss:MergeAcross="' + (colCount - 1) + '" ss:StyleID="Title"><Data ss:Type="String">' + escapeXml(title) + '</Data></Cell></Row>\n';

            const headers = [
                'SL.No', 'Emp Code', 'Employee Name'
            ];
            xml += '<Row>';
            headers.forEach(h => {
                xml += '<Cell ss:StyleID="Header"><Data ss:Type="String">' + escapeXml(h) + '</Data></Cell>';
            });
            xml += '</Row>\n';

            let serial = 1;
            for (const subName in hierarchy) {
                const emps = hierarchy[subName];
                for (const code in emps) {
                    const emp = emps[code];
                    xml += '<Row>';
                    xml += '<Cell><Data ss:Type="Number">' + serial + '</Data></Cell>';
                    xml += '<Cell><Data ss:Type="String">' + escapeXml(String(code || '')) + '</Data></Cell>';
                    xml += '<Cell><Data ss:Type="String">' + escapeXml(String(emp.emp_name || '')) + '</Data></Cell>';
                    xml += '</Row>\n';
                    serial++;
                }
            }

            xml += '</Table>\n';
            xml += '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><Selected/><ProtectObjects>False</ProtectObjects><ProtectScenarios>False</ProtectScenarios></WorksheetOptions>\n';
            xml += '</Worksheet></Workbook>';

            return file.create({
                name: title.replace(/[^a-zA-Z0-9]/g, '_') + '.xls',
                fileType: file.Type.EXCEL,
                contents: encode.convert({
                    string: xml,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64
                })
            });
        };

        const formatNum = (val) => {
            const n = Number(val || 0);
            return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        };

        const escapeHtml = (str) => str
            ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            : '';

        const escapeXml = (str) => str
            ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            : '';

        return { onRequest };
    }
);
