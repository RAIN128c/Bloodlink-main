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
 */
export function getEffectiveRole(actualRole?: string): string | undefined {
    if (typeof window !== 'undefined') {
        const override = sessionStorage.getItem(ROLE_OVERRIDE_KEY);
        if (override) return override;
    }
    return actualRole;
}

export const Permissions = {
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
        return trimmed.includes('ผู้ดูแล') || trimmed.toLowerCase() === 'admin';
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

    /**
     * Can update patient status: Lab Staff (all), Admin (all)
     * Doctor/Nurse: NO
     */
    canUpdateStatus: (role?: string) => {
        if (!role) return false;
        return Permissions.isLabStaff(role) || Permissions.isAdmin(role);
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
    }
};
