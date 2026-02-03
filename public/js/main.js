// ==========================================
// Shared Logic & Globals
// ==========================================

// Eye icon SVG (visible) - eye open
const eyeOpenSvg = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#9CA3AF"/>
</svg>
`;

// Eye closed icon SVG (hidden) - eye with slash
const eyeClosedSvg = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// Password toggle functionality for Login
const passwordToggle = document.getElementById('passwordToggle');
const passwordInput = document.getElementById('password');

if (passwordToggle && passwordInput) {
    let isPasswordVisible = false;
    passwordToggle.addEventListener('click', function () {
        isPasswordVisible = !isPasswordVisible;
        if (isPasswordVisible) {
            passwordInput.type = 'text';
            passwordToggle.innerHTML = eyeClosedSvg;
        } else {
            passwordInput.type = 'password';
            passwordToggle.innerHTML = eyeOpenSvg;
        }
    });
    // Initialize
    passwordToggle.innerHTML = eyeOpenSvg;
}

// Navigation & Animation Logic
const loginWrapper = document.getElementById('loginWrapper');
const registerWrapper = document.getElementById('registerWrapper');
const registerBtn = document.getElementById('registerBtn');
const loginLink = document.getElementById('loginLink');

function updateRightPanelOverflow() {
    const rightPanel = document.querySelector('.right-panel');
    if (!rightPanel || !loginWrapper || !registerWrapper) return;

    const isRegisterActive = registerWrapper.classList.contains('active');
    const isLoginActive = loginWrapper.classList.contains('active');

    rightPanel.classList.remove('login-active', 'register-active');

    if (isRegisterActive) {
        rightPanel.classList.add('register-active');
    } else {
        rightPanel.classList.add('login-active');
    }
}

function showRegister() {
    if (!loginWrapper || !registerWrapper) return;

    loginWrapper.classList.remove('active', 'slide-out-left', 'slide-in-left', 'slide-in-right');
    registerWrapper.classList.remove('active', 'slide-out-right', 'slide-in-left', 'slide-in-right');

    loginWrapper.classList.add('slide-out-left');
    loginWrapper.classList.remove('active');

    setTimeout(() => {
        registerWrapper.classList.remove('slide-out-right');
        registerWrapper.classList.add('active', 'slide-in-right');
        updateRightPanelOverflow();
        const rightPanel = document.querySelector('.right-panel');
        if (rightPanel) rightPanel.scrollTop = 0;
    }, 50);
}

function showLogin() {
    if (!loginWrapper || !registerWrapper) return;

    loginWrapper.classList.remove('active', 'slide-out-left', 'slide-in-left', 'slide-in-right');
    registerWrapper.classList.remove('active', 'slide-out-right', 'slide-in-left', 'slide-in-right');

    registerWrapper.classList.add('slide-out-right');
    registerWrapper.classList.remove('active');

    setTimeout(() => {
        loginWrapper.classList.remove('slide-out-left');
        loginWrapper.classList.add('active', 'slide-in-left');
        updateRightPanelOverflow();
        const rightPanel = document.querySelector('.right-panel');
        if (rightPanel) rightPanel.scrollTop = 0;
    }, 50);
}

function initRightPanel() {
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
        rightPanel.classList.add('login-active');
        updateRightPanelOverflow();
    }
}

// Event Listeners
window.addEventListener('DOMContentLoaded', function () {
    setTimeout(initRightPanel, 100);
});

if (registerBtn) {
    registerBtn.addEventListener('click', function (e) {
        e.preventDefault();
        showRegister();
    });
}

if (loginLink) {
    loginLink.addEventListener('click', function (e) {
        e.preventDefault();
        showLogin();
    });
}

const forgotPasswordLink = document.querySelector('.forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function (e) {
        e.preventDefault();
        alert('ฟีเจอร์รีเซ็ตรหัสผ่านจะถูกพัฒนาต่อไป');
    });
}

// ==========================================
// Registration & Login Logic
// ==========================================
(function () {
    // Confirm Password Toggle
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    let isConfirmPasswordVisible = false;

    if (confirmPasswordToggle && confirmPasswordInput) {
        confirmPasswordToggle.addEventListener('click', function () {
            isConfirmPasswordVisible = !isConfirmPasswordVisible;
            if (isConfirmPasswordVisible) {
                confirmPasswordInput.type = 'text';
                confirmPasswordToggle.innerHTML = eyeClosedSvg;
            } else {
                confirmPasswordInput.type = 'password';
                confirmPasswordToggle.innerHTML = eyeOpenSvg;
            }
        });
        confirmPasswordToggle.innerHTML = eyeOpenSvg;
    }

    // Register Password Toggle
    const registerPasswordToggle = document.getElementById('registerPasswordToggle');
    const registerPasswordInput = document.getElementById('registerPassword');
    let isRegisterPasswordVisible = false;

    if (registerPasswordToggle && registerPasswordInput) {
        registerPasswordToggle.addEventListener('click', function () {
            isRegisterPasswordVisible = !isRegisterPasswordVisible;
            if (isRegisterPasswordVisible) {
                registerPasswordInput.type = 'text';
                registerPasswordToggle.innerHTML = eyeClosedSvg;
            } else {
                registerPasswordInput.type = 'password';
                registerPasswordToggle.innerHTML = eyeOpenSvg;
            }
        });
        registerPasswordToggle.innerHTML = eyeOpenSvg;
    }

    // Register Form Submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const password = registerPasswordInput ? registerPasswordInput.value : '';
            const confirmPassword = confirmPasswordInput.value;

            if (password !== confirmPassword) {
                alert('Passwords do not match. Please try again.');
                confirmPasswordInput.focus();
                return;
            }

            const formData = {
                action: 'register',
                role: document.getElementById('role').value,
                name: document.getElementById('name').value,
                surname: document.getElementById('surname').value,
                email: document.getElementById('registerEmail').value,
                password: password,
                hospital: document.getElementById('hospital').value,
                hospitalName: document.getElementById('hospitalName').value,
                privacyPolicy: document.getElementById('privacyPolicy').checked
            };

            if (!formData.privacyPolicy) {
                alert('กรุณายอมรับเงื่อนไข Privacy Policy');
                return;
            }

            if (password.length < 6) {
                alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
                return;
            }

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.disabled = true;
            submitBtn.innerText = 'กำลังบันทึก...';

            // REPLACED google.script.run with fetch
            fetch('/api/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })
            .then(response => response.json())
            .then(response => {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;

                if (response.success) {
                    alert('ลงทะเบียนสำเร็จ! กำลังไปหน้าเข้าสู่ระบบ...');
                    if (typeof showLogin === 'function') {
                        showLogin();
                    } else {
                        location.reload();
                    }
                    registerForm.reset();
                } else {
                    alert('เกิดข้อผิดพลาด: ' + response.message);
                }
            })
            .catch(error => {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error);
            });
        });
    }

    // Login Form Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = {
                action: 'login',
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.disabled = true;
            submitBtn.innerText = 'กำลังเข้าสู่ระบบ...';

            // REPLACED google.script.run with fetch
            fetch('/api/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })
            .then(response => response.json())
            .then(response => {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;

                if (response.success) {
                    // Redirect to dashboard with session token
                    // In Node.js app, we might handle session differently, but keeping token param for now
                    const baseUrl = window.location.origin;
                    const dashboardUrl = baseUrl + '/dashboard?token=' + encodeURIComponent(response.token);
                    window.location.href = dashboardUrl;
                } else {
                    alert('เข้าสู่ระบบไม่สำเร็จ: ' + response.message);
                }
            })
            .catch(error => {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error);
            });
        });
    }

})();
