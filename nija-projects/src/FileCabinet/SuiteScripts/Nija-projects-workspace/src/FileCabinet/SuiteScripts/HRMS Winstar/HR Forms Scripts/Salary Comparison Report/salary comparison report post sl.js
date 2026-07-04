/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 * Script Name : hris_salary_revision_report_sl.js
 * Description : Full-Screen Salary Revision Comparison Report with DataTables
 */

define(
    ['N/query', 'N/ui/serverWidget', 'N/log'],
    (query, serverWidget, log) => {

    /**
     * The onRequest function is the entry point for the Suitelet.
     */
    const onRequest = (scriptContext) => {
        const { request, response } = scriptContext;

        // Only allow GET requests for viewing the report
        if (request.method !== 'GET') return;

        try {
            // 1. Capture parameters from the URL (Employee, Subsidiary, Pay Group)
            const employeeId = request.parameters.custparam_empid;
            const subId      = request.parameters.custparam_sub;
            const pgId       = request.parameters.custparam_pg;

            // Stop if no filters are provided to prevent loading an empty report
            if (!employeeId && !subId && !pgId) {
                return response.write('Error: Please provide at least one filter.');
            }

            // 2. Fetch the header information (Subsidiary, Designation, etc.) using SuiteQL
            const empDetails = getEmployeeDetails(employeeId);

            // 3. Fetch the actual salary revision data from the custom records
            const reportData = getSalaryData(employeeId, subId, pgId);

            // If no data is found, show a message to the user
            if (reportData.length === 0) {
                return response.write('No compensation records found for the selected criteria.');
            }

            // 4. Create the NetSuite Form
            const form = serverWidget.createForm({ title: 'Salary Revision Comparison Report' });

            // Add the Export to Excel button
            form.addButton({
                id          : 'custpage_export_excel',
                label       : 'Export to Excel',
                functionName: 'exportToExcel'
            });

            // 5. Add the "Employee Details" Header field group
            const empGroup = form.addFieldGroup({
                id   : 'custpage_grp_empdetails',
                label: 'Employee Details'
            });

            // Helper function to add non-editable fields to the top header
            const addField = (id, label, val) => {
                let f = form.addField({ id: id, type: serverWidget.FieldType.TEXT, label: label, container: 'custpage_grp_empdetails' });
                f.defaultValue = val || '-';
                f.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            };

            addField('custpage_subsidiary', 'SUBSIDIARY', empDetails.subsidiary);
            addField('custpage_paygroup', 'PAY GROUP', empDetails.paygroup);
            addField('custpage_designation', 'DESIGNATION', empDetails.designation);
            addField('custpage_empcode', 'EMPLOYEE CODE', empDetails.empcode);

            // 6. Add the INLINE HTML field to hold the custom Full-Width table
            const htmlField = form.addField({
                id   : 'custpage_report_html',
                type : serverWidget.FieldType.INLINEHTML,
                label: ' '
            });

            // Call the function that builds the HTML, CSS, and JS payload
            htmlField.defaultValue = generateMultiRowTable(reportData);

            // Send the generated form back to the browser
            response.writePage(form);

        } catch (e) {
            log.error('Suitelet Error', e);
            response.write('Error generating report: ' + e.message);
        }
    };

    /**
     * Fetches header information using SuiteQL
     */
    function getEmployeeDetails(employeeId) {
        if (!employeeId) return { subsidiary: '-', paygroup: '-', designation: '-', empcode: '-' };
        const sql = `
            SELECT
                BUILTIN.DF(E.subsidiary)                       AS subsidiary,
                BUILTIN.DF(E.custentity_hris_emppayrollgroup)  AS paygroup,
                BUILTIN.DF(E.custentity_hris_empdesignation)   AS designation,
                E.entityid                                      AS empcode
            FROM employee E WHERE E.id = ?
        `;
        const results = query.runSuiteQL({ query: sql, params: [employeeId] }).asMappedResults();
        return results.length > 0 ? results[0] : { subsidiary: '-', paygroup: '-', designation: '-', empcode: '-' };
    }

    /**
     * Fetches Compensation History and pivots components into columns
     */
    function getSalaryData(employeeId, subId, pgId) {
        let sql = `
            SELECT
                A.id AS rev_id,
                E.entityid AS emp_code,
                BUILTIN.DF(A.custrecord_hris_employee_name_) AS emp_name,
                BUILTIN.DF(B.custrecord_hris_comhis_payrollcomponent) AS component,
                B.custrecord_hris_comhis_payrollseqno AS seq_no,
                TO_CHAR(A.custrecord_hris_effective_from_date, 'DD-MON-YYYY') AS eff_date,
                NVL(B.custrecord_hris_comhis_prev_monthlyamt, 0) AS prev_amt,
                NVL(B.custrecord_hris_comhis_monthlyamount, 0) AS revised_amt
            FROM
                customrecord_hris_employee_compensation A
            INNER JOIN
                customrecord_hris_compen_history_earning B ON A.id = B.custrecord_hris_comhis_compenhistoryid
            INNER JOIN
                employee E ON E.id = A.custrecord_hris_employee_name_
        `;

        let filters = [];
        let params  = [];
        if (employeeId) { filters.push(`A.custrecord_hris_employee_name_ = ?`); params.push(employeeId); }
        if (subId) { filters.push(`E.subsidiary = ?`); params.push(subId); }
        if (pgId) { filters.push(`E.custentity_hris_emppayrollgroup = ?`); params.push(pgId); }

        if (filters.length > 0) sql += " WHERE " + filters.join(" AND ");
        sql += ` ORDER BY A.custrecord_hris_effective_from_date DESC, B.custrecord_hris_comhis_payrollseqno ASC`;

        return query.runSuiteQL({ query: sql, params: params }).asMappedResults();
    }

    /**
     * Generates the Full-Width Table with break-out Logic
     */
    function generateMultiRowTable(results) {
        let compMap = [];
        let uniqueNames = [];
        let rows = {};
        let revisionIds = [];

        // Organize the flat data into an object grouped by Revision ID
        results.forEach(row => {
            const rid = row.rev_id;
            if (!uniqueNames.includes(row.component)) {
                uniqueNames.push(row.component);
                compMap.push({ name: row.component, seq: parseInt(row.seq_no) || 999 });
            }
            if (!rows[rid]) {
                rows[rid] = { code: row.emp_code, name: row.emp_name, date: row.eff_date || 'N/A', components: {}, totalPrev: 0, totalRevised: 0 };
                revisionIds.push(rid);
            }
            rows[rid].components[row.component] = parseFloat(row.revised_amt) || 0;
            rows[rid].totalPrev += parseFloat(row.prev_amt) || 0;
            rows[rid].totalRevised += parseFloat(row.revised_amt) || 0;
        });

        compMap.sort((a, b) => a.seq - b.seq);
        const sortedComponents = compMap.map(c => c.name);
        const totalCols = 4 + sortedComponents.length + 4;

        // Build the rows of the table
        let tbodyHtml = '';
        revisionIds.forEach((rid, index) => {
            const emp = rows[rid];
            const increment = emp.totalRevised - emp.totalPrev;
            const pct = emp.totalPrev > 0 ? ((increment / emp.totalPrev) * 100).toFixed(2) : '0';
            const compCells = sortedComponents.map(comp => `<td class="amt-cell">${fmt(emp.components[comp] || 0)}</td>`).join('');

            tbodyHtml += `
                <tr>
                    <td style="width:30px">${index + 1}</td>
                    <td>${emp.code}</td>
                    <td class="emp-name-cell">${emp.name}</td>
                    <td>${emp.date}</td>
                    ${compCells}
                    <td class="amt-cell summary-cell">${fmt(emp.totalPrev)}</td>
                    <td class="amt-cell summary-cell">${fmt(emp.totalRevised)}</td>
                    <td class="amt-cell increment-text">+ ${fmt(increment)}</td>
                    <td class="summary-cell">${pct}%</td>
                </tr>`;
        });

        // HTML Content with CSS and JS "Full Screen" Hack
        return `
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
    
    /* Force NetSuite's outer containers to span the full page width */
    #custpage_report_html_val { width: 100% !important; padding: 0 !important; margin: 0 !important; }
    .uir-field-wrapper, .uir-form-content-root, .uir-page-body { width: 100% !important; max-width: 100% !important; padding: 0 !important; }

    .rpt-container { 
        width: 100% !important; 
        font-family: "Roboto", sans-serif; 
        margin-top: 15px; 
    }

    .payroll-table { 
        width: 100% !important; 
        border-collapse: collapse; 
        font-size: 11px; 
        border: 1px solid #103b6d;
    }

    .payroll-table th { 
        background-color: #103b6d !important; 
        color: #ffffff !important; 
        padding: 12px 4px; 
        border: 1px solid #ffffff; 
        text-align: center !important; 
        text-transform: uppercase;
    }

    .title-header { 
        font-size: 18px !important; 
        background-color: #0d2e54 !important; 
        padding: 15px !important; 
        text-align: center !important; 
    }

    .payroll-table td { border: 1px solid #d1d9e6; padding: 8px 6px; text-align: center; color: #333; }
    .emp-name-cell { font-weight: bold; color: #103b6d; text-align: left !important; background-color: #f9f9f9 !important; }
    .amt-cell { text-align: right !important; }
    .summary-cell { background-color: #f1f4f8 !important; font-weight: bold; color: #103b6d !important; }
    .increment-text { color: #28a745 !important; font-weight: bold; }

    /* Override DataTables formatting to keep it full screen */
    .dataTables_wrapper { width: 100% !important; padding: 10px; box-sizing: border-box; }
    .dataTables_filter input { border: 1px solid #103b6d; padding: 5px; border-radius: 4px; }
</style>

<div class="rpt-container">
    <table class="payroll-table" id="salaryTable">
        <thead>
            <tr><th colspan="${totalCols}" class="title-header">SALARY REVISION COMPARISON REPORT</th></tr>
            <tr>
                <th style="width:30px">SN</th>
                <th>EMP CODE</th>
                <th>EMPLOYEE NAME</th>
                <th>EFFECTIVE DATE</th>
                ${sortedComponents.map(comp => `<th>${comp}</th>`).join('')}
                <th style="background-color:#0d2e54 !important">TOTAL PREVIOUS</th>
                <th style="background-color:#0d2e54 !important">TOTAL REVISED</th>
                <th style="background-color:#0d2e54 !important">INCREMENT</th>
                <th style="background-color:#0d2e54 !important">%</th>
            </tr>
        </thead>
        <tbody>${tbodyHtml}</tbody>
    </table>
</div>

<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
<script>
    jQuery(document).ready(function () {
        // BREAKOUT SCRIPT: Loop through all parent elements of our table and force them to 100% width.
        // This removes the gray/white padding NetSuite puts on sides of the page.
        jQuery('#custpage_report_html_val').parents().each(function() {
            var $this = jQuery(this);
            if ($this.is('td') || $this.is('table') || $this.is('div')) {
                $this.css({'width': '100%', 'max-width': '100%', 'padding': '0'});
            }
        });

        // Initialize DataTable with full-screen settings
        jQuery('#salaryTable').DataTable({
            autoWidth: false,
            paging: true,
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'All']],
            language: { search: 'Quick Filter:' },
            columnDefs: [{ width: '30px', targets: 0 }] // Keeps the SN column narrow
        });
    });

    /**
     * Logic for exporting the current table to Excel
     */
    function exportToExcel() {
        var table = document.getElementById('salaryTable');
        var excelFile = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='UTF-8'></head><body>" + table.outerHTML + "</body></html>";
        var blob = new Blob([excelFile], { type: 'application/vnd.ms-excel' });
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url; link.download = 'Salary_Revision_Report.xls';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }
</script>`;
    }

    /**
     * Number Formatter
     */
    function fmt(v) {
        if (!v || v === 0) return '-';
        return parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    return { onRequest };
});