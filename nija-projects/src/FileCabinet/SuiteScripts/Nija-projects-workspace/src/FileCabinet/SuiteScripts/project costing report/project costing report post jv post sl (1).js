/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query', 'N/log'], (query, log) => {

    const onRequest = (scriptContext) => {

        const req = scriptContext.request;
        const res = scriptContext.response;

        const subsidiaryId = req.parameters.custparam_subsidiary || '';
        const paygroupId   = req.parameters.custparam_paygroup || '';
        const monthId      = req.parameters.custparam_month || '';
        const yearId       = req.parameters.custparam_year || '';

        // Handle DataTables Server-Side AJAX Request
        if (req.parameters.action === 'fetch_data') {
            res.setHeader({ name: 'Content-Type', value: 'application/json' });

            try {
                const draw = parseInt(req.parameters.draw, 10) || 1;
                const searchValue = (req.parameters['search[value]'] || '').trim().toLowerCase();

                // -------------------------------------------------------------
                // 1. Dynamic Account Mappings from customrecord_hris_accountmapping
                // -------------------------------------------------------------
                let COMPONENT_GL_MAP = {}; 
                let ACCRUAL_GL_MAP = {};   

                if (subsidiaryId && paygroupId) {
                    try {
                        const mappingQuery = `
                            SELECT 
                                map.custrecord_hris_acctmap_paycomponent AS component_id,
                                BUILTIN.DF(map.custrecord_hris_acctmap_paycomponent) AS component_name,
                                map.custrecord_hris_acctmap_accuraltype AS accrual_type,
                                map.custrecordhris_acctmap_transactiontype AS transaction_type,
                                map.custrecord_hris_acctmap_glacctcode AS gl_code,
                                BUILTIN.DF(map.custrecord_hris_acctmap_glcode) AS gl_account_name,
                                map.custrecord_hris_acctmap_salpayacctcode AS sal_pay_gl_code,
                                BUILTIN.DF(map.custrecord_hris_acctmap_salarypayableacc) AS sal_pay_account_name
                            FROM customrecord_hris_accountmapping map
                            WHERE map.custrecord_hris_acctmap_subsidiary = ?
                              AND map.custrecord_hris_acctmap_paygroup = ?
                        `;

                        const mappingResults = query.runSuiteQL({
                            query: mappingQuery,
                            params: [subsidiaryId, paygroupId]
                        }).asMappedResults();

                        if (mappingResults.length > 0) {
                            mappingResults.forEach(row => {
                                const glData = {
                                    code: row.gl_code || '',
                                    name: row.gl_account_name || '',
                                    salPayCode: row.sal_pay_gl_code || '',
                                    salPayName: row.sal_pay_account_name || ''
                                };

                                if (row.component_id) {
                                    COMPONENT_GL_MAP[row.component_id] = glData;
                                }
                                if (row.component_name) {
                                    COMPONENT_GL_MAP[row.component_name.trim().toLowerCase()] = glData;
                                }

                                if (row.accrual_type || row.transaction_type) {
                                    const exactKey = `${row.accrual_type || ''}_${row.transaction_type || ''}`.toLowerCase();
                                    ACCRUAL_GL_MAP[exactKey] = glData;

                                    if (row.accrual_type) {
                                        ACCRUAL_GL_MAP[`type_${row.accrual_type}`.toLowerCase()] = glData;
                                    }
                                }
                            });
                        } else {
                            log.error({ 
                                title: 'Account Mapping Missing', 
                                details: `No record found in customrecord_hris_accountmapping for Subsidiary: ${subsidiaryId}, Paygroup: ${paygroupId}` 
                            });
                        }
                    } catch (mapErr) {
                        log.error({ title: 'Account Mapping Query Error', details: mapErr });
                    }
                }

                // -------------------------------------------------------------
                // 2. Fetch Core Data
                // -------------------------------------------------------------
                let queryResults = [];
                let componentBreakdown = [];
                let accrualBreakdown = [];

                if (monthId && yearId && paygroupId && subsidiaryId) {

                    // Fetch Employee Payroll Component Breakdown
                    const compQuery = `
                        SELECT 
                            pp.custrecord_hris_pay_proc_employee AS emp_id,
                            emp.entityid AS emp_name,
                            emp.custentity_hris_empcode AS emp_code,
                            pp.custrecord_hris_pay_proc_payroll_compone AS component_id,
                            BUILTIN.DF(pp.custrecord_hris_pay_proc_payroll_compone) AS component_name,
                            NVL(SUM(pp.custrecord_hris_pay_proc_value), 0) AS component_amount
                        FROM customrecord_hris_pay_process pp
                        JOIN customrecord_hris_payroll_component pc 
                            ON pp.custrecord_hris_pay_proc_payroll_compone = pc.id
                        JOIN employee emp 
                            ON emp.id = pp.custrecord_hris_pay_proc_employee
                        WHERE pp.custrecord_hris_pay_proc_company_name = ?
                          AND pp.custrecord_hris_pay_proc_pay_group = ?
                          AND pp.custrecord_hris_pay_proc_pay_month = ?
                          AND pp.custrecord_hris_pay_proc_year = ?
                          AND pp.custrecord_hris_pay_proc_process_type = 1
                          AND pc.custrecord_hris_consider_for_pr_costing = 'T'
                        GROUP BY 
                            pp.custrecord_hris_pay_proc_employee,
                            emp.entityid,
                            emp.custentity_hris_empcode,
                            pp.custrecord_hris_pay_proc_payroll_compone,
                            BUILTIN.DF(pp.custrecord_hris_pay_proc_payroll_compone)
                    `;

                    componentBreakdown = query.runSuiteQL({
                        query: compQuery,
                        params: [subsidiaryId, paygroupId, monthId, yearId]
                    }).asMappedResults();

                    // Fetch Detailed Monthly Accruals Breakdown
                    const accQuery = `
                        SELECT 
                            act.custrecord_hris_accural_empid AS emp_id,
                            emp.entityid AS emp_name,
                            emp.custentity_hris_empcode AS emp_code,
                            act.custrecord_hris_accural_type AS accrual_type,
                            BUILTIN.DF(act.custrecord_hris_accural_type) AS accrual_type_name,
                            act.custrecord_hris_accural_trans_type AS accrual_trans_type,
                            BUILTIN.DF(act.custrecord_hris_accural_trans_type) AS accrual_trans_type_name,
                            NVL(SUM(act.custrecord_hris_accural_amount), 0) AS accrual_amount
                        FROM customrecord_hris_monthly_accural_trans act
                        JOIN employee emp 
                            ON emp.id = act.custrecord_hris_accural_empid
                        WHERE act.custrecord_hris_accural_month = ?
                          AND act.custrecord_hris_accural_year = ?
                          AND act.custrecord_hris_accural_paygroup = ?
                        GROUP BY 
                            act.custrecord_hris_accural_empid,
                            emp.entityid,
                            emp.custentity_hris_empcode,
                            act.custrecord_hris_accural_type,
                            BUILTIN.DF(act.custrecord_hris_accural_type),
                            act.custrecord_hris_accural_trans_type,
                            BUILTIN.DF(act.custrecord_hris_accural_trans_type)
                    `;

                    accrualBreakdown = query.runSuiteQL({
                        query: accQuery,
                        params: [monthId, yearId, paygroupId]
                    }).asMappedResults();

                    // Fetch Main Costing Allocations
                    const baseQuery = getSuiteQLQuery();
                    const sqlParams = [
                        monthId, yearId, paygroupId, subsidiaryId,
                        monthId, yearId, paygroupId,
                        monthId, yearId, paygroupId,
                        paygroupId, monthId, yearId, subsidiaryId
                    ];

                    queryResults = query.runSuiteQL({
                        query: baseQuery,
                        params: sqlParams
                    }).asMappedResults();
                }

                // -------------------------------------------------------------
                // 3. Construct Journal Entries Sequence
                // -------------------------------------------------------------
                let allJournalRows = [];
                const empMap = {};

                const labourDebitMapping = COMPONENT_GL_MAP['project labour cost'] || { code: '', name: 'Project Labour Cost' };
                const provisionDebitMapping = COMPONENT_GL_MAP['project provision cost'] || { code: '', name: 'Project Provision Cost' };

                queryResults.forEach(row => {
                    const empId = row.emp_id;
                    if (!empMap[empId]) {
                        empMap[empId] = {
                            empName: row.emp_name || '-',
                            empCode: row.emp_code || '',
                            labourDebits: [],
                            provisionDebits: []
                        };
                    }

                    const labourCost = parseFloat(row.project_costing_amount || 0);
                    const provisionCost = parseFloat(row.provision_costing_amount || 0);
                    const projectName = row.projectname || '-';

                    if (labourCost > 0) {
                        empMap[empId].labourDebits.push([
                            labourDebitMapping.code,
                            labourDebitMapping.name,
                            labourCost.toFixed(2),
                            '',
                            projectName,
                            empMap[empId].empName
                        ]);
                    }

                    if (provisionCost > 0) {
                        empMap[empId].provisionDebits.push([
                            provisionDebitMapping.code,
                            provisionDebitMapping.name,
                            provisionCost.toFixed(2),
                            '',
                            projectName,
                            empMap[empId].empName
                        ]);
                    }
                });

                const empCreditComponents = {};
                componentBreakdown.forEach(comp => {
                    const empId = comp.emp_id;
                    if (!empCreditComponents[empId]) {
                        empCreditComponents[empId] = [];
                    }

                    const compId = comp.component_id;
                    const compNameKey = (comp.component_name || '').trim().toLowerCase();
                    const compAmount = parseFloat(comp.component_amount || 0);

                    const mappedGL = COMPONENT_GL_MAP[compId] || COMPONENT_GL_MAP[compNameKey] || { code: '', name: comp.component_name };

                    if (compAmount > 0) {
                        empCreditComponents[empId].push([
                            mappedGL.code,
                            mappedGL.name || comp.component_name,
                            '',
                            compAmount.toFixed(2),
                            '-',
                            comp.emp_name
                        ]);
                    }
                });

                const empAccrualCredits = {};
                accrualBreakdown.forEach(acc => {
                    const empId = acc.emp_id;
                    if (!empAccrualCredits[empId]) {
                        empAccrualCredits[empId] = [];
                    }

                    const accAmount = parseFloat(acc.accrual_amount || 0);
                    const accType = acc.accrual_type;
                    const transType = acc.accrual_trans_type;

                    const exactKey = `${accType}_${transType}`.toLowerCase();
                    const typeKey = `type_${accType}`.toLowerCase();

                    const mappedGL = ACCRUAL_GL_MAP[exactKey] || ACCRUAL_GL_MAP[typeKey] || { 
                        code: '', 
                        name: acc.accrual_type_name || acc.accrual_trans_type_name || 'Provision Expense' 
                    };

                    if (accAmount > 0) {
                        empAccrualCredits[empId].push([
                            mappedGL.code,
                            mappedGL.name,
                            '',
                            accAmount.toFixed(2),
                            '-',
                            acc.emp_name
                        ]);
                    }
                });

                Object.keys(empMap).forEach(empId => {
                    const empData = empMap[empId];

                    empData.labourDebits.forEach(line => allJournalRows.push(line));
                    empData.provisionDebits.forEach(line => allJournalRows.push(line));

                    if (empCreditComponents[empId]) {
                        empCreditComponents[empId].forEach(creditLine => allJournalRows.push(creditLine));
                    }

                    if (empAccrualCredits[empId]) {
                        empAccrualCredits[empId].forEach(accrualCreditLine => allJournalRows.push(accrualCreditLine));
                    }
                });

                const totalRecords = allJournalRows.length;

                // 4. Search Filtering
                if (searchValue) {
                    allJournalRows = allJournalRows.filter(rowArray => {
                        return rowArray.some(cellValue => 
                            cellValue.toString().toLowerCase().includes(searchValue)
                        );
                    });
                }

                const filteredRecords = allJournalRows.length;

                // 5. Server-Side Pagination
                const start = parseInt(req.parameters.start, 10) || 0;
                const length = parseInt(req.parameters.length, 10) || 100;
                const pagedData = allJournalRows.slice(start, start + length);

                res.write(JSON.stringify({
                    draw: draw,
                    recordsTotal: totalRecords,
                    recordsFiltered: filteredRecords,
                    data: pagedData
                }));

            } catch (e) {
                log.error({ title: 'Data Fetch Error', details: e });
                res.write(JSON.stringify({
                    draw: parseInt(req.parameters.draw, 10) || 1,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: [],
                    error: e.message
                }));
            }
            return;
        }

        // Render Suitelet Page HTML
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Project Cost Allocation Report</title>
                <link rel="preconnect" href="https://fonts.googleapis.com"/>
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
                <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css"/>
                <script type="text/javascript" src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
                <script type="text/javascript" src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
                <style>
                    :root {
                        --navy: #1c3f6e;
                        --navy-dark: #14304f;
                        --surface: #ffffff;
                        --surface-alt: #eaf0f8;
                        --border-color: #d5dee8;
                        --text-main: #1f2d3d;
                        --text-muted: #5a6b7d;
                    }

                    * { box-sizing: border-box; }

                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        color: var(--text-main);
                        padding: 24px;
                        background: #ffffff;
                        margin: 0;
                    }

                    .header-box {
                        font-family: 'Inter', sans-serif;
                        color: var(--navy);
                        font-size: 20px;
                        font-weight: 700;
                        text-align: center;
                        margin-bottom: 18px;
                    }

                    table.dataTable {
                        border-collapse: collapse !important;
                        background: var(--surface);
                        font-size: 13.5px;
                        width: 100% !important;
                        border: 1px solid var(--border-color);
                    }

                    table.dataTable thead th {
                        background-color: var(--navy);
                        color: #ffffff;
                        font-family: 'Inter', sans-serif;
                        font-weight: 600;
                        font-size: 13px;
                        border: 1px solid var(--navy-dark);
                        padding: 12px 10px;
                    }

                    table.dataTable tbody td {
                        padding: 10px;
                        border: 1px solid var(--border-color);
                        color: var(--text-main);
                        background-color: var(--surface) !important;
                    }

                    table.dataTable.stripe tbody tr.odd,
                    table.dataTable.display tbody tr.odd,
                    table.dataTable tbody tr.odd,
                    table.dataTable.stripe tbody tr.even,
                    table.dataTable.display tbody tr.even,
                    table.dataTable tbody tr.even {
                        background-color: var(--surface) !important;
                    }

                    table.dataTable tbody tr:hover td {
                        background-color: var(--surface) !important;
                    }

                    table.dataTable tfoot th {
                        background-color: var(--surface-alt);
                        font-weight: 700;
                        color: var(--navy);
                        border: 1px solid var(--border-color);
                        border-top: 2px solid var(--navy);
                        padding: 12px 10px;
                    }

                    .dataTables_wrapper .dataTables_filter input,
                    .dataTables_wrapper .dataTables_length select {
                        font-family: 'Inter', sans-serif;
                        border: 1px solid var(--border-color);
                        border-radius: 4px;
                        padding: 5px 8px;
                    }

                    .dataTables_wrapper .dataTables_info,
                    .dataTables_wrapper .dataTables_paginate {
                        font-family: 'Inter', sans-serif;
                        color: var(--text-muted);
                        font-size: 12.5px;
                    }

                    .dataTables_wrapper .dataTables_paginate .paginate_button.current {
                        background: var(--navy) !important;
                        color: #ffffff !important;
                        border-color: var(--navy) !important;
                        border-radius: 4px;
                    }

                    .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
                        background: var(--navy-dark) !important;
                        color: #ffffff !important;
                        border-color: var(--navy-dark) !important;
                        border-radius: 4px;
                    }

                    /* Fix Loading Animation UI across all browsers & users */
                    div.dataTables_wrapper div.dataTables_processing {
                        position: fixed !important;
                        top: 50% !important;
                        left: 50% !important;
                        transform: translate(-50%, -50%) !important;
                        width: 220px !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 16px 20px !important;
                        background-color: var(--navy) !important;
                        color: #ffffff !important;
                        font-family: 'Inter', sans-serif !important;
                        font-size: 14px !important;
                        font-weight: 600 !important;
                        border-radius: 8px !important;
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25) !important;
                        border: 1px solid var(--navy-dark) !important;
                        z-index: 99999 !important;
                        text-align: center !important;
                    }
                </style>
            </head>
            <body>

                <div class="header-box">Project Cost Allocation JV</div>

                <table id="reportTable" class="display cell-border" style="width:100%">
                    <thead>
                        <tr>
                            <th>GL Code</th>
                            <th>Account</th>
                            <th>Dr</th>
                            <th>Cr</th>
                            <th>Project Segment</th>
                            <th>Employee</th>
                        </tr>
                    </thead>
                    <tfoot>
                        <tr>
                            <th colspan="2" style="text-align:right">Total:</th>
                            <th id="totalDr">0.00</th>
                            <th id="totalCr">0.00</th>
                            <th colspan="2"></th>
                        </tr>
                    </tfoot>
                </table>

                <script>
                    $(document).ready(function() {
                        const currentUrl = window.location.href;

                        $('#reportTable').DataTable({
                            "processing": true,
                            "bProcessing": true,
                            "serverSide": true,
                            "searchDelay": 400,
                            "language": {
                                "processing": "Loading Data..."
                            },
                            "ajax": {
                                "url": currentUrl,
                                "type": "GET",
                                "data": function (d) {
                                    d.action = 'fetch_data';
                                }
                            },
                            "pageLength": 100,
                            "lengthMenu": [10, 25, 50, 100],
                            "columns": [
                                { "title": "GL Code" },
                                { "title": "Account" },
                                { "title": "Dr", "className": "dt-body-right" },
                                { "title": "Cr", "className": "dt-body-right" },
                                { "title": "Project Segment" },
                                { "title": "Employee" }
                            ],
                            "footerCallback": function (row, data, start, end, display) {
                                let api = this.api();

                                let intVal = function (i) {
                                    return typeof i === 'string' ? i.replace(/[\\$,]/g, '') * 1 : typeof i === 'number' ? i : 0;
                                };

                                let drTotal = api.column(2, { page: 'current' }).data().reduce(function (a, b) { return intVal(a) + intVal(b); }, 0);
                                let crTotal = api.column(3, { page: 'current' }).data().reduce(function (a, b) { return intVal(a) + intVal(b); }, 0);

                                $(api.column(2).footer()).html(drTotal.toFixed(2));
                                $(api.column(3).footer()).html(crTotal.toFixed(2));
                            }
                        });
                    });
                </script>
            </body>
            </html>
        `;

        res.write(html);
    };

    /**
     * SuiteQL Core Costing Query (Consolidated by Project Only)
     */
    const getSuiteQLQuery = () => {
        return `
            WITH emp_gross_pay AS (
                SELECT 
                    pp.custrecord_hris_pay_proc_employee AS emp_id,
                    NVL(SUM(pp.custrecord_hris_pay_proc_value), 0) AS calculated_grosspay
                FROM customrecord_hris_pay_process pp
                JOIN customrecord_hris_payroll_component pc 
                    ON pp.custrecord_hris_pay_proc_payroll_compone = pc.id
                WHERE pp.custrecord_hris_pay_proc_pay_month = ?
                  AND pp.custrecord_hris_pay_proc_year = ?
                  AND pp.custrecord_hris_pay_proc_pay_group = ?
                  AND pp.custrecord_hris_pay_proc_company_name = ?
                  AND pp.custrecord_hris_pay_proc_process_type = 1
                  AND pc.custrecord_hris_consider_for_pr_costing = 'T'
                GROUP BY pp.custrecord_hris_pay_proc_employee
            ),
            emp_total_hours AS (
                SELECT
                    a.custrecord_hrms_month_empid AS emp_id,
                    SUM(
                        CASE
                            WHEN d.custrecord_hris_emp_daily_pro_reghrs IS NULL OR d.custrecord_hris_emp_daily_pro_reghrs = 0
                            THEN NVL(d.custrecord_hris_emp_daily_pro_workhrs, 0)
                            ELSE d.custrecord_hris_emp_daily_pro_reghrs
                        END
                    ) AS grand_total_projecthrs
                FROM customrecord_hrms_monthlyattendance a
                JOIN customrecord_njt_emp_daily_atten_ch b
                    ON a.custrecord_hrms_month_empid = b.custrecord_njt_daily_atten_emp
                JOIN customrecord_njt_emp_daily_attendance c
                    ON b.custrecord_njt_emp_daily_parent = c.id
                   AND c.custrecord_njt_emp_atten_month = a.custrecord_hrms_month_monthid
                   AND c.custrecord_njt_emp_atten_year = a.custrecord_hrms_month_yearid
                JOIN customrecord_hris_emp_daily_attend_proje d
                    ON d.custrecord_hris_daily_timesheet_link = b.id
                WHERE a.custrecord_hrms_month_monthid = ?
                  AND a.custrecord_hrms_month_yearid = ?
                  AND a.custrecord_hrms_month_processcompleted = 'T'
                  AND a.custrecord_njt_hrms_monthly_status = 1
                  AND a.custrecord_hrms_month_paygroup = ?
                GROUP BY a.custrecord_hrms_month_empid
            ),
            emp_accruals AS (
                SELECT 
                    custrecord_hris_accural_empid AS emp_id,
                    NVL(SUM(custrecord_hris_accural_amount), 0) AS total_accrued_amount
                FROM customrecord_hris_monthly_accural_trans
                WHERE custrecord_hris_accural_month = ?
                  AND custrecord_hris_accural_year = ?
                  AND custrecord_hris_accural_paygroup = ?
                GROUP BY custrecord_hris_accural_empid
            )
            SELECT
                m.emp_id,
                m.emp_code,
                m.emp_name,
                m.subsidiary_name,
                m.paygroup_name,
                m.projectname,
                m.grosspay,
                m.total_projecthrs,
                m.grand_total_projecthrs,
                m.total_accrued_amount,
                ROUND(m.total_projecthrs * (m.grosspay / NULLIF(m.grand_total_projecthrs, 0)), 2) AS project_costing_amount,
                ROUND(m.total_projecthrs * (m.total_accrued_amount / NULLIF(m.grand_total_projecthrs, 0)), 2) AS provision_costing_amount
            FROM (
                SELECT
                    a.custrecord_hrms_month_empid AS emp_id,
                    emp.custentity_hris_empcode AS emp_code,
                    emp.entityid AS emp_name,
                    sub.name AS subsidiary_name,
                    pg.name AS paygroup_name,
                    BUILTIN.DF(d.custrecord_hris_daily_emp_project_detail) AS projectname,
                    NVL(gp.calculated_grosspay, 0) AS grosspay,
                    SUM(
                        CASE
                            WHEN d.custrecord_hris_emp_daily_pro_reghrs IS NULL OR d.custrecord_hris_emp_daily_pro_reghrs = 0
                            THEN NVL(d.custrecord_hris_emp_daily_pro_workhrs, 0)
                            ELSE d.custrecord_hris_emp_daily_pro_reghrs
                        END
                    ) AS total_projecthrs,
                    NVL(th.grand_total_projecthrs, 0) AS grand_total_projecthrs,
                    NVL(acc.total_accrued_amount, 0) AS total_accrued_amount
                FROM customrecord_hrms_monthlyattendance a
                JOIN customrecord_njt_emp_daily_atten_ch b
                    ON a.custrecord_hrms_month_empid = b.custrecord_njt_daily_atten_emp
                JOIN customrecord_njt_emp_daily_attendance c
                    ON b.custrecord_njt_emp_daily_parent = c.id
                   AND c.custrecord_njt_emp_atten_month = a.custrecord_hrms_month_monthid
                   AND c.custrecord_njt_emp_atten_year = a.custrecord_hrms_month_yearid
                JOIN customrecord_hris_emp_daily_attend_proje d
                    ON d.custrecord_hris_daily_timesheet_link = b.id
                LEFT JOIN emp_gross_pay gp ON gp.emp_id = a.custrecord_hrms_month_empid
                LEFT JOIN emp_total_hours th ON th.emp_id = a.custrecord_hrms_month_empid
                LEFT JOIN emp_accruals acc ON acc.emp_id = a.custrecord_hrms_month_empid
                JOIN employee emp ON emp.id = a.custrecord_hrms_month_empid
                LEFT JOIN subsidiary sub ON sub.id = emp.subsidiary
                LEFT JOIN customrecord_hris_process_groupmaster pg ON pg.id = a.custrecord_hrms_month_paygroup
                WHERE a.custrecord_hrms_month_paygroup = ?
                  AND a.custrecord_hrms_month_monthid = ?
                  AND a.custrecord_hrms_month_yearid = ?
                  AND a.custrecord_hrms_month_processcompleted = 'T'
                  AND a.custrecord_njt_hrms_monthly_status = 1
                  AND emp.subsidiary = ?
                GROUP BY
                    a.custrecord_hrms_month_empid,
                    emp.custentity_hris_empcode,
                    emp.entityid,
                    sub.name,
                    pg.name,
                    d.custrecord_hris_daily_emp_project_detail,
                    BUILTIN.DF(d.custrecord_hris_daily_emp_project_detail),
                    NVL(gp.calculated_grosspay, 0),
                    NVL(th.grand_total_projecthrs, 0),
                    NVL(acc.total_accrued_amount, 0)
                HAVING
                    SUM(
                        CASE
                            WHEN d.custrecord_hris_emp_daily_pro_reghrs IS NULL OR d.custrecord_hris_emp_daily_pro_reghrs = 0
                            THEN NVL(d.custrecord_hris_emp_daily_pro_workhrs, 0)
                            ELSE d.custrecord_hris_emp_daily_pro_reghrs
                        END
                    ) > 0
                    AND NVL(acc.total_accrued_amount, 0) > 0
            ) m
            ORDER BY m.subsidiary_name, m.emp_code, m.projectname
        `;
    };

    return { onRequest };
});