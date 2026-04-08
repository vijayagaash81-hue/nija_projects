/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', 'N/log'], (record, redirect, log) => {

    const onRequest = (context) => {
        try {

            const request = context.request;
            const parentId = request.parameters.parentId;

            if (!parentId) {
                context.response.write('Missing parentId');
                return;
            }

            // ==============================
            // 1. LOAD PARENT SALES ORDER
            // ==============================
            const parentSO = record.load({
                type: record.Type.SALES_ORDER,
                id: parentId
            });

            // ==============================
            // 2. CREATE CHILD SALES ORDER
            // ==============================
            const childSO = record.create({
                type: record.Type.SALES_ORDER,
                isDynamic: true
            });

            // ==============================
            // 3. SET BODY FIELDS
            // ==============================
            childSO.setValue({
                fieldId: 'entity',
                value: parentSO.getValue('entity')
            });

            childSO.setValue({
                fieldId: 'location',
                value: parentSO.getValue('location')
            });

            childSO.setValue({
                fieldId: 'trandate',
                value: new Date()
            });

            // 🔗 Parent reference
            childSO.setValue({
                fieldId: 'custbody_parent_so', // your custom field
                value: parentId
            });

            // ==============================
            // 4. COPY ITEM LINES
            // ==============================
            const lineCount = parentSO.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {

                const item = parentSO.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                const quantity = parentSO.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });

                const rate = parentSO.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: i
                });

                childSO.selectNewLine({ sublistId: 'item' });

                childSO.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: item
                });

                childSO.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: quantity
                });

                if (rate) {
                    childSO.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: rate
                    });
                }

                childSO.commitLine({ sublistId: 'item' });
            }

            // ==============================
            // 5. SAVE CHILD SO
            // ==============================
            const childId = childSO.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            log.debug('Child SO Created', childId);

            // ==============================
            // 6. REDIRECT TO CHILD SO
            // ==============================
            redirect.toRecord({
                type: record.Type.SALES_ORDER,
                id: childId
            });

        } catch (e) {
            log.error('Suitelet Error', e);
            context.response.write('Error: ' + e.message);
        }
    };

    return {
        onRequest
    };
});