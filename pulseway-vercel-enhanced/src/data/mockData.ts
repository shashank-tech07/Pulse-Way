import {
  Appointment,
  Doctor,
  Language,
  LatLngPoint,
  OnlineConsultation,
  WorstCaseResult,
} from '../types';
import docGp1Img from '../assets/images/doctors/doc-gp-1.jpg';
import docGp2Img from '../assets/images/doctors/doc-gp-2.jpg';
import docGp3Img from '../assets/images/doctors/doc-gp-3.jpg';
import docCard1Img from '../assets/images/doctors/doc-card-1.jpg';
import docCard2Img from '../assets/images/doctors/doc-card-2.jpg';
import docCard3Img from '../assets/images/doctors/doc-card-3.jpg';
import docDerm1Img from '../assets/images/doctors/doc-derm-1.jpg';
import docDerm2Img from '../assets/images/doctors/doc-derm-2.jpg';
import docOrtho1Img from '../assets/images/doctors/doc-ortho-1.jpg';
import docOrtho2Img from '../assets/images/doctors/doc-ortho-2.jpg';
import docPed1Img from '../assets/images/doctors/doc-ped-1.jpg';
import docPed2Img from '../assets/images/doctors/doc-ped-2.jpg';

export const SPECIALTIES = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Orthopedic',
  'Pediatrician',
] as const;

export const LANGUAGES: Language[] = ['English', 'Hindi', 'Kannada', 'Tamil'];

export const DEFAULT_PATIENT_ORIGIN: LatLngPoint = {
  lat: 12.9716,
  lng: 77.6412,
  label: 'Indiranagar Residence · 100 Feet Rd',
};

const MAIN_CAMPUS_COORDS: LatLngPoint = {
  lat: 12.9589,
  lng: 77.5992,
  label: 'PulseWay Central Clinical Campus · Richmond Rd',
};

const HEART_WING_COORDS: LatLngPoint = {
  lat: 12.9612,
  lng: 77.5964,
  label: 'PulseWay Heart Care Wing · Residency Rd',
};

const MOBILITY_WING_COORDS: LatLngPoint = {
  lat: 12.9554,
  lng: 77.6038,
  label: 'PulseWay Mobility & Ortho Wing · Langford Rd',
};

