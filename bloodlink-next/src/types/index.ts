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
    // New fields for Print Summary
    idCard?: string;
    phone?: string;
    relativeName?: string;
    relativePhone?: string;
    relativeRelationship?: string;
    // Vital Signs (Removed, will be handled per-visit)
    // weight?: string;
    // height?: string;
    // waist?: string;
    // bp?: string;
    // pulse?: string;
    // temperature?: string;
    // dtx?: string;
    // Kidney Function
    creatinine?: string;
    egfr?: string;
    uric_acid?: string;
    // Electrolytes
    sodium?: string;
    potassium?: string;
    chloride?: string;
    co2?: string;
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
    hospitalType?: string; // 'RorPhorSot' | 'RorPhorChumchon'
    hospitalName?: string;
    district?: string;
    province?: string;
    professionalId?: string; // e.g. license number or employee ID
    pinHash?: string; // 6-digit PIN hash for E-signatures
}
