/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log', 'N/format', './moment'], function(search, record, log, format, moment) {

    function getInputData(context) {
        // Calculate the previous date in IST
        var currentDate = moment.utc();
        log.debug("currentDate (UTC)", currentDate.format());

        // Convert to IST by adding 5 hours and 30 minutes
        var istDate = currentDate.add(5, 'hours').add(30, 'minutes');
        log.debug("currentDate (IST)", istDate.format());

        var previousDate = istDate.subtract(1, 'days').format('DD/MM/YYYY'); // Adjust format to DD/MM/YYYY
        log.debug("previousDate (IST)", previousDate);

        // Search for records in customrecord_njt_daily_attendance_bio for the previous date
        var customrecord_njt_daily_attendance_bioSearchObj = search.create({
            type: "customrecord_njt_daily_attendance_bio",
            filters: [
                ["custrecord_njt_bio_date", "on", previousDate]
            ],
            columns: [
                search.createColumn({ name: "custrecord_njt_bio_time", summary: "MIN", label: "Bio Time" }),
                search.createColumn({ name: "custrecord_njt_bio_time", summary: "MAX", label: "Bio Time" }),
                search.createColumn({ name: "custrecord_njt_employee_name", summary: "GROUP", label: "Employee Name" }),
                search.createColumn({ name: "custrecord_njt_bio_date", summary: "GROUP", label: "Bio Date" })
            ]
        });

        // Return search as input data for map stage
        return customrecord_njt_daily_attendance_bioSearchObj.run().getRange({ start: 0, end: 1000 });
    }

    function map(context) {
        var result = JSON.parse(context.value);

        try {
            var minBioTime = result.values['custrecord_njt_bio_time.MIN'];
            var maxBioTime = result.values['custrecord_njt_bio_time.MAX'];
            var employeeName = result.values['custrecord_njt_employee_name.GROUP'];
            var bioDate = result.values['custrecord_njt_bio_date.GROUP'];

            log.debug("minBioTime", minBioTime);
            log.debug("maxBioTime", maxBioTime);
            log.debug("employeeName", employeeName);
            log.debug("bioDate", bioDate);

            // If minBioTime equals maxBioTime, skip the record creation
            if (minBioTime === maxBioTime) {
                log.debug('Skipping record creation', 'minBioTime equals maxBioTime for Employee: ' + employeeName + ' on Date: ' + bioDate);
                return true; // Skip this result in the map stage
            }

            // Parse bioDate to Date object
            var bioDateObj = format.parse({
                value: bioDate,
                type: format.Type.DATE
            });

            // Calculate work hours using custom function
            var formattedWorkHours = calculateWorkHours(minBioTime, maxBioTime);
            log.debug("formattedWorkHours", formattedWorkHours);

            // Prepare data to be passed to reduce stage
            var recordData = {
                employeeName: employeeName,
                bioDate: bioDateObj,
                minBioTime: minBioTime,
                maxBioTime: maxBioTime,
                formattedWorkHours: formattedWorkHours
            };

            // Pass data to the reduce stage
            context.write({
                key: employeeName + ':' + bioDate, // Use unique key to aggregate records
                value: recordData
            });

        } catch (e) {
            log.error('Error processing result', e);
        }
    }

    function reduce(context) {
        try {
            var resultData = JSON.parse(context.values[0]);
            var minBioTime = resultData.minBioTime;
            var maxBioTime = resultData.maxBioTime;
            var employeeName = resultData.employeeName;
            var bioDate = resultData.bioDate;

            // Create or update the record
            var newRecord = record.create({
                type: "customrecord_njt_emp_daily_atten_ch",
                isDynamic: true
            });

            newRecord.setValue({
                fieldId: "custrecord_employee",
                value: employeeName
            });

            newRecord.setValue({
                fieldId: "custrecord_bio_date",
                value: bioDate
            });

            newRecord.setValue({
                fieldId: "custrecord_min_bio_time",
                value: minBioTime
            });

            newRecord.setValue({
                fieldId: "custrecord_max_bio_time",
                value: maxBioTime
            });

            var recordId = newRecord.save();
            log.debug("Record Created Successfully", recordId);

        } catch (e) {
            log.error('Error in reduce function', e);
        }
    }

    function summarize(context) {
        try {
            if (context.inputSummary.error) {
                log.error('Error in input', context.inputSummary.error);
            }
            if (context.mapSummary.errors) {
                context.mapSummary.errors.iterator().each(function(key, error) {
                    log.error('Map error', error);
                    return true;
                });
            }
            if (context.reduceSummary.errors) {
                context.reduceSummary.errors.iterator().each(function(key, error) {
                    log.error('Reduce error', error);
                    return true;
                });
            }
            log.audit('Summary', 'Map/Reduce script completed successfully.');
        } catch (e) {
            log.error('Error in summarize', e);
        }
    }

    // Function to calculate work hours
    function calculateWorkHours(timeIn, timeOut) {
        var punchTimeIn = moment(timeIn, "HH:mm:ss a");
        var punchTimeOut = moment(timeOut, "HH:mm:ss a");

        // Calculate duration
        var duration = moment.duration(punchTimeOut.diff(punchTimeIn));

        // Calculate hours and minutes
        var hours = parseInt(duration.asHours());
        var minutes = parseInt(duration.asMinutes()) % 60;

        // Format hours and minutes
        var formattedWorkHours = hours + ':' + minutes;

        return formattedWorkHours;
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };

});