export const DOCTORS: Doctor[] = [
  // General Physician
  {
    id: 'doc-gp-1',
    name: 'Dr. Arvind Subramanian',
    photoUrl: docGp1Img,
    specialty: 'General Physician',
    qualification: 'MD Internal Medicine · Senior Consultant',
    experienceYears: 18,
    clinicWing: 'Block A · Suite 104',
    clinicCoords: MAIN_CAMPUS_COORDS,
    demandTier: 'high',
    demandLabel: 'High Demand · Senior',
    feeInr: 1100,
    avgConsultPaceMin: 14,
    currentQueueCount: 6,
    baseClinicDelayMin: 15,
    ratingNote: 'Detailed diagnostic consults',
    availableSlots: ['10:30 AM', '11:45 AM', '02:15 PM', '04:30 PM'],
  },
  {
    id: 'doc-gp-2',
    name: 'Dr. Meera Deshmukh',
    photoUrl: docGp2Img,
    specialty: 'General Physician',
    qualification: 'MBBS, DNB Family Medicine',
    experienceYears: 9,
    clinicWing: 'Block A · Suite 109',
    clinicCoords: MAIN_CAMPUS_COORDS,
    demandTier: 'moderate',
    demandLabel: 'Moderate Demand',
    feeInr: 700,
    avgConsultPaceMin: 11,
    currentQueueCount: 3,
    baseClinicDelayMin: 8,
    ratingNote: 'Balanced wait & pace',
    availableSlots: ['10:15 AM', '11:30 AM', '01:00 PM', '03:45 PM'],
  },
  {
    id: 'doc-gp-3',
    name: 'Dr. Karthik Hegde',
    photoUrl: docGp3Img,
    specialty: 'General Physician',
    qualification: 'MBBS, PGD Clinical Care',
    experienceYears: 5,
    clinicWing: 'Block B · Suite 202',
    clinicCoords: MAIN_CAMPUS_COORDS,
    demandTier: 'low',
    demandLabel: 'Low Demand · Fast Slot',
    feeInr: 450,
    avgConsultPaceMin: 9,
    currentQueueCount: 1,
    baseClinicDelayMin: 3,
    ratingNote: 'Rapid intake & minimal wait',
    availableSlots: ['10:00 AM', '10:45 AM', '12:15 PM', '03:00 PM'],
  },

  // Cardiologist
  {
    id: 'doc-card-1',
    name: 'Dr. Vikramaditya Nair',
    photoUrl: docCard1Img,
    specialty: 'Cardiologist',
    qualification: 'DM Cardiology · Chief Interventionalist',
    experienceYears: 21,
    clinicWing: 'Heart Care Wing · Suite 301',
    clinicCoords: HEART_WING_COORDS,
    demandTier: 'high',
    demandLabel: 'High Demand · Senior',
    feeInr: 1650,
    avgConsultPaceMin: 18,
    currentQueueCount: 7,
    baseClinicDelayMin: 18,
    ratingNote: 'Complex cardiac & ECG review',
    availableSlots: ['11:00 AM', '01:30 PM', '04:00 PM'],
  },
  {
    id: 'doc-card-2',
    name: 'Dr. Shalini Kulkarni',
    photoUrl: docCard2Img,
    specialty: 'Cardiologist',
    qualification: 'MD, DNB Cardiology',
    experienceYears: 11,
    clinicWing: 'Heart Care Wing · Suite 306',
    clinicCoords: HEART_WING_COORDS,
    demandTier: 'moderate',
    demandLabel: 'Moderate Demand',
    feeInr: 1150,
    avgConsultPaceMin: 14,
    currentQueueCount: 3,
    baseClinicDelayMin: 9,
    ratingNote: 'Preventive & hypertension care',
    availableSlots: ['10:30 AM', '12:00 PM', '03:30 PM'],
  },
  {
    id: 'doc-card-3',
    name: 'Dr. Rohan Chawla',
    photoUrl: docCard3Img,
    specialty: 'Cardiologist',
    qualification: 'MD, Fellow Non-Invasive Cardiology',
    experienceYears: 6,
    clinicWing: 'Heart Care Wing · Suite 310',
    clinicCoords: HEART_WING_COORDS,
    demandTier: 'low',
    demandLabel: 'Low Demand · Fast Slot',
    feeInr: 850,
    avgConsultPaceMin: 12,
    currentQueueCount: 1,
    baseClinicDelayMin: 4,
    ratingNote: 'Same-day echo & rhythm checks',
    availableSlots: ['10:15 AM', '11:15 AM', '02:45 PM'],
  },

  // Dermatologist
  {
    id: 'doc-derm-1',
    name: 'Dr. Nandini Venkatesh',
    photoUrl: docDerm1Img,
    specialty: 'Dermatologist',
    qualification: 'MD Dermatology · Senior Specialist',
    experienceYears: 16,
    clinicWing: 'Block C · Suite 212',
    clinicCoords: MAIN_CAMPUS_COORDS,
    demandTier: 'high',
    demandLabel: 'High Demand · Senior',
    feeInr: 1250,
    avgConsultPaceMin: 13,
    currentQueueCount: 5,
    baseClinicDelayMin: 12,
    ratingNote: 'Clinical & laser dermatology',
    availableSlots: ['11:15 AM', '02:00 PM', '05:00 PM'],
  },
  {
    id: 'doc-derm-2',
    name: 'Dr. Farhan Siddiqui',
    photoUrl: docDerm2Img,
    specialty: 'Dermatologist',
    qualification: 'MD, DDVL Clinical Skin Care',
    experienceYears: 7,
    clinicWing: 'Block C · Suite 215',
    clinicCoords: MAIN_CAMPUS_COORDS,
    demandTier: 'low',
    demandLabel: 'Low Demand · Fast Slot',
    feeInr: 600,
    avgConsultPaceMin: 10,
    currentQueueCount: 2,
    baseClinicDelayMin: 5,
    ratingNote: 'Allergy, rash & acute flare-ups',
    availableSlots: ['10:00 AM', '11:00 AM', '01:15 PM', '04:15 PM'],
  },

  // Orthopedic
  {
    id: 'doc-ortho-1',
    name: 'Dr. Rajeshwar Gowda',
    photoUrl: docOrtho1Img,
    specialty: 'Orthopedic',
    qualification: 'MS Ortho · Joint & Spine Lead',
    experienceYears: 19,
    clinicWing: 'Mobility Wing · Suite 102',
    clinicCoords: MOBILITY_WING_COORDS,
    demandTier: 'high',
    demandLabel: 'High Demand · Senior',
    feeInr: 1400,
    avgConsultPaceMin: 15,
    currentQueueCount: 6,
    baseClinicDelayMin: 14,
    ratingNote: 'Spine, sports injury & X-ray review',
    availableSlots: ['10:45 AM', '01:00 PM', '04:30 PM'],
  },
  {
    id: 'doc-ortho-2',
    name: 'Dr. Priya Menon',
    photoUrl: docOrtho2Img,
    specialty: 'Orthopedic',
    qualification: 'MS Ortho, DNB Trauma',
    experienceYears: 8,
    clinicWing: 'Mobility Wing · Suite 108',
    clinicCoords: MOBILITY_WING_COORDS,
    demandTier: 'low',
    demandLabel: 'Low Demand · Fast Slot',
    feeInr: 750,
    avgConsultPaceMin: 11,
    currentQueueCount: 2,
    baseClinicDelayMin: 5,
    ratingNote: 'Sprains, joint pain & physiotherapy',
    availableSlots: ['10:15 AM', '11:45 AM', '03:15 PM'],
  },

  // Pediatrician
  {
    id: 'doc-ped-1',
    name: 'Dr. Kavitha Ramanathan',
    photoUrl: docPed1Img,
    specialty: 'Pediatrician',
    qualification: 'MD Pediatrics · Senior Child Specialist',
    experienceYears: 17,
    clinicWing: 'Child Care Wing · Suite 114',
    clinicCoords: MAIN_CAMPUS_COORDS,
    demandTier: 'high',
    demandLabel: 'High Demand · Senior',
    feeInr: 1150,
    avgConsultPaceMin: 14,
    currentQueueCount: 5,
    baseClinicDelayMin: 12,
    ratingNote: 'Pediatric respiratory & growth care',
    availableSlots: ['10:30 AM', '12:30 PM', '04:00 PM'],
  },
  {
    id: 'doc-ped-2',
    name: 'Dr. Siddharth Joshi',
    photoUrl: docPed2Img,
    specialty: 'Pediatrician',
    qualification: 'MD, DCH Pediatrics',
    experienceYears: 6,
    clinicWing: 'Child Care Wing · Suite 118',
    clinicCoords: MAIN_CAMPUS_COORDS,
    demandTier: 'low',
    demandLabel: 'Low Demand · Fast Slot',
    feeInr: 550,
    avgConsultPaceMin: 10,
    currentQueueCount: 1,
    baseClinicDelayMin: 4,
    ratingNote: 'Fevers, immunizations & quick checkups',
    availableSlots: ['10:00 AM', '11:00 AM', '02:30 PM'],
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    token: 'TKN-A14',
    queuePosition: 3,
    doctorId: 'doc-card-1',
    doctorName: 'Dr. Vikramaditya Nair',
    doctorPhoto: docCard1Img,
    specialty: 'Cardiologist',
    clinicWing: 'Heart Care Wing · Suite 301',
    originLocation: DEFAULT_PATIENT_ORIGIN,
    clinicLocation: HEART_WING_COORDS,
    consultationMode: 'In-Clinic Visit',
    scheduledTime: '11:00 AM',
    scheduledMinutesFromMidnight: 11 * 60,
    dateLabel: 'Today · 20 Nov',
    symptoms: 'Mild chest tightness during brisk morning walk and elevated resting pulse (94 bpm).',
    severity: 'Moderate',
    duration: '2–3 Days',
    notes: 'Carrying previous lipid profile and blood pressure log from last month.',
    patientName: 'Ananya Rao',
    patientAge: 34,
    patientPhone: '+91 98450 21490',
    feeAmount: 1650,
    feeStatus: 'Paid Online',
    demandLabel: 'High Demand · Senior',
    baseClinicDelayMin: 12,
    avgConsultPaceMin: 18,
    baseTravelMin: 25,
    parkingCheckInMin: 6,
  },
  {
    id: 'apt-102',
    token: 'TKN-B05',
    queuePosition: 2,
    doctorId: 'doc-gp-3',
    doctorName: 'Dr. Karthik Hegde',
    doctorPhoto: docGp3Img,
    specialty: 'General Physician',
    clinicWing: 'Block B · Suite 202',
    originLocation: DEFAULT_PATIENT_ORIGIN,
    clinicLocation: MAIN_CAMPUS_COORDS,
    consultationMode: 'In-Clinic Visit',
    scheduledTime: '03:00 PM',
    scheduledMinutesFromMidnight: 15 * 60,
    dateLabel: 'Today · 20 Nov',
    symptoms: 'Persistent dry cough and seasonal sinus congestion after travel.',
    severity: 'Mild',
    duration: '4 Days',
    notes: 'No fever; sensitive to strong antihistamines.',
    patientName: 'Ananya Rao',
    patientAge: 34,
    patientPhone: '+91 98450 21490',
    feeAmount: 450,
    feeStatus: 'Pay at Clinic Desk',
    demandLabel: 'Low Demand · Fast Slot',
    baseClinicDelayMin: 4,
    avgConsultPaceMin: 9,
    baseTravelMin: 20,
    parkingCheckInMin: 5,
  },
];

