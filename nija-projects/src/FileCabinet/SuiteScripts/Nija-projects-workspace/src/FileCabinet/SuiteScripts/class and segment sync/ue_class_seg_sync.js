/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * 
 */
define(['N/log'], (log) => {

    const divisionMapping = {
        // class internal id : cseg_njt_divisions internal id

        '2': '1', // Fabrication -> Fabrication
        '3': '2', // Pipe Fittings -> Pipe Fitting
        '1': '3', // Fasteners -> Fasteners
        '4': '4'  // General -> General
    };

    const beforeSubmit = (context) => {

        try {

            const rec = context.newRecord;

            const classValue = rec.getValue({
                fieldId: 'class'
            });

            log.debug('Class Value', classValue);

            const divisionValue = divisionMapping[classValue];

            if (divisionValue) {

                rec.setValue({
                    fieldId: 'cseg_njt_divisions',
                    value: divisionValue
                });

                log.debug('Division Set', divisionValue);

            } else {

                rec.setValue({
                    fieldId: 'cseg_njt_divisions',
                    value: ''
                });

                log.debug('No Mapping Found', classValue);
            }

        } catch (e) {

            log.error('Error in beforeSubmit', e);

        }
    };

    return {
        beforeSubmit
    };

});