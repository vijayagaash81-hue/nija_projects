/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/search', 'N/format'], (search, format) => {

    /**
     * Field Changed - populates From/To Wage, Month & Year
     */
    const fieldChanged = (context) => {
        debugger;
        const rec = context.currentRecord;
        const sublistId = 'recmachcustrecord_hris_confirm_proc_process_gro';

        if (context.sublistId !== sublistId) {
            return;
        }

        if (context.fieldId !== 'custrecord_hris_confirm_proc_paygroup' &&
            context.fieldId !== 'custrecord_hris_confirm_proc_proctype') {
            return;
        }

        const paygrpID = rec.getCurrentSublistValue({
            sublistId,
            fieldId: 'custrecord_hris_confirm_proc_paygroup'
        });

        const processtype = rec.getCurrentSublistValue({
            sublistId,
            fieldId: 'custrecord_hris_confirm_proc_proctype'
        });

        if (!paygrpID || !processtype) {
            return;
        }

        let wageDetails;

        if (processtype == 1 || processtype === '1') {
            wageDetails = getWageDetails(paygrpID);
        } else if (processtype == 4 || processtype === '4') {
            wageDetails = getWageDetailsot(paygrpID);
        } else {
            return;
        }

        if (!wageDetails) {
            return;
        }

        const parts = wageDetails.split('#');
        const wageMonth   = parts[0];
        const fromDateStr = parts[1];
        const toDateStr   = parts[2];
        const wageYear    = parts[3];

        if (!wageMonth || wageMonth === 'undefined' ||
            !fromDateStr || fromDateStr === 'undefined' ||
            !toDateStr || toDateStr === 'undefined') {

            alert('For this pay group confirm payprocess has been done');
            return;
        }

        const fromDateObj = parseDateSafe(fromDateStr);
        const toDateObj   = parseDateSafe(toDateStr);

        if (fromDateObj) {
            rec.setCurrentSublistValue({
                sublistId,
                fieldId: 'custrecord_hris_confirm_proc_from_wage',
                value: fromDateObj
            });
        }

        if (toDateObj) {
            rec.setCurrentSublistValue({
                sublistId,
                fieldId: 'custrecord_hris_confirm_proc_to_wage',
                value: toDateObj
            });
        }

        if (wageMonth) {
            rec.setCurrentSublistText({
                sublistId,
                fieldId: 'custrecord_hris_confirm_proc_pay_month',
                text: wageMonth
            });
        }

        if (wageYear) {
            rec.setCurrentSublistText({
                sublistId,
                fieldId: 'custrecord_hris_confirm_proc_pay_year',
                text: wageYear
            });
        }
    };

   
/**
 * Validate Line
 * Rule: Line can be added ONLY when CHECKBOX is checked
 * + Duplicate Pay Group restriction
 * + Pay Process existence check
 */
