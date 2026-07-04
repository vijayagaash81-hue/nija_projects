/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format', 'N/log', './moment.js'], function (record, search, format, log, moment) {
    var MOMENT = moment;
    function afterSubmit(context) {
        try {
            var newRecord = context.newRecord;
            var attenRegID = newRecord.id;
            log.debug("attenRegID", attenRegID);
            var actualworkinghrs = 0;
            // Assuming this script is for customrecord_njt_emp_daily_atten_ch
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var regularDateValue = newRecord.getValue('custrecord_hr_attend_regular_date');
                log.debug("regularDateValue", regularDateValue);

                if (!regularDateValue) {
                    log.error("Missing Date", "The custrecord_hr_attend_regular_date field is empty or not found.");
                    return;
                }

                var regularDate = format.format({
                    value: new Date(regularDateValue),
                    type: format.Type.DATE
                });
                log.debug("formatted regularDate", regularDate);

                var regularEmployee = newRecord.getValue('custrecord_hr_attend_reg_employee');
                var regularIn = newRecord.getValue('custrecord_hr_attend_regular_reg_in');
                var regularOut = newRecord.getValue('custrecord_hr_attend_regular_reg_out');
                var id = newRecord.getValue('custrecord_hr_attend_reg_daily_id');
                var approvalSts = newRecord.getValue('custrecord_hr_attend_reg_approve_status');

                var regularstartdate = newRecord.getValue('custrecord_hr_attend_regularstartdate') || '';
                var regularenddate = newRecord.getValue('custrecord_hr_attend_regularenddate') || '';
                var dailycheck=newRecord.getValue('custrecord_hr_attend_dailyupdated')||false;
                log.debug("regularEmployee", regularEmployee);
                log.debug("regularIn", regularIn);
                log.debug("regularOut", regularOut);
                log.debug("approvalSts", approvalSts);

                if (!regularEmployee || !regularIn || !regularOut || !regularstartdate||!regularenddate) {
                    log.error("Missing Values", "One or more required values (employee, in time, out time) are missing.");
                    return;
                }

                // Load the customrecord_njt_emp_daily_atten_ch record
                if (id && approvalSts == 2 && dailycheck==false) {
                    var attendanceRecord = record.load({
                        type: 'customrecord_njt_emp_daily_atten_ch',
                        id: id
                    });

                    var existingInTime = attendanceRecord.getValue('custrecord_njt_emp_daily_in_time');
                    var existingOutTime = attendanceRecord.getValue('custrecord_njt_emp_daily_out_time');
                    var lunchtime = attendanceRecord.getValue('custrecord_njt_emp_daily_lunch_time') || 0;
                    var interattentype = attendanceRecord.getValue('custrecord_njt_emp_daily_intatt');
                    log.debug("existingInTime", existingInTime);
                    log.debug("existingOutTime", existingOutTime);

                   
                     if (regularstartdate != '') {
                        var formatregularworkstartdate = format.format({
                            value:new Date(regularstartdate),
                            type: format.Type.DATE
                        });
                    }
                    if (regularenddate != '') {
                        var formatregularworkenddate = format.format({
                            value: new Date(regularenddate),
                            type: format.Type.DATE
                        });
                    }

                    log.emergency('formatregularstartdate',formatregularstartdate);
                     log.emergency('formatregularenddate',formatregularenddate);
                    var totalWorkingHours= calculateHoursDiffdecimal(formatregularworkstartdate,regularIn,formatregularworkenddate,regularOut)
                    log.debug("totalWorkingHours", totalWorkingHours);
                   // actualworkinghrs = subtractTimeDecimal(totalWorkingHours, lunchtime)
                   totalWorkingHours=totalWorkingHours.toFixed(2);
             /*       actualworkinghrs=parseFloat(totalWorkingHours)-parseFloat(lunchtime); */
                   actualworkinghrs=parseFloat(totalWorkingHours);
                   log.debug('actualworkinghrs',actualworkinghrs);
                    
                    attendanceRecord.setValue('custrecord_njt_emp_daily_reg_in', regularIn);
                    attendanceRecord.setValue('custrecord_njt_emp_daily_reg_out', regularOut);
                    attendanceRecord.setValue('custrecord_njt_emp_daily_regularizahrs', totalWorkingHours)
                    attendanceRecord.setValue('custrecord_hris_actual_woking_hours', actualworkinghrs);
                    attendanceRecord.setValue('custrecord_njt_emp_daily_attenreglink', attenRegID);
                    if (interattentype == 23) {
                        attendanceRecord.setValue('custrecord_njt_emp_daily_intatt', 18);
                    }
                     if (regularstartdate != '') {
                        var formatregularstartdate = format.parse({
                            value: regularstartdate,
                            type: format.Type.DATE
                        }); 
                        attendanceRecord.setValue('custrecord_njt_emp_daily_reg_startdate', formatregularstartdate);

                    }
                     if (regularenddate != '') {
                        var formatregularenddate = format.parse({
                            value: regularenddate,
                            type: format.Type.DATE
                        }); 
                        attendanceRecord.setValue('custrecord_njt_emp_daily_reg_enddate', formatregularenddate);
                 }

                    var attenChildId = attendanceRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug('attenChildId', attenChildId);

                     record.submitFields({
                        type: 'customrecord_hr_attend_regularization',
                        id: attenRegID,
                        values: {
                            'custrecord_hr_attend_dailyupdated':true,
                          
                        }
                    }); 

                }/* else if(approvalSts==2) {
                    var totalWorkingHours= caluclateWorkHours(regularIn, regularOut);
                    log.debug("totalWorkingHours",totalWorkingHours);
                    var dailyAttenRec = record.create({
                        type: 'customrecord_njt_emp_daily_atten_ch',
                        isDynamic: true
                    });
                    dailyAttenRec.setValue('custrecord_hr_daily_attendance_date',newRecord.getValue('custrecord_hr_attend_regular_date'));
                    dailyAttenRec.setValue('custrecord_hr_daily_attendance_emp_name', newRecord.getValue('custrecord_hr_attend_reg_employee'));
                    dailyAttenRec.setValue('custrecord_njt_emp_daily_reg_in', newRecord.getValue('custrecord_hr_attend_regular_reg_in'));
                    dailyAttenRec.setValue('custrecord_njt_emp_daily_reg_out', newRecord.getValue('custrecord_hr_attend_regular_reg_out'));
                    dailyAttenRec.setValue('custrecord_hris_actual_woking_hours',totalWorkingHours);
                    var newRecordId = dailyAttenRec.save();
                    log.debug("newRecordId",newRecordId);
                    record.submitFields({
                        type: 'customrecord_hr_attend_regularization',
                        id: attenRegID,
                        values: {
                            'custrecord_hr_attend_reg_daily_id':newRecordId
                        }
                    });
                } */





            }
        } catch (e) {
            log.error({
                title: 'Error in afterSubmit function',
                details: e.toString()
            });
        }
    }

    // Function to parse time in "HH:MM AM/PM" format
    function parseTimeString(timeString) {
        var timeParts = timeString.split(' ');
        var time = timeParts[0].split(':');
        var hours = parseInt(time[0]);
        var minutes = parseInt(time[1]);
        var period = timeParts[1];

        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        var date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }
    function subtractTimeDecimal(baseTime, timeToSubtract) {
        log.debug('baseTime', baseTime);
        log.debug('timeToSubtract', timeToSubtract)
        // Convert "HH:mm" to total minutes
        var parts = baseTime.split(".");
        var totalMinutes = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);

        // ParseFloat value (e.g., "1.30" = 1.3 hours = 78 mins)
        var subtractMinutes = Math.round(parseFloat(timeToSubtract) * 60);

        var resultMinutes = totalMinutes - subtractMinutes;

        // Normalize to positive minutes within 24h
        resultMinutes = ((resultMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);

        var hours = Math.floor(resultMinutes / 60);
        var minutes = resultMinutes % 60;
        log.debug('Hours', hours);
        log.debug('minutes', minutes);

        // return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
        return (hours < 10 ? "0" + hours : hours) + "." + (minutes < 10 ? "0" + minutes : minutes);

    }

    function caluclateWorkHours(timeIn, timeOut) {

        // debugger;
        log.debug('timeIn', timeIn);
        log.debug('timeOut', timeOut);
        var totalHoursWorked = '';
        var punchTimeIn = MOMENT(timeIn, "HH:mm:ss a");
        log.debug('punchTimeIn', punchTimeIn);
        var punchTimeOut = MOMENT(timeOut, "HH:mm:ss a");
        log.debug('punchTimeOut', punchTimeOut);
        // Hours worked
        var duration;

        if (punchTimeIn <= punchTimeOut) {
            duration = MOMENT.duration(punchTimeOut.diff(punchTimeIn));
            log.debug('duration', duration);
        } else {
            // If Start Time is greater than End time. Mostly for Night Shift (or) Shift timing that runs between two Dates.
            punchTimeIn = MOMENT(punchTimeIn).add(12, 'hours');
            punchTimeOut = MOMENT(MOMENT(punchTimeOut).add(12, 'hours')).add(1, 'days'); // add 1 day because shift starts on the 1st date and end on the next date.
            duration = MOMENT.duration(punchTimeOut.diff(punchTimeIn));
        }
        // Calculate Hours worked
        var hours = parseInt(duration.asHours());
        var minutes = parseInt(duration.asMinutes()) % 60;
        //    totalHoursWorked = ZeroPad(hours) + ':' + ZeroPad(minutes);
        totalHoursWorked = hours + '.' + minutes
        return totalHoursWorked;
    }

