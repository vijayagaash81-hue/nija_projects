/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * 
 * Description: Loads and saves employee records from a specific list 
 * while ignoring mandatory field validation.
 */
define(['N/record', 'N/log'], (record, log) => {

    const execute = (context) => {
        // 1. Array containing the exact IDs you provided
        const employeeIds = [
            280, 276, 84, 125, 127, 343, 433, 549, 392, 449, 
            328, 375, 406, -5, 349, 445, 321, 402, 333, 583, 
            488, 254, 450, 274, 270, 477, 309, 437, 271, 49, 
            476, 438, 370, 455, 288, 452, 473, 304, 462, 311, 
            357, 387, 384, 487, 553, 380, 486, 368, 481, 6, 
            350, 336, 512, 47, 423, 478, 105, 405, 327, 499, 
            145, 366, 515, 490, 244, 511, 419, 446, 102, 427, 
            440, 307, 62, 268, 319, 332, 82, 98, 325, 317, 
            495, 513, 139, 448, 421, 297, 422, 409, 141, 329, 
            352, 86, 314, 410, 121, 58, 371, 484, 435, 281, 
            252, 90, 313, 475, 424, 68, 468, 388, 8, 135, 
            335, 365, 562, 76, 253, 381, 70, 137, 498, 100, 
            339, 369, 341, 451, 72, 507, 397, 320, 358, 432, 
            379, 467, 400, 289, 342, 64, 293, 602, 251, 414, 
            550, 425, 88, 340, 386, 436, 565, 117, 257, 385, 
            403, 496, 584, 561, 459, 497, 526, 354, 5, 3, 
            94, 60, 558, 557, 471, 300, 500, 267, 326, 546, 
            502, 46, 590, 598, 7, 10, 510, 376, 382, 399, 
            149, 74, 363, 586, 364, 417, 119
        ];

        log.audit('Bulk Save', `Beginning processing of ${employeeIds.length} records.`);

        // 2. Loop through every ID in the list
        employeeIds.forEach((currentId) => {
            // Note: -5 is usually not a valid internal ID, but included per your list.
            if (currentId <= 0) {
                log.error('Skip', `ID ${currentId} is invalid.`);
                return; // Skips to next ID
            }

            try {
                // 3. Load the employee record in dynamic mode
                let empRecord = record.load({
                    type: record.Type.EMPLOYEE,
                    id: currentId,
                    isDynamic: true
                });

                // 4. Save the record
                // ignoreMandatoryFields: true allows saving even if data is missing
                let recordId = empRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.info('Success', `Successfully saved Employee ID: ${recordId}`);

            } catch (e) {
                // 5. Catch errors (e.g. if record doesn't exist or permissions are missing)
                log.error(`Failed ID ${currentId}`, e.message);
            }
        });

        log.audit('Bulk Save', 'Processing Complete.');
    };

    return { execute };
});