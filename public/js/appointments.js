document.addEventListener('DOMContentLoaded', function () {
    const appointments = window.appointmentsData || [];

    // Calendar Elements
    const calendarMonth = document.querySelector('.calendar-month');
    const calendarGrid = document.querySelector('.calendar-grid');
    const prevBtn = document.querySelector('.calendar-nav-btn:first-child');
    const nextBtn = document.querySelector('.calendar-nav-btn:last-child');

    // Schedule Elements
    const scheduleDate = document.querySelector('.schedule-header h3');
    const scheduleContainer = document.querySelector('.schedule-items');

    let currentDate = new Date(); // Start with today
    let selectedDate = new Date(); // Currently selected date (defaults to today)

    // Initialize
    renderCalendar(currentDate);
    updateSchedule(selectedDate);

    // Event Listeners
    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        // Update Header
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        calendarMonth.textContent = `${monthNames[month]} ${year}`;

        // Clear Grid (keep headers)
        const dayHeaders = calendarGrid.querySelectorAll('.calendar-day-name');
        calendarGrid.innerHTML = '';
        dayHeaders.forEach(header => calendarGrid.appendChild(header));

        // Calculate Days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = Sunday

        // Previous Month Padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day muted';
            dayDiv.textContent = prevMonthLastDay - i;
            calendarGrid.appendChild(dayDiv);
        }

        // Current Month Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = i;

            // Generate comparison strings (YYYY-MM-DD or D/M/YYYY)
            // Appointment dates from sheet are likely "D/M/YYYY" or similar format
            // We need to match standardized formats.
            // Let's assume sheet data is Thai Buddhist year or similar, but let's try strict matching first.

            // Check for appointments
            const currentDayString = `${i}/${month + 1}/${year + 543}`; // Using Thai Year logic found in codebase
            const hasAppt = appointments.some(appt => {
                // Simple loose match if data varies
                return appt.appointmentDate && appt.appointmentDate.includes(currentDayString);
            });

            if (hasAppt) {
                dayDiv.classList.add('has-appointment'); // You might need CSS for this
                dayDiv.style.fontWeight = 'bold';
                dayDiv.style.color = 'var(--primary-color)';
            }

            // Check if selected
            if (selectedDate &&
                i === selectedDate.getDate() &&
                month === selectedDate.getMonth() &&
                year === selectedDate.getFullYear()) {
                dayDiv.classList.add('active');
            }

            // Click Handler
            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
                dayDiv.classList.add('active');
                selectedDate = new Date(year, month, i);
                updateSchedule(selectedDate);
            });

            calendarGrid.appendChild(dayDiv);
        }
    }

    function updateSchedule(date) {
        // Format Date Header (e.g., "May 9, 2025")
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        scheduleDate.textContent = date.toLocaleDateString('en-US', options);

        // Filter appointments
        // Need to robustly match the date format stored (likely Thai D/M/YYYY)
        const thaiYear = date.getFullYear() + 543;
        const searchString = `${date.getDate()}/${date.getMonth() + 1}/${thaiYear}`;

        const dailyAppointments = appointments.filter(appt => {
            // Handle case where date might be single digit day/month
            return appt.appointmentDate === searchString ||
                appt.appointmentDate === `0${date.getDate()}/${date.getMonth() + 1}/${thaiYear}` ||
                (appt.appointmentDate && appt.appointmentDate.includes(searchString));
        });

        // Sort by time
        dailyAppointments.sort((a, b) => {
            const timeA = a.appointmentTime || '23:59';
            const timeB = b.appointmentTime || '23:59';
            return timeA.localeCompare(timeB);
        });

        // Render List
        scheduleContainer.innerHTML = '';

        // Add Count Header
        const countHeader = document.createElement('div');
        countHeader.style.padding = '0 0 12px 0';
        countHeader.style.color = '#64748B';
        countHeader.style.fontSize = '14px';
        countHeader.innerHTML = `จำนวนผู้ป่วยทั้งหมด: <span style="font-weight: 600; color: #0F172A;">${dailyAppointments.length}</span> คน`;
        scheduleContainer.appendChild(countHeader);

        if (dailyAppointments.length === 0) {
            scheduleContainer.innerHTML += '<p style="text-align:center; color: #94A3B8; padding: 20px; background: #F8FAFC; border-radius: 8px;">ไม่มีนัดหมายในวันนี้</p>';
            return;
        }

        dailyAppointments.forEach(appt => {
            const item = document.createElement('div');
            item.className = 'schedule-item';
            // Determine status color based on time (past/future) could be a nice touch, keeping blue for now
            item.innerHTML = `
                <div class="schedule-indicator blue"></div>
                <div class="schedule-info">
                    <h4 style="font-size: 15px; font-weight: 500; color: #1E293B;">${appt.name} ${appt.surname}</h4>
                    <p style="font-size: 13px; color: #64748B; margin-top: 2px;">
                        <span style="display: inline-block; background: #EEF2FF; color: #4F46E5; padding: 2px 6px; border-radius: 4px; font-weight: 500;">
                            ${appt.appointmentTime || 'ไม่ระบุเวลา'}
                        </span>
                        <span style="margin-left: 8px;">HN: ${appt.hn}</span>
                    </p>
                </div>
            `;
            scheduleContainer.appendChild(item);
        });
    }
});
