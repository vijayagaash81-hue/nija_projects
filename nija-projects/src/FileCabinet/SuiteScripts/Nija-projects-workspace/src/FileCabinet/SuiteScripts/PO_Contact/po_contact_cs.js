/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(['N/search'], (search) => {

    const pageInit = (context) => {
        setVendorContact(context.currentRecord);
    };

    const fieldChanged = (context) => {

        if (context.fieldId === 'entity') {
            setVendorContact(context.currentRecord);
        }
    };

    const setVendorContact = (rec) => {

        try {

            const vendorId = rec.getValue({
                fieldId: 'entity'
            });

            if (!vendorId) {
                return;
            }

            // SEARCH FIRST ACTIVE CONTACT OF VENDOR
            const contactSearch = search.create({
                type: search.Type.CONTACT,
                filters: [
                    ['company', 'anyof', vendorId],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    'internalid',
                    'entityid',
                    'phone',
                    'email'
                ]
            });

            const result = contactSearch.run().getRange({
                start: 0,
                end: 1
            });

            if (result.length > 0) {

                const contactId = result[0].getValue('internalid');

                // CONTACT FIELD
                rec.setValue({
                    fieldId: 'custbody6',
                    value: contactId
                });

                // OPTIONAL EXTRA FIELDS

                /*
                rec.setValue({
                    fieldId: 'custbody_vendor_contact_name',
                    value: result[0].getValue('entityid') || ''
                });

                rec.setValue({
                    fieldId: 'custbody_vendor_contact_phone',
                    value: result[0].getValue('phone') || ''
                });

                rec.setValue({
                    fieldId: 'custbody_vendor_contact_email',
                    value: result[0].getValue('email') || ''
                });
                */

            }

        } catch (e) {

            console.log('Error setting contact', e);

        }
    };

    return {
        pageInit,
        fieldChanged
    };

});