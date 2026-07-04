/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/https', 'N/email', 'N/runtime', 'N/log'], 
(record, https, email, runtime, log) => {

    /**
     * Get Input Data from Script Parameter
     */
    const getInputData = () => {
        try {
            const scriptObj = runtime.getCurrentScript();

            // Get payload string
            const payloadStr = scriptObj.getParameter({
                name: 'custscript_mr_mobile_payload'
            });

            // Validate payload
            if (!payloadStr) {
                log.error('Input Error', 'No payload parameter found');
                return [];
            }

            // Parse JSON payload
            const payload = JSON.parse(payloadStr);

            log.debug('MR Input Data Count', payload.data.length);

            return payload.data;

        } catch (e) {
            log.error('Error in getInputData', e.message);
            return [];
        }
    };


    /**
     * Map Function - Runs per employee
     */
    const map = (context) => {

        // Get script parameters again (Map scope)
        const scriptObj = runtime.getCurrentScript();
        const payloadStr = scriptObj.getParameter({
            name: 'custscript_mr_mobile_payload'
        });

        const payload = JSON.parse(payloadStr);

        // Flags & config
        const targetAccess = (payload.targetAccess === 'T');
        const sendEmailFlag = (payload.sendMail === 'T');
        const authorId = payload.author;
        const token = payload.token;

        // Employee data
        const emp = JSON.parse(context.value);

        try {

            // ==============================
            // A. Prepare External API Payload
            // ==============================
            const apiPayload = {
                nsId: parseInt(emp.id),
                mobileemail: emp.email,
                mobileusername: emp.user,
                mobilepassword: "123456",
                mobileaccess: targetAccess
            };

            log.debug(`Syncing Employee ID ${emp.id}`, apiPayload);


            // ==============================
            // B. Call External API
            // ==============================
            const apiRes = https.post({
                url: "https://mobapp.nijatech.com:6000/api/netsuite/updatelogindetails",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(apiPayload)
            });


            // ==============================
            // C. Handle API Response
            // ==============================
            let apiStatusMsg = "";
            let isApiSuccess = false;
            let apiResponseBody;

            try {
                apiResponseBody = JSON.parse(apiRes.body);
            } catch (e) {
                apiResponseBody = {
                    status: false,
                    message: "Invalid JSON response from API"
                };
            }

            if (apiRes.code === 200 && apiResponseBody.status !== false) {
                isApiSuccess = true;
                apiStatusMsg = targetAccess ? "Success" : "Disabled Success";
            } else {
                isApiSuccess = false;
                apiStatusMsg = "API Error: " + (apiResponseBody.message || ("HTTP " + apiRes.code));

                log.error(`API Failure for Employee ${emp.id}`, apiResponseBody);
            }


            // ==============================
            // D. Load Employee Record
            // ==============================
            const empRecord = record.load({
                type: record.Type.EMPLOYEE,
                id: emp.id,
                //isDynamic: true
            });


            // ==============================
            // E. Set Field Values
            // ==============================

            // Enable / Disable Access
            empRecord.setValue({
                fieldId: 'custentity_hris_emp_accesstomobile',
                value: targetAccess
            });

            if (targetAccess) {

                // Set values when enabling
                empRecord.setValue({
                    fieldId: 'custentity_hris_mobile_user_name',
                    value: emp.user || ''
                });

                empRecord.setValue({
                    fieldId: 'custentity_hris_empmobileemail',
                    value: emp.email || ''
                });

            } else {

                /* // Clear values when disabling
                empRecord.setValue({
                    fieldId: 'custentity_hris_mobile_user_name',
                    value: ''
                });

                empRecord.setValue({
                    fieldId: 'custentity_hris_empmobileemail',
                    value: ''
                }); */
            }

            // Set API Response Message
            empRecord.setValue({
                fieldId: 'custentity_hris_access_to_mobile_respons',
                value: apiStatusMsg
            });


            // ==============================
            // F. Save Record
            // ==============================
            empRecord.save({
                ignoreMandatoryFields: true
            });


            // ==============================
            // G. Send Email (only if success)
            // ==============================
            if (sendEmailFlag && isApiSuccess) {

                const statusDesc = targetAccess ? "ENABLED" : "DISABLED";

                email.send({
                    author: authorId,
                    recipients: emp.id,
                    subject: `Mobile App Access: ${statusDesc}`,
                    body: `
                        <div style="font-family:sans-serif; padding:20px;">
                            <h3>Hello ${emp.name},</h3>
                            <p>Your mobile application access has been 
                            <b>${statusDesc.toLowerCase()}</b>.</p>
                        </div>
                    `
                });
            }

        } catch (err) {
            log.error(`Critical Error Employee ${emp.id}`, err.message);
        }
    };

    return {
        getInputData,
        map
    };
});