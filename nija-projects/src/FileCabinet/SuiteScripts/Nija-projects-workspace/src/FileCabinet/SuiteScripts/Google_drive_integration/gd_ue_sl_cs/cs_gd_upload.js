/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function(currentRecord) {

    function lineInit(context) {
        var rec = currentRecord.get();

        var line = rec.getCurrentSublistIndex({
            sublistId: 'recmachcustrecord_njt_teone_link'
        });

        // Set Upload link dynamically
        rec.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_njt_teone_link',
            fieldId: 'custpage_upload_btn',
            value: '<a href="#" onclick="triggerUpload(' + line + ')">Upload</a>',
            ignoreFieldChange: true
        });
    }

    function setUploadedFile(line, url) {
        try {
            var rec = currentRecord.get();

            rec.selectLine({
                sublistId: 'recmachcustrecord_njt_teone_link',
                line: parseInt(line)
            });

            rec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_njt_teone_link',
                fieldId: 'custrecord1360', // your field id
                value: url
            });

            rec.commitLine({
                sublistId: 'recmachcustrecord_njt_teone_link'
            });

        } catch (e) {
            console.log(e);
        }
    }

    // expose globally for popup
    if (typeof window !== 'undefined') {
        window.setUploadedFile = setUploadedFile;
    }

    return {
        lineInit: lineInit
    };

}); //ꗈ