export const ONLINE_CONSULTATIONS: OnlineConsultation[] = [
  {
    id: 'oc-paid-1',
    doctorName: 'Dr. Arvind Subramanian',
    doctorPhoto: docGp1Img,
    specialty: 'General Physician',
    qualification: 'MD Internal Medicine · 18 yrs exp',
    sessionTitle: 'Comprehensive Lab & Symptom Video Review',
    sessionType: 'paid',
    feeAmount: 750,
    queueWaitMin: 6,
    patientsAhead: 1,
    avgSessionDurationMin: 20,
    languagesSpoken: ['English', 'Tamil', 'Hindi'],
    roomCode: 'PW-VID-408',
    summaryNote: 'Upload blood panel or vitals; includes digital prescription and 7-day follow-up.',
  },
  {
    id: 'oc-paid-2',
    doctorName: 'Dr. Shalini Kulkarni',
    doctorPhoto: docCard2Img,
    specialty: 'Cardiologist',
    qualification: 'MD, DNB Cardiology · 11 yrs exp',
    sessionTitle: 'ECG & Blood Pressure Tele-Cardiology Room',
    sessionType: 'paid',
    feeAmount: 950,
    queueWaitMin: 11,
    patientsAhead: 2,
    avgSessionDurationMin: 20,
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    roomCode: 'PW-VID-512',
    summaryNote: 'Live review of home BP trends, smartwatch ECG strips, and medication adjustments.',
  },
  {
    id: 'oc-paid-3',
    doctorName: 'Dr. Nandini Venkatesh',
    doctorPhoto: docDerm1Img,
    specialty: 'Dermatologist',
    qualification: 'MD Dermatology · 16 yrs exp',
    sessionTitle: 'High-Resolution Skin & Scalp Video Consult',
    sessionType: 'paid',
    feeAmount: 800,
    queueWaitMin: 4,
    patientsAhead: 1,
    avgSessionDurationMin: 15,
    languagesSpoken: ['English', 'Kannada', 'Tamil'],
    roomCode: 'PW-VID-619',
    summaryNote: 'Structured visual evaluation for rashes, dermatitis, and personalized topical plan.',
  },
  {
    id: 'oc-free-1',
    doctorName: 'Dr. Meera Deshmukh',
    doctorPhoto: docGp2Img,
    specialty: 'General Physician',
    qualification: 'MBBS, DNB Family Medicine · Triage Desk',
    sessionTitle: 'Free 10-Min Symptom Triage & Urgency Check',
    sessionType: 'free',
    feeAmount: 0,
    queueWaitMin: 3,
    patientsAhead: 1,
    avgSessionDurationMin: 10,
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    roomCode: 'PW-TRI-104',
    summaryNote: 'Zero-fee clinician check to decide whether home care, lab work, or an in-clinic visit is needed.',
  },
  {
    id: 'oc-free-2',
    doctorName: 'Dr. Siddharth Joshi',
    doctorPhoto: docPed2Img,
    specialty: 'Pediatrician',
    qualification: 'MD, DCH Pediatrics · Community Desk',
    sessionTitle: 'Free Pediatric Fever & Dose Guidance Room',
    sessionType: 'free',
    feeAmount: 0,
    queueWaitMin: 5,
    patientsAhead: 2,
    avgSessionDurationMin: 10,
    languagesSpoken: ['English', 'Hindi'],
    roomCode: 'PW-TRI-207',
    summaryNote: 'Complimentary parent guidance for mild pediatric fevers, hydration, and red-flag screening.',
  },
  {
    id: 'oc-free-3',
    doctorName: 'Dr. Farhan Siddiqui',
    doctorPhoto: docDerm2Img,
    specialty: 'Dermatologist',
    qualification: 'MD, DDVL · Follow-Up Desk',
    sessionTitle: 'Free Prescription Follow-Up & Side-Effect Check',
    sessionType: 'free',
    feeAmount: 0,
    queueWaitMin: 2,
    patientsAhead: 0,
    avgSessionDurationMin: 8,
    languagesSpoken: ['English', 'Hindi', 'Tamil'],
    roomCode: 'PW-TRI-309',
    summaryNote: 'Quick zero-fee check-in for patients monitoring reaction or recovery after an earlier clinic visit.',
  },
];

