export interface User {
    id: string;
    phone: string;
    role: 'PARENT' | 'STUDENT' | 'WARDEN' | 'ACCOUNTANT' | 'HM' | 'ADMIN' | 'GATE_STAFF';
    first_name: string;
    last_name: string;
    email?: string;
    is_verified: boolean;
    parent_profile?: {
        occupation: string;
        emergency_contact: string;
        aadhar_number: string;
        pan_number: string;
    };
}

export interface Guardian {
    id: string;
    student: string; // ID
    name: string;
    relationship: string;
    phone: string;
    alt_phone?: string;
    email?: string;
    address?: string;
    photo?: string;
    id_proof_type?: string;
    id_proof_number?: string;
    id_proof_document?: string;
    is_approved: boolean;
    approved_by?: string;
    approved_date?: string;
    rejection_reason?: string;
    is_emergency_contact: boolean;
}

export interface Student {
    id: string;
    student_id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    class_obj?: string | number; // ID or name depending on serializer, usually ID
    section?: string | number;
    roll_number: string;
    hostel?: string | number;
    room?: string | number;

    // Display fields
    class_name?: string;
    section_name?: string;
    hostel_name?: string;
    room_number?: string;

    photo?: string;
    guardians: Guardian[]; // Nested
}

export interface Outpass {
    id: string;
    student: string; // ID
    student_name?: string; // ReadOnly
    student_roll_no?: string;
    student_class?: string;
    student_section?: string;

    parent: string; // ID
    parent_name?: string;
    parent_phone?: string;

    guardian?: string; // ID
    pickup_person_name?: string;
    pickup_person_phone?: string;

    outgoing_date: string; // YYYY-MM-DD
    outgoing_time: string; // HH:MM
    expected_return_date: string;
    expected_return_time: string;
    actual_return_date?: string;

    reason: string;
    destination: string;
    mode_of_travel: string;

    is_priority: boolean;
    priority_reason?: string;

    status: 'PENDING' | 'FEE_PENDING' | 'APPROVED' | 'READY_FOR_EXIT' | 'CHECKED_OUT' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'OVERDUE' | 'MEETING';
    fee_due?: number;
    fee_paid?: boolean;

    qr_code?: string;
    exit_code?: string;
    return_code?: string;
    meeting_scheduled?: boolean;
    meeting_date?: string;
    meeting_venue?: string;
    meeting_notes?: string;

    created_at: string;
    approvals?: Approval[];
}

export interface Approval {
    id: string;
    approver_role: string;
    approver_name: string;
    status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'REVIEW';
    comments?: string;
    approved_at: string;
    updated_at: string;
}