const validateLine = (context) => {
    const rec = context.currentRecord;
    const sublistId = 'recmachcustrecord_hris_confirm_proc_process_gro';

    if (context.sublistId !== sublistId) {
        return true;
    }

    // --------------------------------------------------------
    // 1. CHECKBOX MUST BE CHECKED – otherwise block the line
    // --------------------------------------------------------
    const check = rec.getCurrentSublistValue({
        sublistId,
        fieldId: 'custrecord_hris_confirm_proc_check'
    });

    if (check !== true && check !== 'T') {
        alert('Please check the checkbox to add the line.');
        return false;   // ← Block if checkbox is NOT checked
    }

    // From here onwards checkbox IS checked
    const paygrpID = rec.getCurrentSublistValue({
        sublistId,
        fieldId: 'custrecord_hris_confirm_proc_paygroup'
    });

    const paygrpIDText = rec.getCurrentSublistText({
        sublistId,
        fieldId: 'custrecord_hris_confirm_proc_paygroup'
    });

    const processtype = rec.getCurrentSublistValue({
        sublistId,
        fieldId: 'custrecord_hris_confirm_proc_proctype'
    });

    const d_ToDate = rec.getCurrentSublistValue({
        sublistId,
        fieldId: 'custrecord_hris_confirm_proc_to_wage'
    });

    const d_WageMonth = rec.getCurrentSublistValue({
        sublistId,
        fieldId: 'custrecord_hris_confirm_proc_pay_month'
    });

    const d_WageMonth_Text = rec.getCurrentSublistText({
        sublistId,
        fieldId: 'custrecord_hris_confirm_proc_pay_month'
    });

    // --------------------------------------------------------
    // 2. DUPLICATE PAY GROUP CHECK
    // --------------------------------------------------------
    const lineCount = rec.getLineCount({ sublistId });

    for (let i = 0; i < lineCount; i++) {
        // Skip current line when editing an existing line
        if (context.line !== undefined && context.line === i) {
            continue;
        }

        const existingPaygrp = rec.getSublistValue({
            sublistId,
            fieldId: 'custrecord_hris_confirm_proc_paygroup',
            line: i
        });

        const existingProcessType = rec.getSublistValue({
            sublistId,
            fieldId: 'custrecord_hris_confirm_proc_proctype',
            line: i
        });

        if (String(existingPaygrp) === String(paygrpID) &&
            String(existingProcessType) === String(processtype)) {

            alert('Pay Group "' + paygrpIDText + '" is already added. Duplicate not allowed.');
            return false;
        }
    }

    // --------------------------------------------------------
    // 3. PAY PROCESS EXISTENCE CHECK
    // --------------------------------------------------------
    let yearValue = null;

    if (d_ToDate) {
        let parsedDate = d_ToDate;

        if (typeof d_ToDate === 'string') {
            parsedDate = parseDateSafe(d_ToDate);
        }

        if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
            yearValue = parsedDate.getFullYear();
        }
    }

    if (!yearValue) {
        alert('The Pay Group: ' + paygrpIDText + ', dose not have any year associated with it!..');
        return false;
    }

    const b_Result = processLine(paygrpID, yearValue, d_WageMonth, processtype);

    if (b_Result === true) {
        return true;   // Allow the line
    } else {
        alert('Kindly perform Pay Process for Pay Group: ' + paygrpIDText +
              ', Month: ' + d_WageMonth_Text +
              ' and Year: ' + yearValue +
              ' to add this Record');
        return false;
    }
};
    // ------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------

    const parseDateSafe = (dateStr) => {
        if (!dateStr) return null;

        try {
            return format.parse({
                value: dateStr,
                type: format.Type.DATE
            });
        } catch (e) {
            const parts = String(dateStr).split(/[\/\-\.]/);
            if (parts.length === 3) {
                const day   = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year  = parseInt(parts[2], 10);
                const d = new Date(year, month, day);
                if (!isNaN(d.getTime())) {
                    return d;
                }
            }
            return null;
        }
    };

    const getWageDetails = (paygrpID) => {
        const s = search.create({
            type: 'customrecord_hris_wage_period_details',
            filters: [
                ['custrecord_hris_pay_group', 'anyof', paygrpID],
                'AND',
                ['isinactive', 'is', 'F']
            ],
            columns: [
                search.createColumn({ name: 'internalid', sort: search.Sort.DESC }),
                'custrecord_hris_start_date',
                'custrecord_hris_end_date',
                'custrecord_hris_month',
                'custrecord_hris_year'
            ]
        });

        const result = s.run().getRange({ start: 0, end: 1 });

        if (result && result.length > 0) {
            const r = result[0];
            return [
                r.getText('custrecord_hris_month') || '',
                r.getValue('custrecord_hris_start_date') || '',
                r.getValue('custrecord_hris_end_date') || '',
                r.getText('custrecord_hris_year') || ''
            ].join('#');
        }
        return '';
    };

    const getWageDetailsot = (paygrpID) => {
        const s = search.create({
            type: 'customrecord_hris_lvewage_period_details',
            filters: [
                ['custrecord_hris_lvepay_group', 'anyof', paygrpID],
                'AND',
                ['isinactive', 'is', 'F']
            ],
            columns: [
                search.createColumn({ name: 'internalid', sort: search.Sort.DESC }),
                'custrecord_hris_lvestart_date',
                'custrecord_hris_lveend_date',
                'custrecord_hris_lvemonth',
                'custrecord_hris_lveyear'
            ]
        });

        const result = s.run().getRange({ start: 0, end: 1 });

        if (result && result.length > 0) {
            const r = result[0];
            return [
                r.getText('custrecord_hris_lvemonth') || '',
                r.getValue('custrecord_hris_lvestart_date') || '',
                r.getValue('custrecord_hris_lveend_date') || '',
                r.getText('custrecord_hris_lveyear') || ''
            ].join('#');
        }
        return '';
    };

    const processLine = (paygrpID, yearValue, d_WageMonth, processtype) => {
        let yearInternalId = null;

        const yearSearch = search.create({
            type: 'customlist_hris_year_master',
            filters: [
                ['name', 'is', String(yearValue)]
            ],
            columns: ['internalid']
        });

        const yearResult = yearSearch.run().getRange({ start: 0, end: 1 });

        if (yearResult && yearResult.length > 0) {
            yearInternalId = yearResult[0].getValue('internalid');
        }

        if (!yearInternalId) {
            return false;
        }

        const processSearch = search.create({
            type: 'customrecord_hris_pay_process',
            filters: [
                ['custrecord_hris_pay_proc_process_type', 'anyof', processtype],
                'AND',
                ['custrecord_hris_pay_proc_pay_group', 'anyof', paygrpID],
                'AND',
                ['custrecord_hris_pay_proc_pay_month', 'anyof', d_WageMonth],
                'AND',
                ['custrecord_hris_pay_proc_year', 'anyof', yearInternalId]
            ],
            columns: ['internalid']
        });

        const processResult = processSearch.run().getRange({ start: 0, end: 1 });

        return !!(processResult && processResult.length > 0);
    };

    return {
        fieldChanged,
        validateLine
    };
});