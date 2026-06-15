export type UserRole = 'admin' | 'doctor' | 'patient';

export type AppointmentStatus =
  | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  contact: string | null;
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

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}
