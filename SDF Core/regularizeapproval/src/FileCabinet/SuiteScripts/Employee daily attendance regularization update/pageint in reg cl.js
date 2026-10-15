/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/format'], function (currentRecord, format) {

    function pageInit(context) {
      debugger;
        try {
            var rec = currentRecord.get();

            // Get today's date
            var today = new Date();

            // Format date as DD/MM/YYYY (with leading zeros if necessary)
            var formattedDate = formatDate(today);

            // Convert formattedDate to a Date object using NetSuite's formatDate API
            var nsFormattedDate = format.parse({value: formattedDate, type: format.Type.DATE});

            // Set the current date to 'custpage_fromdate' and 'custpage_todate'
            rec.setValue({
                fieldId: 'custpage_fromdate',
                value: nsFormattedDate,
                ignoreFieldChange: true
            });

            rec.setValue({
                fieldId: 'custpage_todate',
                value: nsFormattedDate,
                ignoreFieldChange: true
            });

            console.log('Dates set successfully to: ' + formattedDate);

        } catch (e) {
            console.error('Error in pageInit:', e);
        }
    }

    // Function to format date as DD/MM/YYYY with leading zeros if necessary
    function formatDate(dateObj) {
        var day = dateObj.getDate(); // Get day
        var month = dateObj.getMonth() + 1; // Get month (January = 0, so +1)
        var year = dateObj.getFullYear();

        // Add leading zeros if necessary (e.g., "8" to "08")
        if (day < 10) {
            day = '0' + day;
        }

        if (month < 10) {
            month = '0' + month;
        }

        return day + '/' + month + '/' + year;
    }

    return {
        pageInit: pageInit
    };
});
