/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/currentRecord', 'N/format','N/log'], 
function(currentRecord, format,log) {

    /**
     * Function to be executed when a field is changed by a user or client side trigger.
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.fieldId - Field name that was changed
     */
    function fieldChanged(context) {
        try {
            var recordObj = context.currentRecord;

            // Trigger when Resumption Date is modified
            if (context.fieldId === 'custrecord_dm_rejoin_date') {
                
                var expReturnDateStr = recordObj.getValue('custrecord_dm_expec_rejoin_date');
                var resumptionDateStr = recordObj.getValue('custrecord_dm_rejoin_date');

                // Proceed only if both date parameters have values
                if (expReturnDateStr && resumptionDateStr) {
                    
                    // Convert NetSuite date field entries to JS Date Objects
                    var expReturnDate = new Date(expReturnDateStr);
                    var resumptionDate = new Date(resumptionDateStr);

                    // Calculate the difference in milliseconds
                    var timeDiff = resumptionDate.getTime() - expReturnDate.getTime();
                    
                    // Convert milliseconds to full calendar days
                    var daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                    // If daysDiff > 0 it's a delay; if 0 or negative, they returned on-time/early
                  //  var totalDelayDays = daysDiff > 0 ? daysDiff : 0;
                  var totalDelayDays=daysDiff+1

                    recordObj.setValue({
                        fieldId: 'custrecord_dm_delaydays',
                        value: totalDelayDays,
                        ignoreFieldChange: true // Prevents unintended recursive field evaluation loop
                    });

                    log.debug({
                        title: 'Delay Calculation Complete',
                        details: 'Expected: ' + expReturnDateStr + ' | Actual: ' + resumptionDateStr + ' | Delay: ' + totalDelayDays + ' Days'
                    });

                } else {
                    // Clear the field or default to 0 if one of the dates is missing
                    recordObj.setValue({
                        fieldId: 'custrecord_dm_delaydays',
                        value: 0,
                        ignoreFieldChange: true
                    });
                }
            }

        } catch (e) {
            log.error({
                title: 'Error in fieldChanged Event',
                details: e.message || e
            });
        }
    }

    /**
     * Placeholder entry point for Page Init if initialization configuration is needed later
     */
    function pageInit(context) {
        // Left blank intentionally
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});