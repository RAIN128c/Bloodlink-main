/**
 * ============================================================
 * LEGACY USER MIGRATION SCRIPT (V2: SAFE RELINK STRATEGY)
 * ============================================================
 * 
 * PURPOSE: Migrate old accounts from public.users (with bcrypt passwords)
 * into Supabase auth.users so they can log in with the new Supabase Auth system.
 * 
 * HOW IT WORKS (Fixing Unique Constraints):
 *   1. Temporarily renames the legacy user's email in public.users to `<email>.legacy`.
 *   2. Creates the user in auth.users (which triggers handle_new_user and creates a NEW row).
 *   3. Copies missing data (bio, phone, position) from the old row to the new row.
 *   4. Rewires foreign keys (messages.sender_id, messages.receiver_id) to the new ID.
 *   5. Safely deletes the old legacy row.
 * ============================================================
 */

import { config } from 'dotenv';
import path from 'path';

// Load .env.local from the project root
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

interface LegacyUser {
    id: string;
    email: string;
    name: string;
    surname: string;
    role: string;
    status: string;
    phone: string;
    position: string;
    bio: string;
    avatar_url: string;
}

async function migrateUsers() {
    console.log('🔄 Starting Safe Legacy User Migration...\n');

    // 1. Get all legacy users from public.users
    const { data: legacyUsers, error: fetchError } = await supabase
        .from('users')
        .select('*');

    if (fetchError || !legacyUsers) {
        console.error('❌ Failed to fetch legacy users:', fetchError);
        return;
    }

    console.log(`📊 Found ${legacyUsers.length} total users in public.users\n`);

    // 2. Map existing auth.users to avoid creating duplicates
    const { data: authUsersData } = await supabase.auth.admin.listUsers();
    const existingAuthEmails = new Set(
        (authUsersData?.users || []).map(u => u.email?.toLowerCase())
    );

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of legacyUsers as LegacyUser[]) {
        const email = user.email?.toLowerCase();

        if (!email) {
            console.log(`⏭️  Skipping user ${user.id} - no email`);
            skipped++;
            continue;
        }

        if (existingAuthEmails.has(email)) {
            console.log(`⏭️  Skipping ${email} - already fully migrated in auth.users`);
            skipped++;
            continue;
        }

        console.log(`\n⏳ Migrating: ${email} ...`);

        // STEP 1: Rename old email to avoid UNIQUE constraint violation when the trigger fires
        const legacyTempEmail = `${email}.legacy.${Date.now()}`;
        const { error: renameError } = await supabase
            .from('users')
            .update({ email: legacyTempEmail })
            .eq('id', user.id);

        if (renameError) {
            console.error(`   ❌ Failed to rename legacy email:`, renameError.message);
            failed++;
            continue;
        }

        // STEP 2: Create Auth User (Fires 'handle_new_user' trigger -> creates new row in public.users)
        const tempPassword = `Temp${Date.now()}!${Math.random().toString(36).slice(2, 8)}`;
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                name: user.name,
                surname: user.surname,
                role: user.role,
                status: user.status,
            }
        });

        if (createError || !authUser.user) {
            console.error(`   ❌ Failed to create auth user:`, createError?.message);
            // Rollback the rename
            await supabase.from('users').update({ email }).eq('id', user.id);
            failed++;
            continue;
        }

        const newId = authUser.user.id;
        const oldId = user.id;

        // STEP 3: Merge missing non-metadata fields (phone, position, bio, avatar) into the new row
        const { error: mergeError } = await supabase
            .from('users')
            .update({
                phone: user.phone || '',
                position: user.position || '',
                bio: user.bio || '',
                avatar_url: user.avatar_url || ''
            })
            .eq('id', newId);

        if (mergeError) {
            console.error(`   ⚠️ Failed to merge extended profile data, but user is migrated. (${mergeError.message})`);
        }

        // STEP 4: Rewire explicit foreign keys that point to users.id (e.g. messages table)
        await supabase.from('messages').update({ sender_id: newId }).eq('sender_id', oldId);
        await supabase.from('messages').update({ receiver_id: newId }).eq('receiver_id', oldId);

        // STEP 5: Delete the old legacy dummy row
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', oldId);

        if (deleteError) {
            console.error(`   ⚠️ Failed to cleanup old legacy row for ${email}. It was safely renamed.`);
        }

        console.log(`   ✅ Successfully migrated ${email}! (New ID: ${newId.split('-')[0]}...)`);
        migrated++;
    }

    console.log('\n============================================================');
    console.log(`📊 Migration Complete!`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped:  ${skipped}`);
    console.log(`   ❌ Failed:   ${failed}`);
    console.log('============================================================');
    console.log('\n⚠️  IMPORTANT: Instruct migrated users to use "Forgot Password"');
    console.log('   to set a new password, since legacy bcrypt hashes cannot');
    console.log('   be imported directly into Supabase Auth.');
}

migrateUsers().catch(console.error);
