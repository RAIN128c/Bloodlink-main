import { describe, it, expect, beforeEach } from 'vitest'
import { Permissions, Role, isValidRole, getEffectiveRole, STATUS_TRANSITIONS } from '@/lib/permissions'

describe('Permissions', () => {
    // ==========================================
    // Role Identification
    // ==========================================
    describe('isAdmin', () => {
        it('should recognize "admin" (English lowercase)', () => {
            expect(Permissions.isAdmin('admin')).toBe(true)
        })

        it('should recognize "Admin" (English capitalized)', () => {
            expect(Permissions.isAdmin('Admin')).toBe(true)
        })

        it('should recognize "ผู้ดูแล" (Thai admin)', () => {
            expect(Permissions.isAdmin('ผู้ดูแล')).toBe(true)
        })

        it('should recognize "ผู้ดูแลระบบ" (Thai system admin)', () => {
            expect(Permissions.isAdmin('ผู้ดูแลระบบ')).toBe(true)
        })

        it('should handle leading/trailing whitespace', () => {
            expect(Permissions.isAdmin('  admin  ')).toBe(true)
            expect(Permissions.isAdmin('  ผู้ดูแล  ')).toBe(true)
        })

        it('should reject non-admin roles', () => {
            expect(Permissions.isAdmin('แพทย์')).toBe(false)
            expect(Permissions.isAdmin('พยาบาล')).toBe(false)
            expect(Permissions.isAdmin('เจ้าหน้าที่ห้องปฏิบัติการ')).toBe(false)
            expect(Permissions.isAdmin('user')).toBe(false)
        })

        it('should reject undefined/empty', () => {
            expect(Permissions.isAdmin(undefined)).toBe(false)
            expect(Permissions.isAdmin('')).toBe(false)
        })
    })

    describe('isDoctor', () => {
        it('should recognize Doctor role', () => {
            expect(Permissions.isDoctor('แพทย์')).toBe(true)
        })

        it('should reject non-Doctor roles', () => {
            expect(Permissions.isDoctor('พยาบาล')).toBe(false)
            expect(Permissions.isDoctor('admin')).toBe(false)
        })
    })

    describe('isNurse', () => {
        it('should recognize Nurse role', () => {
            expect(Permissions.isNurse('พยาบาล')).toBe(true)
        })

        it('should reject non-Nurse roles', () => {
            expect(Permissions.isNurse('แพทย์')).toBe(false)
        })
    })

    describe('isLabStaff', () => {
        it('should recognize Lab Staff role', () => {
            expect(Permissions.isLabStaff('เจ้าหน้าที่ห้องปฏิบัติการ')).toBe(true)
        })

        it('should reject non-Lab roles', () => {
            expect(Permissions.isLabStaff('พยาบาล')).toBe(false)
        })
    })

    // ==========================================
    // Role Validation
    // ==========================================
    describe('isValidRole', () => {
        it('should accept all 4 valid roles', () => {
            expect(isValidRole(Role.DOCTOR)).toBe(true)
            expect(isValidRole(Role.NURSE)).toBe(true)
            expect(isValidRole(Role.LAB)).toBe(true)
            expect(isValidRole(Role.ADMIN)).toBe(true)
        })

        it('should reject invalid roles', () => {
            expect(isValidRole('random_role')).toBe(false)
            expect(isValidRole('superuser')).toBe(false)
        })

        it('should reject undefined/empty', () => {
            expect(isValidRole(undefined)).toBe(false)
            expect(isValidRole('')).toBe(false)
        })
    })

    // ==========================================
    // Patient Permissions
    // ==========================================
    describe('canAddPatient', () => {
        it('should allow Doctor', () => {
            expect(Permissions.canAddPatient('แพทย์')).toBe(true)
        })

        it('should allow Nurse', () => {
            expect(Permissions.canAddPatient('พยาบาล')).toBe(true)
        })

        it('should allow Admin', () => {
            expect(Permissions.canAddPatient('ผู้ดูแล')).toBe(true)
        })

        it('should deny Lab Staff', () => {
            expect(Permissions.canAddPatient('เจ้าหน้าที่ห้องปฏิบัติการ')).toBe(false)
        })
    })

    describe('canEditPatient', () => {
        it('should allow Doctor when responsible', () => {
            expect(Permissions.canEditPatient('แพทย์', true)).toBe(true)
        })

        it('should deny Doctor when not responsible', () => {
            expect(Permissions.canEditPatient('แพทย์', false)).toBe(false)
        })

        it('should always allow Admin', () => {
            expect(Permissions.canEditPatient('ผู้ดูแล', false)).toBe(true)
            expect(Permissions.canEditPatient('ผู้ดูแล', true)).toBe(true)
        })

        it('should deny Lab Staff', () => {
            expect(Permissions.canEditPatient('เจ้าหน้าที่ห้องปฏิบัติการ', true)).toBe(false)
        })
    })

    describe('canDeletePatient', () => {
        it('should always allow Admin', () => {
            expect(Permissions.canDeletePatient('ผู้ดูแล')).toBe(true)
        })

        it('should allow Doctor when owner', () => {
            expect(Permissions.canDeletePatient('แพทย์', true)).toBe(true)
        })

        it('should deny Doctor when not owner', () => {
            expect(Permissions.canDeletePatient('แพทย์', false)).toBe(false)
        })

        it('should deny Lab Staff', () => {
            expect(Permissions.canDeletePatient('เจ้าหน้าที่ห้องปฏิบัติการ')).toBe(false)
        })
    })

    // ==========================================
    // Status Workflow
    // ==========================================
    describe('canUpdateToStatus', () => {
        it('should allow Doctor to assign appointment from waiting', () => {
            expect(Permissions.canUpdateToStatus('แพทย์', 'รอตรวจ', 'นัดหมาย')).toBe(true)
        })

        it('should allow Admin for any valid transition', () => {
            expect(Permissions.canUpdateToStatus('ผู้ดูแล', 'รอตรวจ', 'นัดหมาย')).toBe(true)
            expect(Permissions.canUpdateToStatus('ผู้ดูแล', 'กำลังตรวจ', 'เสร็จสิ้น')).toBe(true)
        })

        it('should deny Lab Staff from making non-lab transitions', () => {
            expect(Permissions.canUpdateToStatus('เจ้าหน้าที่ห้องปฏิบัติการ', 'รอตรวจ', 'นัดหมาย')).toBe(false)
        })

        it('should deny backward transitions for non-admin', () => {
            expect(Permissions.canUpdateToStatus('พยาบาล', 'เสร็จสิ้น', 'รอตรวจ')).toBe(false)
        })
    })

    describe('getNextAllowedStatus', () => {
        it('should return next status for Doctor from waiting', () => {
            const next = Permissions.getNextAllowedStatus('แพทย์', 'รอตรวจ')
            expect(next).toBe('นัดหมาย')
        })

        it('should return null for no valid next status', () => {
            // Lab staff can't do anything from the initial waiting status
            const next = Permissions.getNextAllowedStatus('เจ้าหน้าที่ห้องปฏิบัติการ', 'รอตรวจ')
            expect(next).toBeNull()
        })
    })

    // ==========================================
    // Debug Role Override
    // ==========================================
    describe('getEffectiveRole', () => {
        it('should return actual role when no override', () => {
            expect(getEffectiveRole('แพทย์')).toBe('แพทย์')
        })

        it('should return undefined when no role given', () => {
            expect(getEffectiveRole(undefined)).toBeUndefined()
        })
    })

    // ==========================================
    // Lab Permissions
    // ==========================================
    describe('canEditLab', () => {
        it('should allow Lab Staff', () => {
            expect(Permissions.canEditLab('เจ้าหน้าที่ห้องปฏิบัติการ')).toBe(true)
        })

        it('should allow Admin', () => {
            expect(Permissions.canEditLab('ผู้ดูแล')).toBe(true)
        })

        it('should deny Doctor', () => {
            expect(Permissions.canEditLab('แพทย์')).toBe(false)
        })

        it('should deny Nurse', () => {
            expect(Permissions.canEditLab('พยาบาล')).toBe(false)
        })
    })
})
