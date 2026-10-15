/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/log', 'N/currentRecord','N/query'], function (log, currentRecord,query) {

   function pageInit(scriptContext) {
        debugger;
    var currentRecordObj = scriptContext.currentRecord;
    var statusQuery = "select custrecord_hris_mr_sts,BUILTIN.DF(custrecord_hris_mr_sts)as name from customrecord_hris_mr_status_bar_rec where id =5";
    var queryResults = query.runSuiteQL({
        query: statusQuery
    });
    var records = queryResults.asMappedResults();
    var mrStatus = currentRecordObj.getField('custpage_mr_status');
    mrStatus.removeSelectOption({ value: null });
    if (records.length > 0) {
        for (var r = 0; r < records.length; r++) {
            var record = records[r];
            var name = record.name;
            var id = record.custrecord_hris_mr_sts;

            mrStatus.insertSelectOption({
                value: id,
                text: name,
                isSelected: true
            });


        }
    }
    var status = currentRecordObj.getValue('custpage_mr_status');
    if (status == 2) {
        refreshPayProcess();
    };
  }

function refreshPayProcess()
  {
     // var Refreshtime=10000;  
      alert('Please wait for some times Employee Attendance Regularization in progressing.....');
      location.reload(true);
  
  }
    function fieldChanged(context) {
        var sublistId = 'employeesheet'; // Sublist ID
        var currentRecordObj = context.currentRecord;
        var fieldId = context.fieldId;
        var lineNumber = context.line;

        // Check if the changed field is custpage_regnor_in or custpage_regnor_out
        if ((fieldId === 'custpage_regnor_in' || fieldId === 'custpage_regnor_out') && context.sublistId === sublistId) {
            debugger;

            // Get regular time-in and time-out values
            var regIn = currentRecordObj.getSublistValue({ sublistId: sublistId, fieldId: 'custpage_regnor_in', line: lineNumber });
            var regOut = currentRecordObj.getSublistValue({ sublistId: sublistId, fieldId: 'custpage_regnor_out', line: lineNumber });

            // Convert timeofday fields to "HH:mm" format
            regIn = convertTo24HourFormat(regIn);
            regOut = convertTo24HourFormat(regOut);

            log.debug('Formatted Time In', regIn);
            log.debug('Formatted Time Out', regOut);

            // Calculate total working hours
            var totalHours = calculateWorkHours(regIn, regOut);
            log.debug('Total Hours Calculated', totalHours);

            // Set total hours if valid
            if (totalHours !== null) {
                try {
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custpage_total',
                        line: lineNumber,
                        value: totalHours
                    });
                    log.debug('Total Hours Set Successfully', totalHours);
                } catch (e) {
                    log.error('Error Setting Total Hours', e.toString());
                }
            }
        }

        // Check if the changed field is custpage_regnor_ot_in or custpage_regnor_ot_out
        if ((fieldId === 'custpage_regnor_ot_in' || fieldId === 'custpage_regnor_ot_out') && context.sublistId === sublistId) {
            debugger;

            // Get overtime-in and overtime-out values
            var otIn = currentRecordObj.getSublistValue({ sublistId: sublistId, fieldId: 'custpage_regnor_ot_in', line: lineNumber });
            var otOut = currentRecordObj.getSublistValue({ sublistId: sublistId, fieldId: 'custpage_regnor_ot_out', line: lineNumber });

            // Convert timeofday fields to "HH:mm" format
            otIn = convertTo24HourFormat(otIn);
            otOut = convertTo24HourFormat(otOut);

            log.debug('Formatted OT In', otIn);
            log.debug('Formatted OT Out', otOut);

            // Calculate overtime hours
            var otHours = calculateWorkHours(otIn, otOut);
            log.debug('OT Hours Calculated', otHours);

            // Set overtime hours if valid
            if (otHours !== null) {
                try {
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custpage_othrs',
                        line: lineNumber,
                        value: otHours
                    });
                    log.debug('OT Hours Set Successfully', otHours);
                } catch (e) {
                    log.error('Error Setting OT Hours', e.toString());
                }
            }
        }
    }

    /**
     * Function to convert NetSuite timeofday field to "HH:mm" format
     */
    function convertTo24HourFormat(timeValue) {
        if (!timeValue) {
            log.debug('Error', 'Invalid time value:', timeValue);
            return null;
        }

        // Check if the value is a Date object (NetSuite timeofday fields are Date objects)
        if (Object.prototype.toString.call(timeValue) === "[object Date]") {
            var hours = timeValue.getHours();
            var minutes = timeValue.getMinutes();

            // Format hours and minutes as "HH:mm"
            return (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes);
        }

        return timeValue; // Return as is if it's already a valid string
    }

    /**
     * Function to calculate total hours between two time values
     */
    function calculateWorkHours(timeIn, timeOut) {
        if (!timeIn || !timeOut) {
            log.debug('Error', 'Time In or Time Out is missing');
            return null;
        }

        // Convert time strings to Date objects
        var timeInDate = new Date('1970-01-01T' + timeIn + ':00Z'); // Adding seconds for proper parsing
        var timeOutDate = new Date('1970-01-01T' + timeOut + ':00Z');

        // Calculate the time difference in milliseconds
        var diffMs = timeOutDate - timeInDate;

        // Convert milliseconds to hours and minutes
        var hours = Math.floor(diffMs / (1000 * 60 * 60));
        var minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        // Format result as "H.MM"
        var formattedWorkHours = hours + '.' + (minutes < 10 ? '0' + minutes : minutes);

        return formattedWorkHours;
    }

    /**
     * Return script functions
     */
    return {
        fieldChanged: fieldChanged,
     // pageInit:pageInit,
      //refreshPayProcess:refreshPayProcess
      
    };
});
