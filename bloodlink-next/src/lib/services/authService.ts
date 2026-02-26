/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { EmailService } from '@/lib/services/emailService';
import bcrypt from 'bcryptjs';

export class AuthService {
    static async authenticateUser(email: string, password: string): Promise<User | null> {
        try {
            // 1. Fetch user by email
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !user) {
                return null;
            }

            // 2. Check verification status
            // Allow 'Approved', 'approved', 'อนุมัติ', 'ผ่าน', 'ใช้งาน'
            const status = user.status?.toLowerCase() || '';
            const validStatuses = ['approved', 'อนุมัติ', 'ผ่าน', 'ใช้งาน'];

            // Loose check: if status is pending/requesting/waiting, block.
            // Or strictly check if it IS valid.
            // Based on previous code: if (verifyStatus !== 'Approved' ...)
            // Let's stick to valid statuses logic.
            if (!validStatuses.includes(status)) {
                return null;
            }

            // 3. Verify password
            if (!user.password) {
                return null;
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return null;
            }

            // 4. Log Login Activity
            await AuthService.recordLoginLog(user.email, `${user.name} ${user.surname || ''}`.trim(), user.role, user.position || '');

            return {
                userId: user.id, // UUID
                email: user.email,
                name: user.name,
                surname: user.surname,
                role: user.role,
                position: user.position,
                phone: user.phone,
                status: user.status,
                avatarUrl: user.avatar_url,
                hospitalType: user.hospital_type,
                hospitalName: user.hospital_name,
                district: user.district,
                province: user.province,
                professionalId: user.professional_id
            };
        } catch (error) {
            console.error('Auth error:', error);
            return null;
        }
    }

    static async recordLoginLog(email: string, name: string, role: string, position: string) {
        try {
            const { error } = await supabase
                .from('audit_logs')
                .insert([
                    {
                        user_email: email,
                        name: name,
                        role: role,
                        position: position,
                        action: 'เข้าสู่ระบบ'
                    }
                ]);

            if (error) console.error('Failed to log login:', error);
        } catch (error) {
            console.error('Failed to log login:', error);
        }
    }

    static async registerUser(data: any): Promise<{ success: boolean; error?: string }> {
        try {
            // Check if email exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('email')
                .eq('email', data.email)
                .single();

            if (existingUser) {
                return { success: false, error: 'Email already exists' };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(data.password, 10);

            // Insert new user
            const { error } = await supabase
                .from('users')
                .insert([
                    {
                        email: data.email,
                        password: hashedPassword,
                        role: data.role,
                        name: data.name,
                        surname: data.surname,
                        status: 'รอตรวจสอบ', // Default pending status
                        position: '',
                        phone: data.phone || '',
                        // additional fields if schema supported: hospital: data.hospitalName
                    }
                ]);

            if (error) {
                console.error('Supabase insert error:', error);
                return { success: false, error: 'Registration failed: ' + error.message };
            }

            // Send Welcome Email
            await EmailService.sendWelcomeEmail(data.email, data.name);

            return { success: true };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Registration failed' };
        }
    }

    static async getAllUsers(): Promise<User[]> {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return users.map(u => ({
                userId: u.id,
                email: u.email,
                name: u.name,
                surname: u.surname,
                role: u.role,
                position: u.position,
                phone: u.phone,
                status: u.status || 'Pending',
                avatarUrl: u.avatar_url,
                hospitalType: u.hospital_type,
                hospitalName: u.hospital_name,
                district: u.district,
                province: u.province,
                professionalId: u.professional_id
            }));
        } catch (error) {
            console.error('Fetch users error:', error);
            return [];
        }
    }

    static async getUsersByRoles(roles: string[]): Promise<User[]> {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .in('role', roles)
                .in('status', ['approved', 'Approved', 'อนุมัติ', 'ใช้งาน', 'Active', 'active']) // Only fetching approved staff
                .order('created_at', { ascending: false });

            if (error) throw error;

            return users.map(u => ({
                userId: u.id,
                email: u.email,
                name: u.name,
                surname: u.surname,
                role: u.role,
                position: u.position,
                phone: u.phone,
                status: u.status,
                avatarUrl: u.avatar_url,
                hospitalType: u.hospital_type,
                hospitalName: u.hospital_name,
                district: u.district,
                province: u.province,
                professionalId: u.professional_id
            }));
        } catch (error) {
            console.error('Fetch users by roles error:', error);
            return [];
        }
    }



    static async updateUser(email: string, data: Partial<User> & { phone?: string, professionalId?: string }): Promise<boolean> {
        try {
            const updateFields: any = {};
            if (data.name !== undefined) updateFields.name = data.name;
            if (data.surname !== undefined) updateFields.surname = data.surname;
            if (data.position !== undefined) updateFields.position = data.position;
            if (data.phone !== undefined) updateFields.phone = data.phone;
            if (data.avatarUrl !== undefined) updateFields.avatar_url = data.avatarUrl;
            if (data.hospitalName !== undefined) updateFields.hospital_name = data.hospitalName;
            if (data.district !== undefined) updateFields.district = data.district;
            if (data.province !== undefined) updateFields.province = data.province;
            if (data.professionalId !== undefined) updateFields.professional_id = data.professionalId;

            // Only update if there are fields to update
            if (Object.keys(updateFields).length === 0) return true;

            // Use admin client to bypass RLS for profile updates
            const { supabaseAdmin } = await import('@/lib/supabase-admin');

            const { error } = await supabaseAdmin
                .from('users')
                .update(updateFields)
                .eq('email', email.toLowerCase());

            if (error) {
                console.error('Supabase update error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Update user error:', error);
            return false;
        }
    }

    /**
     * Get sequential staff number for a user based on their role.
     * Users are ordered by created_at within their role group.
     * Returns the 1-based index as a string (e.g., "1", "2", "3")
     */
    static async getStaffNumber(userId: string, _role: string): Promise<string> {
        try {
            // Get all users ordered by created_at (Global Sequence)
            // Removed .eq('role', role) to make the sequence continuous across all roles
            const { data: users, error } = await supabase
                .from('users')
                .select('id, created_at')
                .order('created_at', { ascending: true });

            if (error || !users) return '0';

            // Find the index of the current user (1-based)
            const index = users.findIndex(u => u.id === userId);
            if (index === -1) return '0';

            return String(index + 1);
        } catch (error) {
            console.error('Get staff number error:', error);
            return '0';
        }
    }

    static async getUserById(userId: string): Promise<User | null> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error(`AuthService.getUserById error for ${userId}:`, error);
                return null;
            }
            if (!user) {
                console.warn(`AuthService.getUserById: No user found for ${userId}`);
                return null;
            }

            return {
                userId: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                role: user.role,
                position: user.position,
                phone: user.phone,
                status: user.status,
                bio: user.bio,
                avatarUrl: user.avatar_url,
                hospitalType: user.hospital_type,
                hospitalName: user.hospital_name,
                district: user.district,
                province: user.province,
                professionalId: user.professional_id
            };
        } catch (error) {
            console.error('Get user by ID error:', error);
            return null;
        }
    }

    static async getUserByEmail(email: string): Promise<User | null> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();

            if (error || !user) return null;

            return {
                userId: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                role: user.role,
                position: user.position,
                phone: user.phone,
                status: user.status,
                bio: user.bio,
                avatarUrl: user.avatar_url,
                hospitalType: user.hospital_type,
                hospitalName: user.hospital_name,
                district: user.district,
                province: user.province,
                professionalId: user.professional_id
            };
        } catch (error) {
            console.error('Get user by email error:', error);
            return null;
        }
    }

    static async deleteUser(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) {
                console.error('Delete user error:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Delete user error:', error);
            return false;
        }
    }

    static async updateUserRole(userId: string, role: string, position?: string, bio?: string): Promise<boolean> {
        try {
            const updateData: Record<string, unknown> = {
                role,
                position,
                updated_at: new Date().toISOString()
            };
            if (bio !== undefined) {
                updateData.bio = bio;
            }

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId);

            if (error) {
                console.error('Update user role error:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Update user role error:', error);
            return false;
        }
    }

    static async updateUserBio(userId: string, bio: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('users')
                .update({ bio, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) {
                console.error('Update user bio error:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Update user bio error:', error);
            return false;
        }
    }

    static async updateUserStatus(userId: string, status: string): Promise<boolean> {
        try {
            // Update status in DB
            const { error, data } = await supabase
                .from('users')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', userId)
                .select('email, name')
                .single();

            if (error) {
                console.error('Update user status error:', error);
                return false;
            }

            // Check if status is Approved -> Send Email
            const approvedKeywords = ['approved', 'อนุมัติ', 'active', 'ใช้งาน'];
            if (approvedKeywords.includes(status.toLowerCase()) && data?.email) {
                // Fire and forget email to not block response
                EmailService.sendAccountApprovedEmail(data.email, data.name || 'Staff');
            }

            return true;
        } catch (error) {
            console.error('Update user status error:', error);
            return false;
        }
    }

    static async updateUserPassword(email: string, newPassword: string): Promise<boolean> {
        try {
            // First, find the user's auth.users ID from their email
            const { data: profile } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (!profile) {
                console.error('Update password error: User not found for email', email);
                return false;
            }

            // Use Supabase Admin API to update the password in auth.users
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                process.env.SUPABASE_SERVICE_ROLE_KEY || '',
                { auth: { autoRefreshToken: false, persistSession: false } }
            );

            const { error } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
                password: newPassword
            });

            if (error) {
                console.error('Update password error:', error);
                return false;
            }

            // Update the timestamp in public.users
            await supabase
                .from('users')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', profile.id);

            return true;
        } catch (error) {
            console.error('Update password error:', error);
            return false;
        }
    }
}

