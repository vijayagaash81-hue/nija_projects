/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/ui/message', 'N/https', 'N/url', 'N/currentRecord', 'N/query'], 
function(dialog, message, https, url, currentRecord, query) {

    var processingMsg = null;
    var isFinished = false; // Flag to allow the final save

    function saveRecord(context) {
        var rec = context.currentRecord;
        var formId = rec.getValue('customform');
        var joinDate = rec.getValue('custentity_hris_date_of_joining');
        var attendanceCreated = rec.getValue('custentity_hris_attendance_created');

        // If we just finished the process, allow the save to go through
        if (isFinished) return true;

        if (formId == '470' && joinDate && !attendanceCreated) {
            dialog.confirm({
                title: 'Generate Attendance?',
                message: 'Would you like to generate Daily Attendance now? The record will save automatically once the background process completes.'
            }).then(function(confirmed) {
                if (confirmed) {
                    startAttendanceProcess(rec);
                }
            });
            return false; // Stop the initial save to run the process
        }
        return true;
    }

    function startAttendanceProcess(rec) {
        // 1. Show Initial Loading Message
        processingMsg = message.create({
            title: 'Attendance Engine',
            message: 'Initializing background script... Please wait.',
            type: message.Type.CONFIRM
        });
        processingMsg.show();

        // 2. Prepare Data
        var dateObj = new Date(rec.getValue('custentity_hris_date_of_joining'));
        var month = dateObj.getMonth() + 1;
        var yearName = dateObj.getFullYear().toString();
        var yearId = getYearId(yearName);

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_hris_employee_to_dir_att_sl', // Your Suitelet ID
            deploymentId: 'customdeploy_hris_employee_to_dir_att_sl'
        });

        // 3. Call Suitelet to Start MR
        https.post.promise({
            url: suiteletUrl,
            body: JSON.stringify({ empId: rec.id, month: month, yearId: yearId })
        }).then(function(response) {
            var data = JSON.parse(response.body);
            if (data.success) {
                // Start polling the status every 3 seconds
                checkProgress(data.taskId, suiteletUrl, rec);
            } else {
                alert('Error starting process: ' + data.error);
            }
        });
    }

    function checkProgress(taskId, suiteletUrl, rec) {
        var interval = setInterval(function() {
            https.get.promise({
                url: suiteletUrl + '&taskId=' + taskId
            }).then(function(response) {
                var data = JSON.parse(response.body);
                var status = data.status;

                // Update UI based on status
                if (status === 'PENDING') {
                    updateMessage('Status: In Queue...', 'The script is waiting for a free slot in the processor.', message.Type.INFORMATION);
                } 
                else if (status === 'PROCESSING') {
                    updateMessage('Status: Processing... █▒▒▒▒▒▒▒▒▒', 'The script is currently creating attendance rows.', message.Type.INFORMATION);
                } 
                else if (status === 'COMPLETE') {
                    clearInterval(interval);
                    updateMessage('Status: Completed! ██████████', 'Attendance records created successfully. Saving record...', message.Type.CONFIRM);
                    
                    setTimeout(function() {
                        isFinished = true; // Set flag
                        rec.setValue('custentity_hris_attendance_created', true);
                        // Trigger final save programmatically
                        window.onbeforeunload = null; 
                        document.forms['main_form'].submit(); 
                    }, 2000);
                } 
                else if (status === 'FAILED' || status === 'ERROR') {
                    clearInterval(interval);
                    updateMessage('Status: Failed', 'The background process failed. Please check logs.', message.Type.ERROR);
                }
            });
        }, 3000); // Check every 3 seconds
    }

    function updateMessage(title, text, type) {
        if (processingMsg) processingMsg.hide();
        processingMsg = message.create({ title: title, message: text, type: type });
        processingMsg.show();
    }

    function getYearId(yearName) {
        var sql = "SELECT id FROM customlist_hris_year_master WHERE name = ?";
        var results = query.runSuiteQL({ query: sql, params: [yearName] }).asMappedResults();
        return results.length > 0 ? results[0].id : null;
    }

    return { saveRecord: saveRecord };
});