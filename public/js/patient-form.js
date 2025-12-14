// ==========================================
// Patient Form Submission Handler
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    // Get all confirm buttons (there might be multiple forms on different pages)
    const confirmButtons = document.querySelectorAll('.btn-confirm');

    confirmButtons.forEach(button => {
        button.addEventListener('click', async function (e) {
            e.preventDefault();

            const formId = this.getAttribute('data-form-id');
            const prefix = formId.replace('Form', '');

            // Helper function to get field value
            function getFieldValue(fieldName) {
                // Try to find by name attribute since IDs may not be generated
                let element = document.querySelector(`[name="${fieldName}"]`);

                if (!element) {
                    // Try with prefix
                    element = document.querySelector(`[name="${prefix}_${fieldName}"]`);
                }

                if (!element) {
                    console.warn(`Field not found: ${fieldName}`);
                    return '';
                }

                if (element.type === 'radio') {
                    const checked = document.querySelector(`input[name="${fieldName}"]:checked`);
                    return checked ? checked.value : '';
                }

                return element.value.trim();
            }

            // Collect form data
            const patientData = {
                hn: getFieldValue('hn'),
                name: getFieldValue('firstName'),
                surname: getFieldValue('lastName'),
                gender: getFieldValue('gender'),
                age: getFieldValue('age'),
                bloodType: getFieldValue('bloodType'),
                disease: getFieldValue('underlyingDisease'),
                medication: getFieldValue('medication'),
                allergies: getFieldValue('allergies'),
                latestReceipt: getFieldValue('lastTransfusion'),
                testType: getFieldValue('examinationType')
            };

            console.log('Collected patient data:', patientData);

            // Validate required fields
            if (!patientData.hn) {
                alert('กรุณากรอก HN');
                return;
            }

            // Enforce 9-digit HN
            if (!/^\d{9}$/.test(patientData.hn)) {
                alert('รหัส HN ต้องเป็นตัวเลข 9 หลักถ้วน');
                return;
            }

            if (!patientData.name) {
                alert('กรุณากรอกชื่อ');
                return;
            }

            if (!patientData.surname) {
                alert('กรุณากรอกนามสกุล');
                return;
            }

            // Disable button during submission
            this.disabled = true;
            this.textContent = 'กำลังบันทึก...';

            try {
                const response = await fetch('/add-patient', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(patientData)
                });

                const result = await response.json();

                if (result.success) {
                    alert(result.message || 'บันทึกข้อมูลผู้ป่วยสำเร็จ');

                    // Redirect to history page
                    window.location.href = '/history';
                } else {
                    alert(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            } finally {
                // Re-enable button
                this.disabled = false;
                this.textContent = 'ยืนยัน';
            }
        });
    });

    // Cancel button handler
    const cancelButtons = document.querySelectorAll('.btn-cancel');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('คุณต้องการยกเลิกการกรอกข้อมูลหรือไม่?')) {
                clearForm();
            }
        });
    });

    // Helper function to clear form
    function clearForm() {
        // Clear all text inputs
        document.querySelectorAll('.form-input').forEach(input => {
            input.value = '';
        });

        // Clear all dropdowns
        document.querySelectorAll('.form-dropdown').forEach(dropdown => {
            dropdown.selectedIndex = 0;
        });

        // Uncheck all radio buttons
        document.querySelectorAll('.radio-input').forEach(radio => {
            radio.checked = false;
        });
    }
});
