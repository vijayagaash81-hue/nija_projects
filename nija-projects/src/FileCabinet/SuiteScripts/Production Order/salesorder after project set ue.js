/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log', 'N/search'], function (record, log, search) {

    /**
     * ==========================
     * BEFORE LOAD
     * ==========================
     * Triggered when the record is loaded in the browser.
     */
    function beforeLoad(context) {

        // Check if the user is currently viewing the record (not editing or creating)
        if (context.type !== context.UserEventType.VIEW) {
            // If not in VIEW mode, stop execution of this function
            return;
        }

        // Get the current Sales Order record object from the context
        var soRec = context.newRecord;

        // Retrieve the internal value of the 'orderstatus' field (e.g., 'A' for Pending Approval)
        var orderStatus = soRec.getValue({
            fieldId: 'orderstatus'
        });
/*  context.form.addButton({
                id: 'custpage_production_ord_btn', // Unique ID for the button
                label: 'Production Order',           // Text displayed on the button
                functionName: 'productionord()' // Function to call in the Client Script
            });
        // Log the order status for debugging purposes
        log.debug('Order Status', orderStatus); */
var prodOrdId = soRec.getValue({
    fieldId: 'custbody_njt_production_ord_id'
});

// Debug log
log.debug('Production Order ID', prodOrdId);

// Add button ONLY if field is empty
if (!prodOrdId) {

    context.form.addButton({
        id: 'custpage_production_ord_btn',
        label: 'Production Order',
        functionName: 'productionord()'
    });

}
        // Condition: show button only if the status is NOT 'A' (Pending Approval)
        /* if (orderStatus !== 'A') {

            // Add a custom button to the form UI
            context.form.addButton({
                id: 'custpage_material_request_btn', // Unique ID for the button
                label: 'Material Request',           // Text displayed on the button
                functionName: 'onMaterialRequestClick()' // Function to call in the Client Script
            });

            context.form.addButton({
                id: 'custpage_material_retrun_btn', // Unique ID for the button
                label: 'Material Return',           // Text displayed on the button
                functionName: 'onMaterialReturnClick()' // Function to call in the Client Script
            });

           
        } */

     // if(orderStatus == 'B'){
        context.form.addButton({
                id: 'custpage_invoice_btn', // Unique ID for the button
                label: 'Create Invoice',           // Text displayed on the button
                functionName: 'estimate()' // Function to call in the Client Script
            });
      context.form.addButton({
                id: 'custpage_closing_btn', // Unique ID for the button
                label: 'Closing',           // Text displayed on the button
                functionName: 'close()' // Function to call in the Client Script
            });
      //}
       // Link the Client Script file that contains the 'onMaterialRequestClick' logic
            context.form.clientScriptModulePath = './material_request_cs.js';
     
      
    }

    /**
     * ==========================
     * AFTER SUBMIT
     * ==========================
     * Triggered after the record is saved to the database.
     */
   function afterSubmit(context) {

        // 1. Ensure this logic only runs when a NEW record is created
        if (context.type !== context.UserEventType.CREATE) {
            return;
        }

        try {
            // 2. Get the internal ID of the newly created Sales Order
            var salesOrderId = context.newRecord.id;

            /**
             * 3. Fetch necessary fields from the Sales Order.
             * We fetch 'tranid' to avoid "To Be Generated" 
             * and 'custbody_njt_so_projecttype' to determine the naming prefix.
             */
            var soData = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: salesOrderId,
                columns: ['tranid', 'custbody_njt_so_projecttype']
            });

            var actualTranId = soData.tranid;
            
            // Handle the project type lookup (it usually comes as an array/object from lookupFields)
            var projectType = '';
            if (soData.custbody_njt_so_projecttype && soData.custbody_njt_so_projecttype.length > 0) {
                projectType = soData.custbody_njt_so_projecttype[0].value;
            } else {
                projectType = soData.custbody_njt_so_projecttype;
            }

            // 4. Calculate the current Year (Last 2 digits, e.g., 2025 -> "25")
            var currentYear = new Date().getFullYear().toString().substring(2);

            // 5. Determine the Prefix based on Project Type
            var prefix = '';
            if (projectType == '1') {
                prefix = 'FB';
            } else if (projectType == '3') {
                prefix = 'FS';
            } else if (projectType == '2') {
                prefix = 'PF';
            }

            // 6. Logic: If no project type is selected, you might want a default or to stop
            if (!prefix) {
                log.debug('Skipping Creation', 'No valid Project Type selected (Value: ' + projectType + ')');
                return;
            }

            // 7. Construct the Final Project Name (e.g., FB25-14)
            var customRecordName = prefix + currentYear + '-' + actualTranId;

            log.audit('Generating Project Name', 'Type: ' + projectType + ' | Name: ' + customRecordName);

            // 8. Initialize the creation of the Custom Segment record
            var customRec = record.create({
                type: 'customrecord_cseg_njt_seg_proj', // Your Custom Segment Record Type ID
                isDynamic: true
            });

            // 9. Set the 'name' field of the custom segment
            customRec.setValue({
                fieldId: 'name',
                value: customRecordName
            });

            // 10. Save the Custom Segment and capture its unique internal ID
            var customRecId = customRec.save();

            log.debug('Custom Segment Created', 'ID: ' + customRecId + ' Name: ' + customRecordName);

            /**
             * 11. Update the original Sales Order.
             * Link the SO to the newly created Segment record.
             */
            record.submitFields({
                type: record.Type.SALES_ORDER,
                id: salesOrderId,
                values: {
                    // Set the segment field to the ID of the record we just created
                    cseg_njt_seg_proj: customRecId 
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });

            log.audit('Success', 'Sales Order ' + actualTranId + ' linked to Segment Project ' + customRecordName);

        } catch (e) {
            log.error('afterSubmit Error', e.message + ' | ' + e.stack);
        }
    }

    // Return the entry points to the script engine
    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    };
});