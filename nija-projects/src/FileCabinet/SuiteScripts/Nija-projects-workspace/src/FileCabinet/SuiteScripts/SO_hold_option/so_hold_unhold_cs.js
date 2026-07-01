/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/record', 'N/currentRecord', 'N/ui/message'], (record, currentRecord, message) => {

    const pageInit = (context) => {
        // Required for Client Scripts, but no action needed on load
    };

    // Function triggered by the "Hold" button
    const holdOrder = () => {
        updateHoldStatus(true);
    };

    // Function triggered by the "Unhold" button
    const unholdOrder = () => {
        updateHoldStatus(false);
    };

    // Helper function to update the checkbox and refresh the page
    const updateHoldStatus = (isHoldStatus) => {
        try {
            const rec = currentRecord.get();
            
            // Use submitFields to quickly update the checkbox in the database without a full record edit
            record.submitFields({
                type: rec.type,
                id: rec.id,
                values: {
                    'custbodynjt_so_hold': isHoldStatus
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
            
            // Reload the page to reflect the new state (buttons and checkbox)
            window.location.reload();
            
        } catch (e) {
            console.error('Error updating hold status:', e);
            alert('Failed to update the Hold status: ' + e.message);
        }
    };

    // Export the functions so the UI buttons can call them
    return { pageInit, holdOrder, unholdOrder };
});