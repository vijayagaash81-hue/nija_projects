/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * 
 * Description: A Suitelet that renders a Google Calendar-like interface using FullCalendar.js
 */
define([], () => {

    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>NetSuite Custom Calendar</title>
                
                <!-- Modern Google Font: Inter -->
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

                <!-- FullCalendar core CSS and JS -->
                <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js"></script>
                
                <!-- SweetAlert2 for beautiful popups (Google-like feel) -->
                <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
                
                <!-- Popper.js & Tippy.js for modern Hover Tooltips -->
                <script src="https://unpkg.com/@popperjs/core@2"></script>
                <script src="https://unpkg.com/tippy.js@6"></script>
                <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/animations/shift-away.css"/>
                
                <style>
                    :root {
                        --primary: #2563eb;       /* Modern Blue */
                        --primary-hover: #1d4ed8;
                        --bg-color: #f8fafc;      /* Soft App Background */
                        --card-bg: #ffffff;
                        --border-color: #e2e8f0;
                        --text-main: #1e293b;
                        --text-muted: #64748b;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        background-color: var(--bg-color);
                        color: var(--text-main);
                    }
                    
                    /* Modern App Header */
                    .app-header {
                        background-color: var(--card-bg);
                        padding: 16px 32px;
                        border-bottom: 1px solid var(--border-color);
                        display: flex;
                        align-items: center;
                        margin-bottom: 32px;
                    }
                    .app-header h1 {
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: var(--text-main);
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .app-header h1 svg {
                        width: 24px;
                        height: 24px;
                        color: var(--primary);
                    }
                    
                    /* Main Layout */
                    #app-body {
                        display: flex;
                        height: calc(100vh - 65px); /* Header height offset */
                        background-color: var(--card-bg);
                    }
                    #sidebar {
                        width: 260px;
                        min-width: 260px;
                        padding: 20px;
                        border-right: 1px solid var(--border-color);
                        background-color: var(--bg-color);
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                        overflow-y: auto;
                    }
                    #main-content {
                        flex: 1;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    
                    /* Create Button */
                    .btn-create {
                        background: #fff;
                        border: 1px solid var(--border-color);
                        border-radius: 24px;
                        padding: 12px 24px;
                        font-size: 1rem;
                        font-weight: 500;
                        color: var(--text-main);
                        box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        width: max-content;
                        transition: box-shadow 0.2s ease;
                    }
                    .btn-create:hover {
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
                    }
                    
                    /* Filter & Legend Bar */
                    .filter-section h3 {
                        font-size: 0.875rem;
                        font-weight: 500;
                        color: var(--text-main);
                        margin-bottom: 12px;
                        margin-top: 0;
                    }
                    .filter-bar {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        padding: 0;
                        margin: 0;
                    }
                    .filter-btn {
                        justify-content: flex-start;
                        border: none;
                        background: transparent;
                        padding: 8px 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .filter-btn:hover { background: #f1f5f9; }
                    .filter-btn.active {
                        background: #e2e8f0;
                        font-weight: 600;
                    }

                    #calendar-container {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                    }
                    #calendar {
                        flex: 1;
                    }
                    #calendar-container {
                        background: var(--card-bg);
                        padding: 24px;
                        border-radius: 16px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
                        border: 1px solid var(--border-color);
                    }
                    
                    /* FullCalendar UI Overrides */
                    .fc .fc-button-primary {
                        background-color: transparent;
                        color: var(--text-main);
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        font-weight: 500;
                        text-transform: capitalize;
                        box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
                        transition: all 0.2s ease;
                    }
                    .fc .fc-button-primary:hover {
                        background-color: #f1f5f9;
                        color: var(--text-main);
                        border-color: var(--border-color);
                    }
                    .fc .fc-button-primary:not(:disabled).fc-button-active, 
                    .fc .fc-button-primary:not(:disabled):active {
                        background-color: var(--primary);
                        color: #fff;
                        border-color: var(--primary);
                    }
                    .fc .fc-today-button {
                        background-color: var(--card-bg);
                    }
                    .fc-theme-standard th, .fc-theme-standard td, .fc-theme-standard .fc-scrollgrid {
                        border-color: var(--border-color);
                    }
                    .fc .fc-col-header-cell-cushion {
                        padding: 12px 8px;
                        font-weight: 600;
                        color: var(--text-muted);
                        text-decoration: none;
                    }
                    .fc-daygrid-day-number {
                        font-weight: 500;
                        color: var(--text-main);
                        text-decoration: none;
                        padding: 8px !important;
                    }
                    .fc .fc-day-today {
                        background-color: #eff6ff !important;
                    }
                    .fc-event {
                        border: none !important;
                        border-radius: 6px;
                        padding: 3px 6px;
                        font-size: 0.75rem;
                        font-weight: 500;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    }
                    
                    /* Report (List View) Styling */
                    .fc-list-day-cushion {
                        background-color: #f1f5f9 !important;
                        font-weight: 600;
                        padding: 10px 14px !important;
                    }
                    .fc-list-event:hover td {
                        background-color: #eff6ff !important;
                    }
                    .fc-list-event-title {
                        font-weight: 500;
                        color: var(--text-main);
                    }
                    
                    /* Print Report Styling */
                    @media print {
                        .app-header, #sidebar, .fc-header-toolbar {
                            display: none !important;
                        }
                        #app-body {
                            height: auto !important;
                            display: block !important;
                        }
                        #main-content {
                            padding: 0 !important;
                        }
                        #calendar-container {
                            box-shadow: none !important;
                            border: none !important;
                        }
                    }
                    
                    /* SweetAlert UI Overrides */
                    .swal2-popup {
                        border-radius: 16px !important;
                        padding: 24px !important;
                    }
                    .swal2-input, .swal2-select {
                        border-radius: 10px !important;
                        border: 1px solid var(--border-color) !important;
                        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05) !important;
                    }
                    .swal2-input:focus, .swal2-select:focus {
                        border-color: var(--primary) !important;
                        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2) !important;
                    }
                </style>
            </head>
            <body>
                <!-- Modern App Header -->
                <div class="app-header">
                    <h1>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        HRMS Event Calendar
                    </h1>
                </div>

                <div id="app-body">
                    <!-- Sidebar -->
                    <div id="sidebar">
                        <button class="btn-create" id="btn-create">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4V20M4 12H20" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Create
                        </button>
                        
                        <div id="mini-calendar"></div>
                        
                        <div class="filter-section">
                            <h3>My Calendars</h3>
                            <div class="filter-bar" id="event-filters">
                                <button class="filter-btn active" data-type="all">All Events</button>
                                <button class="filter-btn" data-type="leave"><span style="color:#db4437;">●</span> Leave / Time Off</button>
                                <button class="filter-btn" data-type="holiday"><span style="color:#0f9d58;">●</span> Holidays</button>
                                <button class="filter-btn" data-type="training"><span style="color:#1a73e8;">●</span> Training / Meetings</button>
                                <button class="filter-btn" data-type="anniversary"><span style="color:#f4b400;">●</span> Anniversaries</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Main Content -->
                    <div id="main-content">
                        <div id="calendar-container">
                            <div id="calendar"></div>
                        </div>
                    </div>
                </div>

                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        var calendarEl = document.getElementById('calendar');
                        var miniCalendarEl = document.getElementById('mini-calendar');
                        
                        // Abstracted Event Creation Logic
                        async function promptAddEvent(startStr, endStr, allDay) {
                            const { value: formValues } = await Swal.fire({
                                title: 'Add New Event',
                                html:
                                    '<input id="swal-input-title" class="swal2-input" placeholder="Employee Name / Event Title">' +
                                    '<select id="swal-input-type" class="swal2-select" style="width: 275px;">' +
                                        '<option value="leave">Leave / Time Off</option>' +
                                        '<option value="holiday">Public Holiday</option>' +
                                        '<option value="training">Training / Meeting</option>' +
                                        '<option value="anniversary">Birthday / Anniversary</option>' +
                                    '</select>',
                                focusConfirm: false,
                                showCancelButton: true,
                                confirmButtonText: 'Save',
                                confirmButtonColor: '#1a73e8',
                                preConfirm: () => {
                                    const title = document.getElementById('swal-input-title').value;
                                    const type = document.getElementById('swal-input-type').value;
                                    if (!title) {
                                        Swal.showValidationMessage('You need to enter a title or name!');
                                        return 'You need to enter a title!';
                                    }
                                    return { title: title, type: type };
                                }
                            });

                            if (formValues) {
                                let eventColor = '#1a73e8'; // Default Blue (Training)
                                if (formValues.type === 'leave') {
                                    eventColor = '#db4437'; // Red
                                } else if (formValues.type === 'holiday') {
                                    eventColor = '#0f9d58'; // Green
                                } else if (formValues.type === 'anniversary') {
                                    eventColor = '#f4b400'; // Yellow
                                }

                                calendar.addEvent({
                                    title: formValues.title,
                                    start: startStr,
                                    end: endStr,
                                    allDay: allDay,
                                    backgroundColor: eventColor,
                                    borderColor: eventColor,
                                    extendedProps: { 
                                        type: formValues.type,
                                        description: 'Manually added HR event'
                                    }
                                });
                                
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Event Created',
                                    toast: true,
                                    position: 'bottom-end',
                                    showConfirmButton: false,
                                    timer: 3000
                                });
                            }
                        }

                        // Initialize Mini Calendar
                        var miniCalendar = new FullCalendar.Calendar(miniCalendarEl, {
                            initialView: 'dayGridMonth',
                            headerToolbar: {
                                left: 'prev',
                                center: 'title',
                                right: 'next'
                            },
                            contentHeight: 'auto',
                            fixedWeekCount: false,
                            showNonCurrentDates: false,
                            dateClick: function(info) {
                                calendar.gotoDate(info.dateStr);
                                calendar.changeView('timeGridDay');
                            }
                        });
                        miniCalendar.render();

                        var calendar = new FullCalendar.Calendar(calendarEl, {
                            initialView: 'timeGridWeek', // Default to week view like Google Calendar
                            customButtons: {
                                printReport: {
                                    text: '🖶 Print Report',
                                    click: function() {
                                        window.print();
                                    }
                                }
                            },
                            headerToolbar: {
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth,listYear,printReport'
                            },
                            buttonText: {
                                listMonth: 'Monthly Report',
                                listYear: 'Yearly Report'
                            },
                            slotMinTime: '10:00:00', // Start calendar at 10 AM
                            slotMaxTime: '18:30:00', // End calendar at 6:30 PM
                            businessHours: {
                                daysOfWeek: [ 1, 2, 3, 4, 5 ], // Monday - Friday
                                startTime: '08:00',
                                endTime: '18:00',
                            },
                            navLinks: true, // can click day/week names to navigate views
                            editable: true,
                            selectable: true,
                            selectMirror: true,
                            nowIndicator: true,
                            dayMaxEvents: true, // allow "more" link when too many events
                            
                            // Triggered when a user highlights a time slot
                            select: async function(info) {
                                const { value: formValues } = await Swal.fire({
                                    title: 'Add New Event',
                                    html:
                                        '<input id="swal-input-title" class="swal2-input" placeholder="Employee Name / Event Title">' +
                                        '<select id="swal-input-type" class="swal2-select" style="width: 275px;">' +
                                            '<option value="leave">Leave / Time Off</option>' +
                                            '<option value="holiday">Public Holiday</option>' +
                                            '<option value="training">Training / Meeting</option>' +
                                            '<option value="anniversary">Birthday / Anniversary</option>' +
                                        '</select>',
                                    focusConfirm: false,
                                    showCancelButton: true,
                                    confirmButtonText: 'Save',
                                    confirmButtonColor: '#1a73e8',
                                    preConfirm: () => {
                                        const title = document.getElementById('swal-input-title').value;
                                        const type = document.getElementById('swal-input-type').value;
                                        if (!title) {
                                            Swal.showValidationMessage('You need to enter a title or name!');
                                            return 'You need to enter a title!'
                                        }
                                        return { title: title, type: type };
                                    }
                                });

                                if (formValues) {
                                    let eventColor = '#1a73e8'; // Default Blue (Training)
                                    if (formValues.type === 'leave') {
                                        eventColor = '#db4437'; // Red
                                    } else if (formValues.type === 'holiday') {
                                        eventColor = '#0f9d58'; // Green
                                    } else if (formValues.type === 'anniversary') {
                                        eventColor = '#f4b400'; // Yellow
                                    }

                                    calendar.addEvent({
                                        title: formValues.title,
                                        start: info.startStr,
                                        end: info.endStr,
                                        allDay: info.allDay,
                                        backgroundColor: eventColor,
                                        borderColor: eventColor,
                                        extendedProps: { 
                                            type: formValues.type,
                                            description: 'Manually added HR event'
                                        }
                                    });
                                    
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Event Created',
                                        toast: true,
                                        position: 'bottom-end',
                                        showConfirmButton: false,
                                        timer: 3000
                                    });
                                }
                                calendar.unselect();
                            },

                            // Triggered when a user clicks an existing event
                            eventClick: function(info) {
                                Swal.fire({
                                    title: info.event.title,
                                    text: 'Do you want to delete this event?',
                                    icon: 'question',
                                    showCancelButton: true,
                                    confirmButtonColor: '#d33',
                                    cancelButtonColor: '#747474',
                                    confirmButtonText: 'Delete Event'
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        info.event.remove();
                                        Swal.fire({
                                            icon: 'success',
                                            title: 'Deleted',
                                            toast: true,
                                            position: 'bottom-end',
                                            showConfirmButton: false,
                                            timer: 3000
                                        });
                                    }
                                });
                            },

                            // Triggered when an event is dragged and dropped
                            eventDrop: function(info) {
                                Swal.fire({ icon: 'info', title: 'Event Rescheduled', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000 });
                            },
                            
                            // Triggered when an event's duration is stretched
                            eventResize: function(info) {
                                Swal.fire({ icon: 'info', title: 'Duration Updated', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000 });
                            },

                            events: [
                                // HRMS Mock Data
                                { title: 'John Doe - Sick Leave', start: new Date().toISOString().split('T')[0] + 'T09:00:00', end: new Date().toISOString().split('T')[0] + 'T18:00:00', backgroundColor: '#db4437', borderColor: '#db4437' },
                                { title: 'New Hire Orientation', start: new Date().toISOString().split('T')[0] + 'T10:00:00', end: new Date().toISOString().split('T')[0] + 'T12:00:00', backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
                                { title: 'National Holiday', start: new Date().toISOString().split('T')[0], allDay: true, backgroundColor: '#0f9d58', borderColor: '#0f9d58' }
                            ]
                        });

                        calendar.render();
                    });
                </script>
            </body>
            </html>`;

            context.response.write(htmlContent);
        }
    };

    return { onRequest };
});