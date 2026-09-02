/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([], () => {

    const PARENT_RECORD = 'customrecord_test_od';

    function beforeLoad(context) {
        // Only run on the parent record in VIEW mode
        if (context.newRecord.type !== PARENT_RECORD) {
            return;
        }

        if (context.type !== context.UserEventType.VIEW) {
            return;
        }

        const form = context.form;

        // Attach the Client Script (which handles inline tree rendering and controls)
        form.clientScriptModulePath = './exp_col_cs.js';
    }

    return {
        beforeLoad: beforeLoad
    };

});