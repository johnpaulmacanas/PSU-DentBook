export type UserRole = 'admin' | 'doctor' | 'patient';

export type AppointmentStatus =
  | 'pending' | 'scheduled' | 'rescheduled' | 'cancelled' | 'missed' | 'completed';

export type RequestStatus = 'pending' | 'approved' | 'declined';

export type Concern =
  | 'checkup' | 'tooth_pain' | 'broken_tooth' | 'gum_problem' | 'whitening'
  | 'braces' | 'tooth_removal' | 'child_visit' | 'follow_up' | 'not_sure';

export type InvoiceKind = 'initial' | 'final';
export type InvoiceStatus = 'unpaid' | 'paid';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  contact: string | null;
  address: string | null;
  birthdate: string | null;
  sex: 'M' | 'F' | 'other' | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  profile_id: string;
  patient_code: string;
  age: number | null;
  gender: 'M' | 'F' | 'other' | null;
  medical_notes: string | null;
  profile?: Profile;
}

export interface Doctor {
  id: string;
  profile_id: string;
  specialty: string | null;
  profile?: Profile;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  procedure: string;
  status: AppointmentStatus;
  room: string | null;
  notes: string | null;
  visit_notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  sender?: Profile;
}

export interface AppointmentRequest {
  id: string;
  patient_profile_id: string;
  preferred_doctor_id: string | null;
  concern: Concern;
  notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relation: string | null;
  emergency_contact_number: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  is_pregnant: boolean;
  consent: boolean;
  estimated_amount: number;
  request_status: RequestStatus;
  created_at: string;
  // Optional embeds (when selected with joins)
  patient_profile?: Profile;
  preferred_doctor?: Doctor;
}

export interface Invoice {
  id: string;
  appointment_id: string;
  kind: InvoiceKind;
  amount: number;
  status: InvoiceStatus;
  created_at: string;
  appointment?: Appointment;
}

export interface Receipt {
  id: string;
  invoice_id: string;
  receipt_no: string;
  issued_at: string;
  invoice?: Invoice;
}

export interface MedicalCertificate {
  id: string;
  appointment_id: string;
  diagnosis: string | null;
  recommendation: string | null;
  valid_from: string | null;
  valid_to: string | null;
  issued_by: string | null;
  issued_at: string;
  appointment?: Appointment;
}

export interface Prescription {
  id: string;
  appointment_id: string;
  medication: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  notes: string | null;
  prescribed_by: string | null;
  created_at: string;
  appointment?: Appointment;
}

export interface TreatmentResult {
  id: string;
  appointment_id: string;
  procedure_performed: string;
  findings: string | null;
  outcome: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  appointment?: Appointment;
}

export interface ClinicSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}
