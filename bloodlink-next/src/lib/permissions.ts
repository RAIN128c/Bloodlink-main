// ===== Official Roles =====
// Only these 4 roles are valid in the system
export enum Role {
    DOCTOR = 'แพทย์',
    NURSE = 'พยาบาล',
    LAB = 'เจ้าหน้าที่ห้องปฏิบัติการ',
    ADMIN = 'ผู้ดูแล'
}

// List of valid roles for validation
export const VALID_ROLES = [Role.DOCTOR, Role.NURSE, Role.LAB, Role.ADMIN] as const;

// ===== Status Workflow Configuration =====
// Ordered list of all patient statuses
export const STATUS_ORDER = ['รอตรวจ', 'นัดหมาย', 'รอแล็บรับเรื่อง', 'รอจัดส่ง', 'กำลังจัดส่ง', 'กำลังตรวจ', 'เสร็จสิ้น'] as const;
export type PatientStatus = typeof STATUS_ORDER[number];

// Role-based transition permissions
// Key format: "fromStatus→toStatus"
// Admin can always perform any transition (handled separately)
export const STATUS_TRANSITIONS: Record<string, { allowedRoles: string[], description: string }> = {
    'รอตรวจ→นัดหมาย': {
        allowedRoles: ['แพทย์', 'พยาบาล'],
        description: 'แพทย์หรือพยาบาลนัดหมายเจาะเลือด'
    },
    'รอตรวจ→รอแล็บรับเรื่อง': {
        allowedRoles: ['แพทย์', 'พยาบาล'],
        description: 'สั่งเจาะเลือด (ส่งเรื่องให้แล็บ)'
    },
    'นัดหมาย→รอแล็บรับเรื่อง': {
        allowedRoles: ['แพทย์', 'พยาบาล'],
        description: 'สั่งเจาะเลือดจากนัดหมาย (ส่งเรื่องให้แล็บ)'
    },
    'รอแล็บรับเรื่อง→รอจัดส่ง': {
        allowedRoles: ['เจ้าหน้าที่ห้องปฏิบัติการ'],
        description: 'แล็บรับคำขอส่งตรวจ (พร้อมสำหรับการเจาะ/จัดส่ง)'
    },
    'รอจัดส่ง→กำลังจัดส่ง': {
        allowedRoles: ['พยาบาล'],
        description: 'พยาบาลแพ็คและจัดส่งตัวอย่าง'
    },
    'กำลังจัดส่ง→กำลังตรวจ': {
        allowedRoles: ['เจ้าหน้าที่ห้องปฏิบัติการ'],
        description: 'แล็บได้รับตัวอย่าง เริ่มตรวจวิเคราะห์'
    },
    'กำลังตรวจ→เสร็จสิ้น': {
        allowedRoles: ['แพทย์'],
        description: 'แพทย์ตรวจสอบและยืนยันผล'
    },
    // Special: Recheck transition - allows Doctor to restart the process
    'เสร็จสิ้น→รอตรวจ': {
        allowedRoles: ['แพทย์'],
        description: 'แพทย์สั่งตรวจซ้ำ'
    },
    // Revert / Cancel Paths
    'รอแล็บรับเรื่อง→รอตรวจ': {
        allowedRoles: ['แพทย์', 'พยาบาล'],
        description: 'ยกเลิกคำสั่งเจาะเลือด (แล็บยังไม่รับเรื่อง)'
    },
    'รอจัดส่ง→รอตรวจ': {
        allowedRoles: ['แพทย์', 'พยาบาล', 'เจ้าหน้าที่ห้องปฏิบัติการ'],
        description: 'ยกเลิกการส่ง / ปฏิเสธรับเรื่อง'
    }
};

/**
 * Check if a role is one of the valid system roles
 * Users without a valid role should be blocked from accessing the system
 * Uses includes() matching to handle potential character variations
 */
export function isValidRole(role?: string): boolean {
    if (!role) return false;
    const trimmedRole = role.trim();
    // Use includes matching to be more flexible with character variations
    return trimmedRole.includes('แพทย์') ||
        trimmedRole.includes('พยาบาล') ||
        trimmedRole.includes('เจ้าหน้าที่ห้องปฏิบัติการ') ||
        trimmedRole.includes('ผู้ดูแล') ||
        trimmedRole.toLowerCase() === 'admin';
}

// Key for debug role override in sessionStorage
const ROLE_OVERRIDE_KEY = 'debug_role_override';

/**
 * Gets the effective role - checks for debug override first, then falls back to actual role
 * Only Admin (ผู้ดูแล) can use the debug role override
 */
export function getEffectiveRole(actualRole?: string): string | undefined {
    if (typeof window !== 'undefined' && Permissions.isAdmin(actualRole)) {
        const override = sessionStorage.getItem(ROLE_OVERRIDE_KEY);
        if (override) return override;
    }
    return actualRole;
}

