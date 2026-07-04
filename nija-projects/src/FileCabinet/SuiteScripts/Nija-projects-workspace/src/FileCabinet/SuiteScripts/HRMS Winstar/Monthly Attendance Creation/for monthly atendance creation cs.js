/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/runtime', 'N/search', 'N/log'], function(runtime, search, log) {

    // ===============================================
    // 1. PAGE INIT – Load accessible subsidiaries
    // ===============================================
    function pageInit(context) {
        try {
            var rec = context.currentRecord;
            var user = runtime.getCurrentUser();
            var roleId = user.role;

            log.debug('pageInit', 'User Role ID: ' + roleId);
            if (!roleId) return;

            // Load subsidiaries user can access
            populateSubsidiaries(rec, roleId);

            // Clear Pay Group initially
            clearPayGroup(rec);

        } catch (e) {
            log.error('pageInit Error', e.name + ': ' + e.message);
        }
    }

    // ===============================================
    // 2. FIELD CHANGED – React when subsidiary changes
    // ===============================================
    function fieldChanged(context) {
      debugger;
        try {
            var rec = context.currentRecord;
            var fieldId = context.fieldId;

            if (fieldId === 'custpage_subsidiary') {
                var subId = rec.getValue({ fieldId: 'custpage_subsidiary' });
                log.debug('Subsidiary Changed', 'Selected: ' + subId);

                var payGroupField = rec.getField({ fieldId: 'custpage_paygroup' });
                if (!payGroupField) return;

                if (!subId) {
                    clearPayGroup(rec);
                    return;
                }

                loadPayGroupsForSubsidiary(payGroupField, subId);
            }

        } catch (e) {
            log.error('fieldChanged Error', e.name + ': ' + e.message);
        }
    }

    // ===============================================
    // 3. HELPER: Populate Subsidiary dropdown
    // ===============================================
    function populateSubsidiaries(rec, roleId) {
        var subField = rec.getField({ fieldId: 'custpage_subsidiary' });
        if (!subField) return;

        // Clear all options
        clearSelectField(subField);

        // Search role → accessible subsidiaries
        var roleSearch = search.create({
            type: 'role',
            filters: [['internalid', 'anyof', roleId]],
            columns: ['subsidiaries']
        });

        var subs = [];
        roleSearch.run().each(function(result) {
            var id = result.getValue('subsidiaries');
            var text = result.getText('subsidiaries');
            if (id && subs.indexOf(id) === -1) {
                subs.push({ id: id, text: text });
            }
            return true;
        });

        // Add default
        subField.insertSelectOption({ value: '', text: '--Select Subsidiary--' });

        // Add accessible subs
        subs.forEach(function(s) {
            subField.insertSelectOption({ value: s.id, text: s.text });
        });

        log.debug('Subsidiaries Loaded', subs.length + ' options');
    }

    // ===============================================
    // 4. HELPER: Load Pay Groups for selected subsidiary
    // ===============================================
    function loadPayGroupsForSubsidiary(payGroupField, subsidiaryId) {
        clearSelectField(payGroupField);
        payGroupField.insertSelectOption({ value: '', text: '--Select Pay Group--' });

        // === UPDATE THIS FIELD ID ===
        // Go to: Customization > Lists, Records, & Fields > Record Types > HRIS Process Group Master > Fields
        // Find the field that links to Subsidiary → copy its **Field ID**
        var subsidiaryFieldId = 'custrecord_hris__subsidiary'; // ← CHANGE IF DIFFERENT

        var pgSearch = search.create({
            type: 'customrecord_hris_process_groupmaster',
            filters: [
                [subsidiaryFieldId, 'anyof', subsidiaryId],
                'AND',
                ['isinactive', 'is', 'F']
            ],
            columns: [
                'name',
                'internalid'
            ]
        });

        var payGroups = [];
        pgSearch.run().each(function(result) {
            var id = result.getValue('internalid');
            var name = result.getValue('name') || result.getText('name');
            payGroups.push({ id: id, name: name });
            return true;
        });

        if (payGroups.length === 0) {
            payGroupField.insertSelectOption({
                value: '-1',
                text: 'No Pay Groups Found'
            });
        } else {
            payGroups.forEach(function(pg) {
                payGroupField.insertSelectOption({
                    value: pg.id,
                    text: pg.name
                });
            });
        }

        log.debug('Pay Groups Loaded', payGroups.length + ' for sub ' + subsidiaryId);
    }

    // ===============================================
    // 5. HELPER: Clear all options from a select field
    // ===============================================
    function clearSelectField(field) {
        // Remove default empty
        try { field.removeSelectOption({ value: '' }); } catch(e) {}
        try { field.removeSelectOption({ value: null }); } catch(e) {}

        // Remove all others
        var options = field.getSelectOptions();
        options.forEach(function(opt) {
            try {
                field.removeSelectOption({ value: opt.value });
            } catch(e) {}
        });
    }

    // ===============================================
    // 6. Clear Pay Group field
    // ===============================================
    function clearPayGroup(rec) {
        var pgField = rec.getField({ fieldId: 'custpage_paygroup' });
        if (pgField) {
            clearSelectField(pgField);
            pgField.insertSelectOption({ value: '', text: '--Select Pay Group--' });
        }
    }

    // ===============================================
    // EXPORT
    // ===============================================
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});