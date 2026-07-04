/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/https', 'N/record', 'N/log'], function (https, record, log) {

    function afterSubmit(context) {
        if (context.type === context.UserEventType.DELETE) {
            try {

                var recordId = context.oldRecord.id;
                log.debug("recordId", recordId);
                //var recordType = context.oldRecord.type;

             /*    var url = 'https://mobapp.nijatech.com:5602/api/netsuite/Compoff';
                var token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InB1cmVlc3NAZ21haWwuY29tIiwiaWF0IjoxNzUyNDk3MDE2LCJleHAiOjE3ODQwMzMwMTZ9.-ALyiD36G9cCeZmK2plY2QmHYdXyuHAvuNt5CP3KCzI';

                var payload = {
                    type: "Compoff",
                    internalid: recordId
                };
                log.debug("payload", payload);

                // Send the POST request
                var response = https.post({
                    url: url,
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                });
 */

                  var token='';
            var authData = {
    "email": "winstar@gmail.com",
    "password": "winstar@123"
            };
            var authJsonData = JSON.stringify(authData);
            log.emergency('authJsonData',authJsonData)

            var authResponse = https.post({
                url: "https://mobapp.nijatech.com:6000/api/netsuite/gettoken", // Update with your actual login API URL
                headers: {
                    "Content-Type": "application/json"
                },
                body: authJsonData
            });
            log.emergency('authResponse',authResponse)
            var authBody = JSON.parse(authResponse.body);

             token = authBody.jwtoken;
            log.emergency('Token',token);

      //  var url = 'https:// mobapp.nijatech.com:5500/api/netsuite/updateattendance';
        var url ='https://mobapp.nijatech.com:6000/api/netsuite/Compoff'
        var headers = {
            'Content-Type': 'application/json',
           // 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhbGFAZ21haWwuY29tIiwiaWF0IjoxNzcxNTY2MTQxLCJleHAiOjIwODcxNDIxNDF9.TFTUIoPmKyhO5rUC-C2s-jVWh0gl1EIhv7zz-uCLXxw'
              "Authorization": "Bearer " + token,
        };

        

        try {
            var response = https.post({
                url: url,
                headers: headers,
                body: JSON.stringify(payload)
            });
            log.debug("API Response", response.body);
            return { code: response.code, body: response.body };
        } catch (e) {
            log.error("Error Sending to API", e.message);
            return { code: e.code || 500, body: e.message };
        }

            /*     log.audit({
                    title: 'Record Deletion Notified',
                    details: 'Response: ' + response.body
                });
 */
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

function sendToAPI(payload) {
        var token='';
            var authData = {
    "email": "winstar@gmail.com",
    "password": "winstar@123"
            };
            var authJsonData = JSON.stringify(authData);
            log.emergency('authJsonData',authJsonData)

            var authResponse = https.post({
                url: "https://mobapp.nijatech.com:6000/api/netsuite/gettoken", // Update with your actual login API URL
                headers: {
                    "Content-Type": "application/json"
                },
                body: authJsonData
            });
            log.emergency('authResponse',authResponse)
            var authBody = JSON.parse(authResponse.body);

             token = authBody.jwtoken;
            log.emergency('Token',token);

      //  var url = 'https:// mobapp.nijatech.com:5500/api/netsuite/updateattendance';
        var url ='https://mobapp.nijatech.com:6000/api/netsuite/updatereqularization'
        var headers = {
            'Content-Type': 'application/json',
           // 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhbGFAZ21haWwuY29tIiwiaWF0IjoxNzcxNTY2MTQxLCJleHAiOjIwODcxNDIxNDF9.TFTUIoPmKyhO5rUC-C2s-jVWh0gl1EIhv7zz-uCLXxw'
              "Authorization": "Bearer " + token,
        };

        

        try {
            var response = https.post({
                url: url,
                headers: headers,
                body: JSON.stringify(payload)
            });
            log.debug("API Response", response.body);
            return { code: response.code, body: response.body };
        } catch (e) {
            log.error("Error Sending to API", e.message);
            return { code: e.code || 500, body: e.message };
        }
    }