function calculateHoursDiffdecimalold(startDate, startTime, endDate, endTime) {
    // Convert dd/mm/yyyy → yyyy-mm-dd (JS compatible)
    log.emergency('startDate',startDate);
    log.emergency('endDate',endDate);

    function parseDate(d) {
        var parts = d.split("/");
        log.audit('Format', parts[2] + "-" + parts[1] + "-" + parts[0]);
        return parts[2] + "-" + parts[1] + "-" + parts[0]; // yyyy-mm-dd
    }
    

    var start = new Date(parseDate(startDate) + " " + startTime);
    var end   = new Date(parseDate(endDate) + " " + endTime);
     if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid date or time input: " + startDate + " " + startTime + " / " + endDate + " " + endTime);
    }

    // difference in ms → hours
    var diffHours = (end - start) / (1000 * 60 * 60);

    return diffHours;
}
/**
 * Calculate hours difference safely in SuiteScript
 */
function calculateHoursDiffdecimal(startDate, startTime, endDate, endTime) {
    function parseDateTime(dateStr, timeStr) {
        // dateStr = "15/06/2025"
        var parts = dateStr.split("/");
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1; // JS month 0-11
        var year = parseInt(parts[2], 10);

        // timeStr = "10:47 AM"
        var timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeParts) throw new Error("Invalid time format: " + timeStr);

        var hour = parseInt(timeParts[1], 10);
        var minute = parseInt(timeParts[2], 10);
        var ampm = timeParts[3].toUpperCase();

        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;

        return new Date(year, month, day, hour, minute, 0, 0);
    }

    var start = parseDateTime(startDate, startTime);
    var end = parseDateTime(endDate, endTime);

    var diffHours = (end - start) / (1000 * 60 * 60);
    return diffHours;
}


    return {
        afterSubmit: afterSubmit
    };

});
