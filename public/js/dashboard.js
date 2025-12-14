// ==========================================
// Real-time Clock
// ==========================================
function updateClock() {
    const now = new Date();

    // Time format: HH:MM
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeEl = document.getElementById('currentTime');
    const dateThaiEl = document.getElementById('currentDateThai');
    const dateEngEl = document.getElementById('currentDateEng');

    if (timeEl) timeEl.textContent = `${hours}:${minutes}`;

    // Thai date format
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

    const thaiDay = thaiDays[now.getDay()];
    const thaiDate = now.getDate();
    const thaiMonth = thaiMonths[now.getMonth()];
    const thaiYear = now.getFullYear() + 543; // Buddhist Era

    if (dateThaiEl) dateThaiEl.textContent = `${thaiDay}, ${thaiDate} ${thaiMonth} ${thaiYear}`;

    // English date format
    const engDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const engMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const engDay = engDays[now.getDay()];
    const engMonth = engMonths[now.getMonth()];
    const engYear = now.getFullYear();

    if (dateEngEl) dateEngEl.textContent = `${engDay}, ${engMonth} ${thaiDate} ${engYear}`;
}

// Update clock immediately and every second
updateClock();
setInterval(updateClock, 1000);

// ==========================================
// Navigation Menu Handlers
// ==========================================
const navItems = document.querySelectorAll('.nav-item');
const contentArea = document.getElementById('contentArea');

// Set active state based on current URL
function updateActiveNavFromURL() {
    const path = window.location.pathname;
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && path === href) {
            item.classList.add('active');
        } else if (path === '/dashboard' || path === '/') {
            // No nav item is active on dashboard home
            item.classList.remove('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Initialize active state on page load
updateActiveNavFromURL();

function updateActiveNav(page) {
    navItems.forEach(nav => {
        if (nav.getAttribute('data-page') === page) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });
}


// ==========================================
// Dark Mode Toggle
// ==========================================

const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('change', function () {
        if (this.checked) {
            alert('โหมดมืดจะเปิดให้ใช้งานในเร็วๆ นี้');
            this.checked = false;
        }
    });
}

// ==========================================
// Logout Handler
// ==========================================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
        if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
            // Redirect to login page
            window.location.href = '/';
        }
    });
}

// ==========================================
// Help System
// ==========================================
const helpBtn = document.getElementById('helpBtn');
const helpMenu = document.getElementById('helpMenu');
const helpModal = document.getElementById('helpModal');
const modalClose = document.getElementById('modalClose');
const helpMenuItems = document.querySelectorAll('.help-menu-item');

// Help content data
const helpContent = {
    usage: {
        title: 'วิธีการใช้งาน',
        body: `
            <p>ขั้นตอนการใช้งานระบบ BloodLink:</p>
            <ul>
                <li>เข้าสู่ระบบด้วยบัญชีผู้ใช้ที่ได้รับการอนุมัติแล้ว</li>
                <li>ใช้เมนูด้านซ้ายเพื่อนำทางไปยังส่วนต่างๆ ของระบบ</li>
                <li>ผลตรวจเลือด - ดูและจัดการผลการตรวจเลือด</li>
                <li>ประวัติผู้ป่วย - เข้าถึงข้อมูลประวัติการรักษา</li>
                <li>วันนัดหมาย - ตรวจสอบและจัดการนัดหมาย</li>
            </ul>
            <p>หากต้องการความช่วยเหลือเพิ่มเติม กรุณาติดต่อทีมสนับสนุน</p>
        `
    },
    contact: {
        title: 'การสอบถาม',
        body: `
            <p>ช่องทางการติดต่อสอบถามข้อมูล:</p>
            <ul>
                <li><strong>อีเมล:</strong> support@bloodlink.com</li>
                <li><strong>โทรศัพท์:</strong> 02-XXX-XXXX</li>
                <li><strong>เวลาทำการ:</strong> จันทร์-ศุกร์ 8:00-17:00 น.</li>
            </ul>
            <p>ทีมงานของเราพร้อมให้บริการและตอบคำถามทุกข้อสงสัย</p>
        `
    },
    complaint: {
        title: 'ร้องเรียน',
        body: `
            <p>หากพบปัญหาหรือต้องการร้องเรียน กรุณาดำเนินการดังนี้:</p>
            <ul>
                <li>ส่งอีเมลพร้อมรายละเอียดไปที่ complaint@bloodlink.com</li>
                <li>โทรศัพท์ติดต่อฝ่ายร้องเรียน: 02-XXX-YYYY</li>
                <li>หรือกรอกแบบฟอร์มร้องเรียนออนไลน์ในระบบ</li>
            </ul>
            <p>เราให้ความสำคัญกับทุกข้อเสนอแนะเพื่อพัฒนาบริการให้ดียิ่งขึ้น</p>
        `
    }
};

// Toggle help menu
if (helpBtn && helpMenu) {
    helpBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        helpMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!helpMenu.contains(e.target) && !helpBtn.contains(e.target)) {
            helpMenu.classList.remove('active');
        }
    });
}

