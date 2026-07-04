/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog'], function (currentRecord, dialog) {

    /* function validateLine(context) {
        try {
            var rec = context.currentRecord;

            // Get the value of "custrecord_hris_loan_emi_end_date" from the main record
            var emiEndDate = rec.getValue('custrecord_hris_loan_emi_end_date');
            if (!emiEndDate) return true;

            emiEndDate = new Date(emiEndDate);

            // Get the values from the sublist
            var sublistId = 'recmachcustrecord_hris_loan_alloc_link';
            var startDate = rec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_hris_loan_alloc_startdate'
            });
            var endDate = rec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_hris_loan_alloc_enddate'
            });

            if (!startDate) return true;

            startDate = new Date(startDate);
            endDate = new Date(endDate);

            // Check if start date is less than emi end date
            if (startDate > emiEndDate) {
                dialog.alert({
                    title: 'Invalid Date',
                    message: 'The loan allocation start date cannot be greather than the EMI end date.'
                });
                return false; // Prevent the user from saving the line
            }

            // Ensure both start and end dates are the same
            if (startDate.getTime() !== endDate.getTime()) {
                dialog.alert({
                    title: 'Date Mismatch',
                    message: 'The loan allocation start date and end date must be the same.'
                });
                return false; // Prevent the user from saving the line
            }
            return true;
        } catch (e) {
            console.error('Error in validateLine:', e.message);
            return false;
        }
    } */
  function validateLine(context) {
    try {
        var rec = context.currentRecord;

        // Get the value of "custrecord_hris_loan_emi_end_date" from the main record
        var emiEndDate = rec.getValue('custrecord_hris_loan_emi_end_date');
        if (!emiEndDate) return true;

        emiEndDate = new Date(emiEndDate);

        // Get the value of "custrecord_hris_loan_outstanding_amount"
        var outstandingAmount = rec.getValue('custrecord_hris_loan_outstanding_amount');
        if (outstandingAmount === 0) {
            dialog.alert({
                title: 'Outstanding Amount Zero',
                message: 'The loan outstanding amount is zero...'
            });
            return false; // Prevent the user from proceeding
        }

        // Get the values from the sublist
        var sublistId = 'recmachcustrecord_hris_loan_alloc_link';
        var startDate = rec.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord_hris_loan_alloc_startdate'
        });
        var endDate = rec.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord_hris_loan_alloc_enddate'
        });

        if (!startDate) return true;

        startDate = new Date(startDate);
        endDate = new Date(endDate);

       /*  // Check if start date is less than emi end date
        if (startDate > emiEndDate) {
            dialog.alert({
                title: 'Invalid Date',
                message: 'The loan allocation start date cannot be greater than the EMI end date.'
            });
            return false; // Prevent the user from saving the line
        }

        // Ensure both start and end dates are the same
        if (startDate.getTime() !== endDate.getTime()) {
            dialog.alert({
                title: 'Date Mismatch',
                message: 'The loan allocation start date and end date must be the same.'
            });
            return false; // Prevent the user from saving the line
        } */
        return true;
    } catch (e) {
        console.error('Error in validateLine:', e.message);
        return false;
    }
}


    function fieldChanged(context) {
        try {
            var rec = context.currentRecord;

            // Ensure the change happens only in the relevant sublist and field
            if (context.sublistId === 'recmachcustrecord_hris_loan_alloc_link' &&
                context.fieldId === 'custrecord_hris_loan_alloc_startdate') {
                
                // Get the updated start date
                var startDate = rec.getCurrentSublistValue({
                    sublistId: context.sublistId,
                    fieldId: context.fieldId
                });

                if (startDate) {
                    // Automatically set the start date as the end date
                    rec.setCurrentSublistValue({
                        sublistId: context.sublistId,
                        fieldId: 'custrecord_hris_loan_alloc_enddate',
                        value: startDate
                    });
                }
            }

        } catch (e) {
            console.error('Error in fieldChanged:', e.message);
        }
    }
  function saveRecord(context) {
        var rec = context.currentRecord;

        // Get the header field 'custrecord_hris_loan_paid_amount'
        var paidAmount = rec.getValue('custrecord_hris_loan_amount');
        log.debug('Header Field', 'Paid Amount: ' + paidAmount);

        // Calculate the sum of the sublist field 'custrecord_hris_loan_alloc_paidamount'
        var sublistId = 'recmachcustrecord_hris_loan_alloc_link';
        var sublistLineCount = rec.getLineCount({ sublistId: sublistId });
        log.debug('Sublist Information', 'Number of lines in sublist: ' + sublistLineCount);

        var totalPaidAmount = 0;

        for (var i = 0; i < sublistLineCount; i++) {
            var allocPaidAmount = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_hris_loan_alloc_paidamount',
                line: i,
            });

            // Log each line value
            log.debug('Sublist Line Details', 'Line: ' + (i + 1) + ', Allocated Paid Amount: ' + allocPaidAmount);

            totalPaidAmount += parseFloat(allocPaidAmount) || 0;
        }

        // Log the total sum of the sublist field
        log.debug('Sublist Total', 'Total Allocated Paid Amount: ' + totalPaidAmount);

         // Validate the total allocated paid amount only if paidAmount has a value
    if (paidAmount) {
        if (totalPaidAmount > paidAmount) {
            //alert('Validation Error', 'Total Allocated Paid Amount exceeds the Loan Paid Amount.');
            alert('The total allocated paid amount exceeds the Loan Paid Amount. Please adjust the values.');
            return false; // Prevent the record from being saved
        }
    } else {
        log.debug('Validation Skipped', 'Paid Amount is empty. No validation performed.');
    }

    log.debug('Validation Passed', 'Total Allocated Paid Amount is within the Loan Paid Amount.');
    return true; // Allow the record to be saved
}
    return {
        validateLine: validateLine,
        fieldChanged: fieldChanged,
         saveRecord:saveRecord
         //lineInit:lineInit
    };
});
