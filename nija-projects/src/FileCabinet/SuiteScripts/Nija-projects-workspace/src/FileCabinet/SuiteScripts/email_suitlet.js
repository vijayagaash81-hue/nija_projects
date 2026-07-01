/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/email', 'N/runtime'], function (record, email, runtime) {

    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {

                // 🔹 Change this to your employee internal ID
                var employeeId = runtime.getCurrentUser().id;

                // Load employee record
                var empRec = record.load({
                    type: record.Type.EMPLOYEE,
                    id: employeeId
                });

                var empEmail = empRec.getValue('email');

                // 🔹 Sample link (you can replace with your Suitelet / external URL)
                var link = 'https://www.google.com';

                // 🔹 Outlook-safe button HTML
                var emailBody = ''
                    + '<p>Hello,</p>'
                    + '<p>Please click the button below:</p>'
                    + '<table cellspacing="0" cellpadding="0">'
                    + '  <tr>'
                    + '    <td bgcolor="#007bff" style="border-radius:4px;">'
                    + '      <a href="' + link + '" '
                    + '         style="display:inline-block; padding:10px 20px; font-size:14px; color:#ffffff; text-decoration:none; font-family:Arial, sans-serif;">'
                    + '         Open Link'
                    + '      </a>'
                    + '    </td>'
                    + '  </tr>'
                    + '</table>'
                    + '<p>Thanks</p>';

                // Send email
                email.send({
                    author: employeeId,
                    recipients: empEmail,
                    subject: 'Test Email from Suitelet',
                    body: emailBody
                });

                context.response.write('Email sent successfully to: ' + empEmail);

            }
        } catch (e) {
            context.response.write('Error: ' + e.message);
        }
    }

    return {
        onRequest: onRequest
    };

});