// Handle help menu item clicks
if (helpMenuItems) {
    helpMenuItems.forEach(item => {
        item.addEventListener('click', function () {
            const helpType = this.getAttribute('data-help');
            const content = helpContent[helpType];

            if (content && helpModal) {
                // Set modal content
                document.getElementById('modalTitle').textContent = content.title;
                document.getElementById('modalBody').innerHTML = content.body;

                // Show modal
                helpModal.classList.add('active');
                helpMenu.classList.remove('active');
            }
        });
    });
}

// Close modal
if (modalClose && helpModal) {
    modalClose.addEventListener('click', function () {
        helpModal.classList.remove('active');
    });

    // Close modal when clicking overlay
    helpModal.addEventListener('click', function (e) {
        if (e.target === this || e.target.classList.contains('help-modal-overlay')) {
            this.classList.remove('active');
        }
    });

    // Close modal with ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && helpModal.classList.contains('active')) {
            helpModal.classList.remove('active');
        }
    });
}

// ==========================================
// Home Button Handler
// ==========================================
const homeBtn = document.querySelector('.home-btn');
if (homeBtn) {
    homeBtn.addEventListener('click', function (e) {
        // Check if we are in admin section - redirect to admin dashboard instead
        if (window.location.pathname.startsWith('/admin')) {
            e.preventDefault();
            window.location.href = '/admin-dashboard';
            return;
        }
        // Otherwise, let the link work naturally (goes to /dashboard)
    });
}

// ==========================================
// Profile Button Handler
// ==========================================
const profileBtn = document.querySelector('.profile-btn');
if (profileBtn) {
    profileBtn.addEventListener('click', function () {
        alert('ฟีเจอร์โปรไฟล์จะเปิดให้ใช้งานในเร็วๆ นี้');
    });
}

// ==========================================
// Search Functionality
// ==========================================
const searchInput = document.querySelector('.search-input');
if (searchInput) {
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                alert('การค้นหา: ' + query + '\nฟีเจอร์นี้กำลังอยู่ระหว่างการพัฒนา');
                this.value = '';
            }
        }
    });
}

// ==========================================
// Initialize on Load
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('Dashboard initialized');

    // Get user info from URL if available (session token system)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        console.log('User session token:', token);
        // Store token for future API calls
        sessionStorage.setItem('sessionToken', token);

        // Remove token from URL for cleaner look
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }

    // Active nav is already set by updateActiveNavFromURL() at the top
});

// ==========================================
// HN Search Modal Logic
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const searchTrigger = document.getElementById('search-trigger');
    const hnModal = document.getElementById('hn-search-modal');
    const cancelHnBtn = document.getElementById('cancel-hn-search');
    const confirmHnBtn = document.getElementById('confirm-hn-search');
    const hnInputs = document.querySelectorAll('.hn-digit-input');
    const hnErrorMsg = document.getElementById('hn-error-msg');

    if (searchTrigger && hnModal) {
        // Open Modal
        searchTrigger.addEventListener('click', function () {
            hnModal.style.display = 'flex';
            hnInputs[0].focus();
            resetHnInputs();
        });

        // Close Modal
        cancelHnBtn.addEventListener('click', function () {
            hnModal.style.display = 'none';
        });

        hnModal.addEventListener('click', function (e) {
            if (e.target === hnModal) {
                hnModal.style.display = 'none';
            }
        });

        // Input Logic
        hnInputs.forEach((input, index) => {
            // Auto-focus next input
            input.addEventListener('input', function () {
                if (this.value.length === 1) {
                    if (index < hnInputs.length - 1) {
                        hnInputs[index + 1].focus();
                    }
                }
            });

            // Handle Backspace
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && this.value.length === 0) {
                    if (index > 0) {
                        hnInputs[index - 1].focus();
                    }
                }
            });

            // Allow only numbers
            input.addEventListener('keypress', function (e) {
                if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                }
            });
        });

        // Search Logic
        confirmHnBtn.addEventListener('click', async function () {
            let hn = '';
            hnInputs.forEach(input => hn += input.value);

            if (hn.length === 0) {
                hnErrorMsg.textContent = 'กรุณากรอกรหัส HN';
                hnErrorMsg.style.display = 'block';
                return;
            }

            if (hn.length !== 9) {
                hnErrorMsg.textContent = 'รหัส HN ต้องมี 9 หลัก';
                hnErrorMsg.style.display = 'block';
                return;
            }

            // Show loading state (optional)
            const originalBtnText = confirmHnBtn.innerText;
            confirmHnBtn.innerText = 'กำลังค้นหา...';
            confirmHnBtn.disabled = true;

            try {
                // Check if patient exists by checking the URL
                const response = await fetch(`/patient-detail?hn=${hn}`, { method: 'HEAD' });

                if (response.ok) {
                    // Found
                    window.location.href = `/patient-detail?hn=${hn}`;
                } else {
                    // Not found (404) or other error
                    hnErrorMsg.textContent = 'ไม่พบรหัสโรงพยาบาล(HN) นี้ในระบบ';
                    hnErrorMsg.style.display = 'block';
                }
            } catch (error) {
                console.error('Search error:', error);
                hnErrorMsg.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
                hnErrorMsg.style.display = 'block';
            } finally {
                confirmHnBtn.innerText = originalBtnText;
                confirmHnBtn.disabled = false;
            }
        });

        function resetHnInputs() {
            hnInputs.forEach(input => input.value = '');
            hnErrorMsg.style.display = 'none';
        }
    }
});

