/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * ꗈ
 */
define(['N/log'], function (log) {

    const divisionMapping = {
        // class internal id : cseg_njt_divisions internal id

        '2': '1', // Fabrication -> Fabrication
        '3': '2', // Pipe Fittings -> Pipe Fitting
        '1': '3', // Fasteners -> Fasteners
        '4': '4'  // General -> General
    };

    function fieldChanged(context) {
        try {
            var currentRecord = context.currentRecord;
            var fieldId = context.fieldId;

            // Trigger only when class field changes
            if (fieldId === 'class') {

                var classValue = currentRecord.getValue({
                    fieldId: 'class'
                });

                log.debug('Selected Class', classValue);

                // Get mapped division value
                var divisionValue = divisionMapping[classValue];

                if (divisionValue) {

                    currentRecord.setValue({
                        fieldId: 'cseg_njt_divisions',
                        value: divisionValue,
                        ignoreFieldChange: true
                    });

                    log.debug('Division Set', divisionValue);

                } else {

                    // Clear field if no mapping found
                    currentRecord.setValue({
                        fieldId: 'cseg_njt_divisions',
                        value: '',
                        ignoreFieldChange: true
                    });

                    log.debug('No Mapping Found', classValue);
                }
            }

        } catch (e) {
            log.error('Error in fieldChanged', e);
        }
    }

    return {
        fieldChanged: fieldChanged
    };

});