export function parseSlotToMinutes(slot: string): number {
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 11 * 60;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
}

export function formatCountdownHMS(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function calculateWorstCaseArrival(
  appointment: Pick<
    Appointment,
    | 'scheduledMinutesFromMidnight'
    | 'baseClinicDelayMin'
    | 'avgConsultPaceMin'
    | 'queuePosition'
    | 'baseTravelMin'
    | 'parkingCheckInMin'
  >,
  simulatedDoctorDelayMin = 0,
  simulatedTrafficSpikeMin = 0,
  referenceNowMinutes = 10 * 60 + 22 // 10:22 AM baseline reference clock
): WorstCaseResult {
  const liveClinicDelayMin = appointment.baseClinicDelayMin + simulatedDoctorDelayMin;
  const consultationPaceBufferMin = Math.max(
    4,
    Math.round(appointment.avgConsultPaceMin * 0.45 * Math.max(1, appointment.queuePosition - 1))
  );
  const travelBufferMin = appointment.baseTravelMin + simulatedTrafficSpikeMin;
  const parkingCheckInBufferMin = appointment.parkingCheckInMin;

  const expectedCallMinutes =
    appointment.scheduledMinutesFromMidnight + liveClinicDelayMin + consultationPaceBufferMin;
  const worstCaseArrivalAtDesk = expectedCallMinutes - 6;
  const leaveByMinutes = worstCaseArrivalAtDesk - travelBufferMin - parkingCheckInBufferMin;

  const minutesUntilAppointment = Math.max(
    0,
    appointment.scheduledMinutesFromMidnight - referenceNowMinutes
  );
  const minutesUntilLeave = Math.max(0, leaveByMinutes - referenceNowMinutes);
  const minutesUntilArrival = Math.max(0, worstCaseArrivalAtDesk - referenceNowMinutes);

  let departureStatus: WorstCaseResult['departureStatus'] = 'On Schedule';
  let warningTitle = 'Buffer Protected — On Schedule';
  let warningDetail = 'No rush yet. Clinic drift and road buffers are safely covered.';

  if (simulatedDoctorDelayMin >= 20 && simulatedTrafficSpikeMin === 0) {
    departureStatus = 'Delay Absorbed';
    warningTitle = 'Clinic Delay Absorbed — Departure Delayed';
    warningDetail =
      'Doctor delay pushed your call back. Stay home longer so you do not wait in the lobby.';
  } else if (minutesUntilLeave <= 18) {
    departureStatus = 'Leave Now';
    warningTitle = 'Urgent Departure Warning — Leave Immediately';
    warningDetail =
      'Road travel + parking buffer window is active now. Depart immediately to reach check-in on time.';
  } else if (minutesUntilLeave <= 40) {
    departureStatus = 'Prepare to Leave';
    warningTitle = 'Heads-Up Warning — Prepare for Departure';
    warningDetail =
      'Keep your reports ready. Traffic or check-in variance can tighten your departure margin.';
  }

  return {
    scheduledTimeFormatted: formatMinutesToTime(appointment.scheduledMinutesFromMidnight),
    worstCaseArrivalTime: formatMinutesToTime(worstCaseArrivalAtDesk),
    leaveByTime: formatMinutesToTime(leaveByMinutes),
    minutesUntilAppointment,
    minutesUntilLeave,
    minutesUntilArrival,
    departureStatus,
    warningTitle,
    warningDetail,
    breakdown: {
      liveClinicDelayMin,
      consultationPaceBufferMin,
      travelBufferMin,
      parkingCheckInBufferMin,
      totalBufferMin:
        liveClinicDelayMin +
        consultationPaceBufferMin +
        travelBufferMin +
        parkingCheckInBufferMin,
    },
  };
}

export function buildLocalizedAlert(
  language: Language,
  appointment: Appointment,
  result: WorstCaseResult,
  simulatedDoctorDelayMin: number,
  simulatedTrafficSpikeMin: number
): { headline: string; body: string; actionTag: string } {
  const { worstCaseArrivalTime, leaveByTime, breakdown } = result;
  const hasDelay = simulatedDoctorDelayMin > 0 || simulatedTrafficSpikeMin > 0;

  switch (language) {
    case 'Hindi':
      return {
        headline: hasDelay
          ? `समय अपडेट: ${appointment.doctorName} (${appointment.token})`
          : `क्लिनिक प्रस्थान सूचना: ${appointment.token}`,
        body: `डॉक्टर की देरी (+${breakdown.liveClinicDelayMin} मिनट), परामर्श गति (+${breakdown.consultationPaceBufferMin} मिनट), और यात्रा/पार्किंग (+${breakdown.travelBufferMin + breakdown.parkingCheckInBufferMin} मिनट) को जोड़कर आपका अधिकतम सुरक्षित आगमन समय ${worstCaseArrivalTime} है। घर से ${leaveByTime} तक निकलें।`,
        actionTag:
          result.departureStatus === 'Leave Now'
            ? 'अभी निकलें'
            : result.departureStatus === 'Delay Absorbed'
              ? 'प्रस्थान समय आगे बढ़ाया गया'
              : 'निकलने के लिए तैयार रहें',
      };
    case 'Kannada':
      return {
        headline: hasDelay
          ? `ಸಮಯ ಬದಲಾವಣೆ: ${appointment.doctorName} (${appointment.token})`
          : `ಕ್ಲಿನಿಕ್ ಹೊರಡುವ ಸೂಚನೆ: ${appointment.token}`,
        body: `ವೈದ್ಯರ ವಿಳಂಬ (+${breakdown.liveClinicDelayMin} ನಿಮಿಷ), ತಪಾಸಣೆ ವೇಗ (+${breakdown.consultationPaceBufferMin} ನಿಮಿಷ), ಹಾಗೂ ಪ್ರಯಾಣ/ಪಾರ್ಕಿಂಗ್ (+${breakdown.travelBufferMin + breakdown.parkingCheckInBufferMin} ನಿಮಿಷ) ಸೇರಿಸಿ ನಿಮ್ಮ ಗರಿಷ್ಠ ಸುರಕ್ಷಿತ ಆಗಮನ ಸಮಯ ${worstCaseArrivalTime}. ಮನೆಯಿಂದ ${leaveByTime} ಒಳಗೆ ಹೊರಡಿ.`,
        actionTag:
          result.departureStatus === 'Leave Now'
            ? 'ಈಗಲೇ ಹೊರಡಿ'
            : result.departureStatus === 'Delay Absorbed'
              ? 'ಹೊರಡುವ ಸಮಯ ಮುಂದೂಡಲಾಗಿದೆ'
              : 'ಹೊರಡಲು ಸಿದ್ಧರಾಗಿ',
      };
    case 'Tamil':
      return {
        headline: hasDelay
          ? `நேர மாற்றம்: ${appointment.doctorName} (${appointment.token})`
          : `கிளினிக் புறப்படும் அறிவிப்பு: ${appointment.token}`,
        body: `மருத்துவர் தாமதம் (+${breakdown.liveClinicDelayMin} நிமிடம்), ஆலோசனை வேகம் (+${breakdown.consultationPaceBufferMin} நிமிடம்), மற்றும் பயணம்/பார்க்கிங் (+${breakdown.travelBufferMin + breakdown.parkingCheckInBufferMin} நிமிடம்) கணக்கிட்டு உங்கள் பாதுகாப்பான வருகை நேரம் ${worstCaseArrivalTime}. வீட்டிலிருந்து ${leaveByTime}-க்குள் புறப்படவும்.`,
        actionTag:
          result.departureStatus === 'Leave Now'
            ? 'இப்போதே புறப்படவும்'
            : result.departureStatus === 'Delay Absorbed'
              ? 'புறப்படும் நேரம் மாற்றப்பட்டது'
              : 'புறப்படத் தயாராகுங்கள்',
      };
    case 'English':
    default:
      return {
        headline: hasDelay
          ? `Live Shift Update: ${appointment.doctorName} (${appointment.token})`
          : `Worst-Case Arrival Ready: ${appointment.token}`,
        body: `Accounting for +${breakdown.liveClinicDelayMin} min clinic delay, +${breakdown.consultationPaceBufferMin} min consultation pace, and +${breakdown.travelBufferMin + breakdown.parkingCheckInBufferMin} min travel & parking, arrive by ${worstCaseArrivalTime}. Leave home by ${leaveByTime} to avoid waiting-room crowding.`,
        actionTag: result.departureStatus,
      };
  }
}