// ==========================================
// Global Notification System
// ==========================================
const notificationOverlay = document.getElementById('global-notification-popup');
const notificationCancelBtn = document.getElementById('notificationCancelBtn');
const debugNotifyBtn = document.getElementById('debugNotifyBtn');

// Function to show notification
function showNotification(type, title, message, time) {
    if (!notificationOverlay) return;

    // Set content
    document.getElementById('notificationTitle').textContent = title;
    document.getElementById('notificationMessage').textContent = message;
    document.getElementById('notificationTime').textContent = time || new Date().toLocaleString('th-TH');

    // Handle Icons
    const iconContainer = document.getElementById('notificationIconContainer');
    const successIcon = iconContainer.querySelector('.success-icon');
    const timeIcon = iconContainer.querySelector('.time-icon');

    // Hide all icons first
    successIcon.classList.add('hidden');
    timeIcon.classList.add('hidden');

    // Show appropriate icon
    if (type === 'success') {
        successIcon.classList.remove('hidden');
    } else if (type === 'time' || type === 'info') {
        timeIcon.classList.remove('hidden');
    }

    // Show overlay
    notificationOverlay.classList.remove('hidden');
    // Small delay to allow display:block to apply before opacity transition
    setTimeout(() => {
        notificationOverlay.classList.add('active');
    }, 10);
}

// Function to hide notification
function hideNotification() {
    if (!notificationOverlay) return;

    notificationOverlay.classList.remove('active');

    // Wait for transition to finish before hiding
    setTimeout(() => {
        notificationOverlay.classList.add('hidden');
    }, 300);
}


// Event Listeners
if (notificationCancelBtn) {
    notificationCancelBtn.addEventListener('click', hideNotification);
}


// Close on click outside card
if (notificationOverlay) {
    notificationOverlay.addEventListener('click', function (e) {
        if (e.target === notificationOverlay) {
            hideNotification();
        }
    });
}

// Debug Triggers
const debugNotifySuccessBtn = document.getElementById('debugNotifySuccessBtn');
const debugNotifyTimeBtn = document.getElementById('debugNotifyTimeBtn');
const debugNotifySendBtn = document.getElementById('debugNotifySendBtn');

function triggerDebugNotification(type) {
    let data;
    if (type === 'success') {
        data = {
            type: 'success',
            title: 'ผลเลือดออก',
            message: 'ผลเลือดออกแล้ว',
            time: '12:00 , 13/05/2568'
        };
    } else if (type === 'time') {
        data = {
            type: 'time',
            title: 'เจาะเลือด',
            message: 'ถึงเวลาเจาะเลือด',
            time: '08:00 , 13/05/2568'
        };
    } else if (type === 'send') {
        data = {
            type: 'time', // Uses time icon (clock)
            title: 'ส่งเลือดตรวจ',
            message: 'นำส่งเลือดตรวจ ห้องปฏิบัติการ',
            time: '16:00 , 12/05/2568'
        };
    } else if (type === 'sent_success') {
        data = {
            type: 'success', // Uses success icon (check)
            title: 'ส่งผลเลือดสำเร็จ',
            message: 'ส่งผลเลือดเรียบร้อยแล้ว',
            time: '16:00 , 12/05/2568'
        };
    }

    if (data) {
        showNotification(data.type, data.title, data.message, data.time);

        // Close help menu
        const helpMenu = document.getElementById('helpMenu');
        if (helpMenu) helpMenu.classList.remove('active');
    }
}

if (debugNotifySuccessBtn) {
    debugNotifySuccessBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerDebugNotification('success');
    });
}

if (debugNotifyTimeBtn) {
    debugNotifyTimeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerDebugNotification('time');
    });
}

if (debugNotifySendBtn) {
    debugNotifySendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerDebugNotification('send');
    });
}

const debugNotifySentSuccessBtn = document.getElementById('debugNotifySentSuccessBtn');
if (debugNotifySentSuccessBtn) {
    debugNotifySentSuccessBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerDebugNotification('sent_success');
    });
}

// Expose to global scope for console debugging
window.showNotification = showNotification;

// Lab Restriction Popup
function showLabRestrictionPopup() {
    showNotification(
        'info',
        'ไม่สามารถเข้าถึงได้',
        'ผู้ใช้ Lab ไม่สามารถเพิ่มผู้ป่วยใหม่ได้',
        new Date().toLocaleString('th-TH')
    );
}
window.showLabRestrictionPopup = showLabRestrictionPopup;

