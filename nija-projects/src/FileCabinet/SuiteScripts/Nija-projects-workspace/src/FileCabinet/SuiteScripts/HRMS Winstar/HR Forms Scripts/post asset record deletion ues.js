/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/https', 'N/record', 'N/log'], function (https, record, log) {

    function afterSubmit(context) {
        if (context.type === context.UserEventType.DELETE) {
            try {
                
                var recordId = context.oldRecord.id;
                log.debug("recordId",recordId);
                //var recordType = context.oldRecord.type;

                var url = 'https://mobapp.nijatech.com:5607/api/netsuite/deleterecords';
                var bearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFsZmFyZWV0aGEiLCJpYXQiOjE3NzUxOTQ5MDUsImV4cCI6MTgwNjczMDkwNX0.ge5p67-jWkNjYlrq-CMUrRTafbtm0si_gLYwUhaqQIQ';

                var payload = {
                    
                    type: "Asset",
                    internalid: recordId
                };
                log.debug("payload",payload);

                // Send the POST request
                var response = https.post({
                    url: url,
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + bearerToken
                    }
                });

                // Log the response
                log.audit({
                    title: 'Record Deletion Notified',
                    details: 'Response: ' + response.body
                });

            } catch (error) {
                log.error({
                    title: 'Error Sending Deletion Notification',
                    details: error
                });
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