export const Permissions = {
    /**
     * Check if role is Doctor
     */
    isDoctor: (role?: string) => {
        if (!role) return false;
        const trimmed = role.trim();
        return trimmed.includes(Role.DOCTOR) || trimmed.toLowerCase().includes('doctor');
    },

    /**
     * Check if role is Nurse
     */
    isNurse: (role?: string) => {
        if (!role) return false;
        const trimmed = role.trim();
        return trimmed.includes(Role.NURSE) || trimmed.toLowerCase().includes('nurse');
    },

    /**
     * Check if role is Doctor or Nurse
     * Uses includes() for flexible matching
     */
    isDoctorOrNurse: (role?: string) => {
        if (!role) return false;
        const trimmed = role.trim();
        return trimmed.includes(Role.DOCTOR) ||
            trimmed.includes(Role.NURSE) ||
            trimmed.toLowerCase().includes('doctor') ||
            trimmed.toLowerCase().includes('nurse');
    },

    /**
     * Check if role is Lab Staff
     * Uses includes() for flexible matching
     */
    isLabStaff: (role?: string) => {
        if (!role) return false;
        const trimmed = role.trim();
        return trimmed.includes(Role.LAB) ||
            trimmed.toLowerCase().includes('lab');
    },


    /**
     * Check if role is Admin (ผู้ดูแล)
     * Uses includes() for flexible matching
     */
    isAdmin: (role?: string) => {
        if (!role) return false;
        const trimmed = role.trim();
        return trimmed.includes('ผู้ดูแล') || trimmed.includes('ผู้ดูแลระบบ') || trimmed.toLowerCase() === 'admin';
    },

    /**
     * Can add new patient: Doctor, Nurse, Admin only
     */
    /**
     * Can add new patient: Doctor, Nurse, Admin only
     * Lab staff CANNOT add patients
     */
    canAddPatient: (role?: string) => {
        if (!role) return false;
        return Permissions.isDoctorOrNurse(role) || Permissions.isAdmin(role);
    },

    /**
     * Can edit patient data
     * Doctor/Nurse: ONLY if responsible (isResponsible = true)
     * Admin: ALWAYS
     * Lab: NEVER
     */
    canEditPatient: (role?: string, isResponsible: boolean = false) => {
        if (!role) return false;
        if (Permissions.isAdmin(role)) return true;
        if (Permissions.isDoctorOrNurse(role) && isResponsible) return true;
        return false;
    },

    /**
     * Can delete patient
     * Admin: ALWAYS
     * Doctor/Nurse: Only if Owner (isOwner = true) - assuming "manages everything" implies delete
     * Lab: NEVER
     */
    canDeletePatient: (role?: string, isOwner: boolean = false) => {
        if (!role) return false;
        // Strict safety: Only Admin can delete by default, Owner if intended
        // User said: "LAB cannot delete".
        // User said: "Creator manages everything" -> implies Delete.
        if (Permissions.isAdmin(role)) return true;
        if (Permissions.isDoctorOrNurse(role) && isOwner) return true;
        return false;
    },

    /**
     * Can manage responsible staff (add/remove)
     * Admin: ALWAYS
     * Doctor/Nurse: If Responsible (previously only Creator/Owner, now extended)
     */
    canManageStaff: (role?: string, isResponsible: boolean = false) => {
        if (!role) return false;
        if (Permissions.isAdmin(role)) return true;
        if (Permissions.isDoctorOrNurse(role) && isResponsible) return true;
        return false;
    },

    // ===== STATUS WORKFLOW PERMISSIONS =====

    /**
     * Can see the status update panel/modal
     * ALL roles can now see the status panel (Doctor, Nurse, Lab, Admin)
     * Individual transitions are controlled by canUpdateToStatus
     */
    canSeeStatusPanel: (role?: string) => {
        if (!role) return false;
        return Permissions.isDoctor(role) ||
            Permissions.isNurse(role) ||
            Permissions.isLabStaff(role) ||
            Permissions.isAdmin(role);
    },

    /**
     * Can update patient status from currentStatus to targetStatus
     * Enforces workflow rules:
     * 1. Must be forward transition only (no skipping, no going back)
     * 2. Must have role permission for this specific transition
     * 3. Admin can always perform any transition
     */
    canUpdateToStatus: (role?: string, currentStatus?: string, targetStatus?: string) => {
        if (!role || !currentStatus || !targetStatus) return false;

        // Admin can always update
        if (Permissions.isAdmin(role)) return true;

        // Same status - no update needed
        if (currentStatus === targetStatus) return false;

        // Check if this is a valid forward transition (next step only)
        const currentIndex = STATUS_ORDER.indexOf(currentStatus as PatientStatus);
        const targetIndex = STATUS_ORDER.indexOf(targetStatus as PatientStatus);

        // Invalid statuses
        if (currentIndex === -1 || targetIndex === -1) return false;

        // Check if it's a valid manual revert/cancel transition
        const isRevertTransition =
            (currentStatus === 'รอแล็บรับเรื่อง' && targetStatus === 'รอตรวจ') ||
            (currentStatus === 'รอจัดส่ง' && targetStatus === 'รอตรวจ');

        // Special case: Allow เสร็จสิ้น → รอตรวจ for recheck
        const isRecheckTransition = currentStatus === 'เสร็จสิ้น' && targetStatus === 'รอตรวจ';

        // Must be exactly next step OR recheck transition OR revert transition
        if (targetIndex !== currentIndex + 1 && !isRecheckTransition && !isRevertTransition) {
            // Wait, also check `รอตรวจ` -> `รอแล็บรับเรื่อง` (skipping `นัดหมาย`)
            const isSkipAppointment = currentStatus === 'รอตรวจ' && targetStatus === 'รอแล็บรับเรื่อง';
            if (!isSkipAppointment) {
                return false;
            }
        }

        // Check role permission for this transition
        const transitionKey = `${currentStatus}→${targetStatus}`;
        const transition = STATUS_TRANSITIONS[transitionKey];

        if (!transition) return false;

        // Check if user's role matches any allowed role
        return transition.allowedRoles.some(allowedRole => {
            if (allowedRole === 'แพทย์') return Permissions.isDoctor(role);
            if (allowedRole === 'พยาบาล') return Permissions.isNurse(role);
            if (allowedRole === 'เจ้าหน้าที่ห้องปฏิบัติการ') return Permissions.isLabStaff(role);
            return false;
        });
    },

    /**
     * Get the next allowed status for a role from current status
     * Returns the next status if role can transition to it, otherwise null
     */
    getNextAllowedStatus: (role?: string, currentStatus?: string): string | null => {
        if (!role || !currentStatus) return null;

        // Check Recheck transition (Finished -> Waiting)
        if (currentStatus === 'เสร็จสิ้น') {
            if (Permissions.canUpdateToStatus(role, 'เสร็จสิ้น', 'รอตรวจ')) {
                return 'รอตรวจ';
            }
            return null;
        }

        const currentIndex = STATUS_ORDER.indexOf(currentStatus as PatientStatus);
        if (currentIndex === -1 || currentIndex >= STATUS_ORDER.length - 1) return null;

        const nextStatus = STATUS_ORDER[currentIndex + 1];

        if (Permissions.canUpdateToStatus(role, currentStatus, nextStatus)) {
            return nextStatus;
        }

        return null;
    },

    /**
     * Get required role text for a transition (for tooltip display)
     */
    getRequiredRoleForTransition: (currentStatus?: string, targetStatus?: string): string => {
        if (!currentStatus || !targetStatus) return 'ไม่ทราบ';

        const transitionKey = `${currentStatus}→${targetStatus}`;
        const transition = STATUS_TRANSITIONS[transitionKey];

        if (!transition) return 'ไม่สามารถทำได้';

        return transition.allowedRoles.join(' หรือ ');
    },

    /**
     * Check if transition is valid (regardless of role)
     * Used to determine if status buttons should be shown at all
     */
    isValidTransition: (currentStatus?: string, targetStatus?: string): boolean => {
        if (!currentStatus || !targetStatus) return false;
        if (currentStatus === targetStatus) return false;

        // Special cases
        if (currentStatus === 'เสร็จสิ้น' && targetStatus === 'รอตรวจ') return true;
        if (currentStatus === 'รอตรวจ' && targetStatus === 'รอแล็บรับเรื่อง') return true;
        if (currentStatus === 'รอแล็บรับเรื่อง' && targetStatus === 'รอตรวจ') return true;
        if (currentStatus === 'รอจัดส่ง' && targetStatus === 'รอตรวจ') return true;

        const currentIndex = STATUS_ORDER.indexOf(currentStatus as PatientStatus);
        const targetIndex = STATUS_ORDER.indexOf(targetStatus as PatientStatus);

        // Must be exactly next step
        return targetIndex === currentIndex + 1;
    },

    /**
     * Legacy: Can update patient status (OLD - kept for backward compatibility)
     * @deprecated Use canUpdateToStatus instead
     */
    canUpdateStatus: (role?: string) => {
        if (!role) return false;
        // Now all roles might be able to update some status, so return true for all valid roles
        return Permissions.canSeeStatusPanel(role);
    },

    /**
     * Can edit lab results: Lab Staff, Admin
     * Doctor/Nurse: NO
     */
    canEditLab: (role?: string) => {
        if (!role) return false;
        return Permissions.isLabStaff(role) || Permissions.isAdmin(role);
    },

    /**
     * Can perform bulk assignment
     * Admin, Doctor, Nurse: YES
     * Lab: NO
     */
    canBulkAssign: (role?: string) => {
        if (!role) return false;
        return Permissions.isAdmin(role) || Permissions.isDoctorOrNurse(role);
    },

    /**
     * Can manage lab settings (Normal Ranges etc.)
     * Lab Staff, Admin: YES
     * Doctor/Nurse: NO (unless requested)
     */
    canManageLabSettings: (role?: string) => {
        if (!role) return false;
        return Permissions.isLabStaff(role) || Permissions.isAdmin(role);
    }
};
