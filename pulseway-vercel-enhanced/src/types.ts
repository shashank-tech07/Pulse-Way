export type Language = 'English' | 'Hindi' | 'Kannada' | 'Tamil';

export type ActiveTab = 'appointments' | 'book' | 'online' | 'hospitals';

export type Specialty =
  | 'General Physician'
  | 'Cardiologist'
  | 'Dermatologist'
  | 'Orthopedic'
  | 'Pediatrician';

export type DemandTier = 'high' | 'moderate' | 'low';

export type SeverityLevel = 'Mild' | 'Moderate' | 'Urgent';

export interface LatLngPoint {
  lat: number;
  lng: number;
  label: string;
}

export interface PatientProfile {
  name: string;
  contact: string;
  age: number;
  language: Language;
}

export interface Doctor {
  id: string;
  name: string;
  photoUrl: string;
  specialty: Specialty;
  qualification: string;
  experienceYears: number;
  clinicWing: string;
  clinicCoords: LatLngPoint;
  demandTier: DemandTier;
  demandLabel: string;
  feeInr: number;
  avgConsultPaceMin: number;
  currentQueueCount: number;
  baseClinicDelayMin: number;
  ratingNote: string;
  availableSlots: string[];
}

export interface BufferBreakdown {
  liveClinicDelayMin: number;
  consultationPaceBufferMin: number;
  travelBufferMin: number;
  parkingCheckInBufferMin: number;
  totalBufferMin: number;
}

export interface Appointment {
  id: string;
  token: string;
  queuePosition: number;
  doctorId: string;
  doctorName: string;
  doctorPhoto: string;
  specialty: Specialty;
  clinicWing: string;
  originLocation: LatLngPoint;
  clinicLocation: LatLngPoint;
  consultationMode: 'In-Clinic Visit' | 'Online Video';
  scheduledTime: string;
  scheduledMinutesFromMidnight: number;
  dateLabel: string;
  symptoms: string;
  severity: SeverityLevel;
  duration: string;
  notes: string;
  patientName: string;
  patientAge: number;
  patientPhone: string;
  feeAmount: number;
  feeStatus: 'Paid Online' | 'Pay at Clinic Desk' | 'Free Triage';
  demandLabel: string;
  baseClinicDelayMin: number;
  avgConsultPaceMin: number;
  baseTravelMin: number;
  parkingCheckInMin: number;
}

export interface OnlineConsultation {
  id: string;
  doctorName: string;
  doctorPhoto: string;
  specialty: Specialty;
  qualification: string;
  sessionTitle: string;
  sessionType: 'paid' | 'free';
  feeAmount: number;
  queueWaitMin: number;
  patientsAhead: number;
  avgSessionDurationMin: number;
  languagesSpoken: Language[];
  roomCode: string;
  summaryNote: string;
}

export interface WorstCaseResult {
  scheduledTimeFormatted: string;
  worstCaseArrivalTime: string;
  leaveByTime: string;
  minutesUntilAppointment: number;
  minutesUntilLeave: number;
  minutesUntilArrival: number;
  departureStatus: 'On Schedule' | 'Prepare to Leave' | 'Leave Now' | 'Delay Absorbed';
  warningTitle: string;
  warningDetail: string;
  breakdown: BufferBreakdown;
}
