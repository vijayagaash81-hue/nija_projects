/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/currentRecord'], function(dialog, currentRecord) {

    function pageInit(context) {

        var rec = currentRecord.get();
        window.tempPwd = ''; // Initialize global variable to store the password

        dialog.create({
            title: 'Authorization Required',
            message: '<input type="password" id="pwd" placeholder="Enter Password" style="width:100%;padding:5px;" oninput="window.tempPwd = this.value" />',
            buttons: [
                {
                    label: 'Submit',
                    value: 'submit'
                },
                {
                    label: 'Cancel',
                    value: 'cancel'
                }
            ]
        }).then(function(result) {

            if (result === 'submit') {

                var pwd = window.tempPwd;
                window.tempPwd = null; // Clear the temporary variable

                if (pwd === '1234') {
                    console.log('Access granted');
                } else {
                    alert('Wrong password');

                    window.location.href = '/app/center/card.nl'; // Home
                }

            } else {
                // Cancel clicked
                window.location.href = '/app/center/card.nl';
            }
        });
    }

    return {
        pageInit: pageInit
    };
});