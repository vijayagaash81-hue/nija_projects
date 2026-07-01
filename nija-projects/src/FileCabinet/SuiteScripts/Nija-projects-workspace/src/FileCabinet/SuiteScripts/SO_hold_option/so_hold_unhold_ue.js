/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], (record, log) => {

    const beforeLoad = (context) => {
        // Only show buttons in VIEW mode
        if (context.type !== context.UserEventType.VIEW) {
            return;
        }

        try {
            const soRec = context.newRecord;
            
            // 'H' is the internal status ID for a Closed Sales Order.
            const orderStatus = soRec.getValue({ fieldId: 'orderstatus' });
            const statusText = soRec.getText({ fieldId: 'status' });
            
            // Do not show any buttons if the Sales Order is Closed
            if (orderStatus === 'H' || (statusText && statusText.toLowerCase().includes('closed'))) {
                return;
            }

            // Retrieve the Hold checkbox value
            const isHold = soRec.getValue({ fieldId: 'custbodynjt_so_hold' });

            const soId = soRec.id;
            const soType = soRec.type;

            // Single-line JavaScript injected directly into the button to avoid creating fields or using <script> tags
            const holdAction = "require(['N/record'], function(record) { record.submitFields({ type: '" + soType + "', id: " + soId + ", values: { custbodynjt_so_hold: true }, options: { ignoreMandatoryFields: true } }); window.location.reload(); });";
            const unholdAction = "require(['N/record'], function(record) { record.submitFields({ type: '" + soType + "', id: " + soId + ", values: { custbodynjt_so_hold: false }, options: { ignoreMandatoryFields: true } }); window.location.reload(); });";

            if (isHold) {
                context.form.addButton({
                    id: 'custpage_btn_unhold',
                    label: 'Unhold',
                    functionName: unholdAction
                });
            } else {
                context.form.addButton({
                    id: 'custpage_btn_hold',
                    label: 'Hold',
                    functionName: holdAction
                });
            }

        } catch (e) {
            log.error('Error in SO Hold/Unhold UE', e.message);
        }
    };

    return { beforeLoad };
});