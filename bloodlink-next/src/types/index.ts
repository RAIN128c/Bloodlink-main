export interface Patient {
    hn: string;
    name: string;
    surname: string;
    gender: string;
    age: string;
    bloodType: string;
    disease: string;
    medication: string;
    allergies: string;
    latestReceipt: string;
    testType: string;
    status: string; // 'ใช้งาน' | 'ไม่ใช้งาน'
    process: string; // 'นัดหมาย' | 'เจาะเลือด' | ...
    appointmentDate: string;
    appointmentTime: string;
    timestamp: string;
    caregiver?: string;
    creatorEmail?: string; // Email of the creator
    responsibleEmails?: string[]; // List of emails of responsible persons
}

export interface User {
    userId?: string;   // Sequential ID (1, 2, 3...)
    email: string;
    name: string;
    surname?: string;  // Surname
    role: string;
    position?: string; // Job Title (e.g. Ophthalmologist)
    phone?: string;    // Phone Number
    status: string;
    bio?: string;      // Staff introduction/bio
    avatarUrl?: string; // Profile picture URL
}
