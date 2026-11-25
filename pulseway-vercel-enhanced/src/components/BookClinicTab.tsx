import { useMemo, useRef, useState, FormEvent } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  Stethoscope,
} from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import {
  DEFAULT_PATIENT_ORIGIN,
  DOCTORS,
  SPECIALTIES,
  calculateWorstCaseArrival,
  parseSlotToMinutes,
} from '../data/mockData';
import {
  Appointment,
  DemandTier,
  Doctor,
  PatientProfile,
  SeverityLevel,
  Specialty,
} from '../types';
import {
  EASE_OUT_EXPO,
  VIEWPORT_ONCE,
  buttonInteraction,
  disclosureVariants,
  imageRevealVariants,
  sectionRevealVariants,
  staggerContainerVariants,
  textRevealVariants,
} from '../utils/motion';
import sectionBookClinicImg from '../assets/images/section_book_clinic.jpg';

interface BookClinicTabProps {
  patient: PatientProfile;
  onBookAppointment: (newAppointment: Appointment) => void;
}

export default function BookClinicTab({
  patient,
  onBookAppointment,
}: BookClinicTabProps) {
  // Step A state: Needs & Patient Details
  const [specialty, setSpecialty] = useState<Specialty>('General Physician');
  const [symptoms, setSymptoms] = useState(
    'Recurring morning dizziness and mild fatigue over the last two days.'
  );
  const [severity, setSeverity] = useState<SeverityLevel>('Moderate');
  const [duration, setDuration] = useState('2–3 Days');
  const [patientName, setPatientName] = useState(patient.name);
  const [patientAge, setPatientAge] = useState(String(patient.age));
  const [patientPhone, setPatientPhone] = useState(patient.contact);
  const [dateLabel, setDateLabel] = useState('Today · 20 Nov');
  const [notes, setNotes] = useState('Prefer morning hydration guidance and vitals check.');

  // Step B state: Fee & Demand Filter + Doctor Selection
  const [tierFilter, setTierFilter] = useState<'all' | DemandTier>('all');
  const [maxFeeCap, setMaxFeeCap] = useState<number>(1700);
  const [sortBy, setSortBy] = useState<'fee-asc' | 'fee-desc' | 'wait-asc'>('fee-asc');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-gp-2');
  const [selectedSlot, setSelectedSlot] = useState<string>('11:30 AM');
  const [paymentChoice, setPaymentChoice] = useState<'Paid Online' | 'Pay at Clinic Desk'>(
    'Paid Online'
  );
  const [formError, setFormError] = useState('');

  const heroSectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroSectionRef,
    offset: ['start end', 'end start'],
  });
  const smoothHeroScroll = useSpring(heroScrollProgress, { stiffness: 120, damping: 24 });
  const heroImageY = useTransform(smoothHeroScroll, [0, 1], [-10, 10]);
  const heroImageScale = useTransform(smoothHeroScroll, [0, 0.5, 1], [1.05, 1.02, 1.05]);

  const specialtyDoctors = useMemo(() => {
    const filtered = DOCTORS.filter((doc) => {
      if (doc.specialty !== specialty) return false;
      if (tierFilter !== 'all' && doc.demandTier !== tierFilter) return false;
      if (doc.feeInr > maxFeeCap) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'fee-asc') return a.feeInr - b.feeInr;
      if (sortBy === 'fee-desc') return b.feeInr - a.feeInr;
      return a.currentQueueCount * a.avgConsultPaceMin - b.currentQueueCount * b.avgConsultPaceMin;
    });
  }, [specialty, tierFilter, maxFeeCap, sortBy]);

  const activeDoctor: Doctor | null = useMemo(() => {
    const found = specialtyDoctors.find((d) => d.id === selectedDoctorId);
    return found || specialtyDoctors[0] || null;
  }, [specialtyDoctors, selectedDoctorId]);

  const activeSlot = useMemo(() => {
    if (!activeDoctor) return '11:00 AM';
    return activeDoctor.availableSlots.includes(selectedSlot)
      ? selectedSlot
      : activeDoctor.availableSlots[0];
  }, [activeDoctor, selectedSlot]);

  const handleSpecialtyChange = (nextSpec: Specialty) => {
    setSpecialty(nextSpec);
    const firstMatch = DOCTORS.find((d) => d.specialty === nextSpec);
    if (firstMatch) {
      setSelectedDoctorId(firstMatch.id);
      setSelectedSlot(firstMatch.availableSlots[0]);
    }
  };

  const liveWorstCasePreview = useMemo(() => {
    if (!activeDoctor) return null;
    return calculateWorstCaseArrival({
      scheduledMinutesFromMidnight: parseSlotToMinutes(activeSlot),
      baseClinicDelayMin: activeDoctor.baseClinicDelayMin,
      avgConsultPaceMin: activeDoctor.avgConsultPaceMin,
      queuePosition: activeDoctor.currentQueueCount + 1,
      baseTravelMin: 22,
      parkingCheckInMin: 6,
    });
  }, [activeDoctor, activeSlot]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setFormError('Please describe the health problem or symptoms in Step A.');
      return;
    }
    if (!patientName.trim() || !patientPhone.trim()) {
      setFormError('Please fill in required patient name and phone details.');
      return;
    }
    if (!activeDoctor) {
      setFormError('Please select an available doctor or relax your fee filter in Step B.');
      return;
    }

    setFormError('');
    const randomNum = Math.floor(20 + Math.random() * 75);
    const tokenPrefix = activeDoctor.specialty.slice(0, 1).toUpperCase();
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      token: `TKN-${tokenPrefix}${randomNum}`,
      queuePosition: activeDoctor.currentQueueCount + 1,
      doctorId: activeDoctor.id,
      doctorName: activeDoctor.name,
      doctorPhoto: activeDoctor.photoUrl,
      specialty: activeDoctor.specialty,
      clinicWing: activeDoctor.clinicWing,
      originLocation: DEFAULT_PATIENT_ORIGIN,
      clinicLocation: activeDoctor.clinicCoords,
      consultationMode: 'In-Clinic Visit',
      scheduledTime: activeSlot,
      scheduledMinutesFromMidnight: parseSlotToMinutes(activeSlot),
      dateLabel,
      symptoms: symptoms.trim(),
      severity,
      duration,
      notes: notes.trim(),
      patientName: patientName.trim(),
      patientAge: Math.max(1, Math.min(115, parseInt(patientAge, 10) || patient.age)),
      patientPhone: patientPhone.trim(),
      feeAmount: activeDoctor.feeInr,
      feeStatus: paymentChoice,
      demandLabel: activeDoctor.demandLabel,
      baseClinicDelayMin: activeDoctor.baseClinicDelayMin,
      avgConsultPaceMin: activeDoctor.avgConsultPaceMin,
      baseTravelMin: 22,
      parkingCheckInMin: 6,
    };

    onBookAppointment(newApt);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Section Header + Full-Visibility Reference Photo */}
      <motion.section
        ref={heroSectionRef}
        aria-label="Book Clinic Section Overview"
        variants={sectionRevealVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#0E2340] border border-[#1E3F6D] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch section-highlight section-highlight-pulse"
      >
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5"
        >
          <div>
            <motion.p variants={textRevealVariants} className="text-xs font-mono text-[#00B4A6]">
              02 · Two-Step Clinic Booking · Demand-Transparent Fees
            </motion.p>
            <motion.h1
              variants={textRevealVariants}
              className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5"
            >
              Book Clinic Appointment
            </motion.h1>
            <motion.p
              variants={textRevealVariants}
              className="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed"
            >
              Describe your symptoms first, then compare specialists by demand tier, consultation
              pace, and transparent clinic fee before confirming your slot.
            </motion.p>
          </div>

          <motion.div
            variants={textRevealVariants}
            className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#1D3E6B] text-xs font-mono text-slate-300"
          >
            <span className="text-[#00B4A6]">Step A: Symptoms &amp; Patient Info</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-[#FF6B57]">Step B: Fee &amp; Demand Selector</span>
          </motion.div>
        </motion.div>

        <div className="lg:col-span-5 bg-[#08172B] border-t lg:border-t-0 lg:border-l border-[#1E3F6D] min-h-[220px] sm:min-h-[260px] overflow-hidden">
          <motion.div
            style={{ y: heroImageY, scale: heroImageScale }}
            className="w-full h-full motion-gpu"
          >
            <motion.img
              variants={imageRevealVariants}
              initial="hidden"
              animate="visible"
              src={sectionBookClinicImg}
              alt="Clinical consultation room and diagnostic examination desk"
              referrerPolicy="no-referrer"
              className="w-full h-full max-h-[300px] lg:max-h-none object-cover object-center"
            />
          </motion.div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Step A: Needs & Patient Details */}
        <motion.section
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="xl:col-span-5 bg-[#0E2340] border border-[#1E3F6D] rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#1D3E6B] pb-4">
            <div>
              <span className="text-xs font-mono text-[#00B4A6]">Step A</span>
              <h2 className="font-display text-lg font-bold text-white mt-0.5">
                Needs, Symptoms & Patient Details
              </h2>
            </div>
            <Stethoscope className="w-5 h-5 text-[#00B4A6]" />
          </div>

          {/* Specialty Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-2">
              Doctor Type / Specialty
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPECIALTIES.map((spec) => {
                const active = specialty === spec;
                return (
                  <motion.button
                    key={spec}
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSpecialtyChange(spec)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-medium border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#00B4A6]/18 border-[#00B4A6] text-white'
                        : 'bg-[#091A31] border-[#1E3F6D] text-slate-300 hover:border-[#34619E]'
                    }`}
                  >
                    {spec}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label htmlFor="booking-symptoms" className="block text-xs font-medium text-slate-200 mb-1.5">
              Problem / Symptoms
            </label>
            <textarea
              id="booking-symptoms"
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe primary symptoms, discomfort, or checkup purpose..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#091A31] border border-[#23487A] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00B4A6]"
            />
          </div>

          {/* Severity & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1.5">
                Severity Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Mild', 'Moderate', 'Urgent'] as SeverityLevel[]).map((sev) => (
                  <motion.button
                    key={sev}
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSeverity(sev)}
                    className={`py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      severity === sev
                        ? sev === 'Urgent'
                          ? 'bg-[#FF6B57] border-[#FF6B57] text-[#08172B] font-semibold'
                          : 'bg-[#00B4A6] border-[#00B4A6] text-[#08172B] font-semibold'
                        : 'bg-[#091A31] border-[#1E3F6D] text-slate-300 hover:border-[#34619E]'
                    }`}
                  >
                    {sev}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="booking-duration" className="block text-xs font-medium text-slate-200 mb-1.5">
                Symptom Duration
              </label>
              <select
                id="booking-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#091A31] border border-[#23487A] text-sm text-white focus:outline-none focus:border-[#00B4A6]"
              >
                <option value="Today">Started Today</option>
                <option value="2–3 Days">2–3 Days</option>
                <option value="4–7 Days">4–7 Days</option>
                <option value="1+ Week">More than 1 Week</option>
              </select>
            </div>
          </div>

          {/* Patient Info */}
          <div className="pt-2 border-t border-[#1D3E6B] space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="book-name" className="block text-xs font-medium text-slate-200 mb-1">
                  Patient Full Name
                </label>
                <input
                  id="book-name"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#091A31] border border-[#23487A] text-sm text-white focus:outline-none focus:border-[#00B4A6]"
                />
              </div>
              <div>
                <label htmlFor="book-age" className="block text-xs font-medium text-slate-200 mb-1">
                  Age
                </label>
                <input
                  id="book-age"
                  type="number"
                  min={1}
                  max={115}
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#091A31] border border-[#23487A] text-sm font-mono tabular-nums text-white focus:outline-none focus:border-[#00B4A6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="book-phone" className="block text-xs font-medium text-slate-200 mb-1">
                  Mobile / Contact
                </label>
                <input
                  id="book-phone"
                  type="text"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#091A31] border border-[#23487A] text-sm text-white focus:outline-none focus:border-[#00B4A6]"
                />
              </div>
              <div>
                <label htmlFor="book-date" className="block text-xs font-medium text-slate-200 mb-1">
                  Preferred Date
                </label>
                <select
                  id="book-date"
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#091A31] border border-[#23487A] text-sm text-white focus:outline-none focus:border-[#00B4A6]"
                >
                  <option value="Today · 20 Nov">Today · 20 Nov</option>
                  <option value="Tomorrow · 21 Nov">Tomorrow · 21 Nov</option>
                  <option value="Sat · 22 Nov">Sat · 22 Nov</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="book-notes" className="block text-xs font-medium text-slate-200 mb-1">
                Additional Clinical Notes (Optional)
              </label>
              <input
                id="book-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, current medications, or mobility support..."
                className="w-full px-3.5 py-2 rounded-lg bg-[#091A31] border border-[#23487A] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00B4A6]"
              />
            </div>
          </div>
        </motion.section>

        {/* Step B: Fee & Demand Selector */}
        <motion.section
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="xl:col-span-7 bg-[#0E2340] border border-[#1E3F6D] rounded-xl p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1D3E6B] pb-4">
            <div>
              <span className="text-xs font-mono text-[#FF6B57]">Step B</span>
              <h2 className="font-display text-lg font-bold text-white mt-0.5">
                Fee & Demand Selector · {specialty}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Higher-demand senior consultants carry higher fees; lower-demand doctors offer lower
                fees and shorter waits.
              </p>
            </div>
            <SlidersHorizontal className="w-5 h-5 text-[#FF6B57]" />
          </div>

          {/* Filter & Budget Controls */}
          <div className="bg-[#091A31] border border-[#1D3E6B] rounded-lg p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: 'All Demand Tiers' },
                    { id: 'low', label: 'Low Demand · Lower Fee' },
                    { id: 'moderate', label: 'Moderate Demand' },
                    { id: 'high', label: 'High Demand · Senior' },
                  ] as const
                ).map((item) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setTierFilter(item.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                      tierFilter === item.id
                        ? 'bg-[#00B4A6] border-[#00B4A6] text-[#08172B] font-semibold'
                        : 'bg-[#0E2340] border-[#23487A] text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              <select
                aria-label="Sort doctors"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1.5 rounded-md bg-[#0E2340] border border-[#23487A] text-xs text-white focus:outline-none focus:border-[#00B4A6]"
              >
                <option value="fee-asc">Sort: Fee Low to High</option>
                <option value="fee-desc">Sort: Fee High to Low</option>
                <option value="wait-asc">Sort: Shortest Wait</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <label htmlFor="fee-cap-slider" className="text-xs text-slate-300 whitespace-nowrap">
                Max Fee Budget:{' '}
                <span className="font-mono tabular-nums font-semibold text-white">
                  ₹{maxFeeCap}
                </span>
              </label>
              <input
                id="fee-cap-slider"
                type="range"
                min={450}
                max={1700}
                step={50}
                value={maxFeeCap}
                onChange={(e) => setMaxFeeCap(Number(e.target.value))}
                className="w-full accent-[#00B4A6] cursor-pointer"
              />
            </div>
          </div>

          {/* Filtered Doctor Cards */}
          {specialtyDoctors.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              className="p-6 rounded-lg bg-[#091A31] border border-[#1D3E6B] text-center space-y-2"
            >
              <p className="text-sm text-slate-200 font-medium">
                No doctors match your current fee cap or demand filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTierFilter('all');
                  setMaxFeeCap(1700);
                }}
                className="text-xs font-semibold text-[#00B4A6] hover:underline cursor-pointer"
              >
                Reset Fee & Demand Filters
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {specialtyDoctors.map((doc) => {
                  const isSelected = activeDoctor?.id === doc.id;
                  const estWaitMin = doc.currentQueueCount * doc.avgConsultPaceMin + doc.baseClinicDelayMin;

                  return (
                    <motion.div
                      key={doc.id}
                      layout="position"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
                      whileHover={{ y: -2 }}
                      onClick={() => {
                        setSelectedDoctorId(doc.id);
                        if (!doc.availableSlots.includes(selectedSlot)) {
                          setSelectedSlot(doc.availableSlots[0]);
                        }
                      }}
                      className={`rounded-xl p-4 sm:p-5 border transition-colors cursor-pointer motion-gpu ${
                        isSelected
                          ? 'bg-[#122D52] border-[#00B4A6]'
                          : 'bg-[#091A31] border-[#1D3E6B] hover:border-[#34619E]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <img
                            src={doc.photoUrl}
                            alt={doc.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-cover object-top border border-[#23487A] bg-[#0B1F3A] shrink-0 mt-0.5"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span
                                className={`font-semibold ${
                                  doc.demandTier === 'high'
                                    ? 'text-[#FF6B57]'
                                    : doc.demandTier === 'moderate'
                                      ? 'text-sky-300'
                                      : 'text-[#00B4A6]'
                                }`}
                              >
                                {doc.demandLabel}
                              </span>
                              <span aria-hidden="true" className="text-slate-500">
                                ·
                              </span>
                              <span className="text-slate-300">{doc.experienceYears} yrs exp</span>
                              <span aria-hidden="true" className="text-slate-500">
                                ·
                              </span>
                              <span className="text-slate-300">{doc.clinicWing}</span>
                            </div>
                            <h3 className="font-display text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
                              <span>{doc.name}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-[#00B4A6]" />}
                            </h3>
                            <p className="text-xs text-slate-300 mt-0.5">
                              {doc.qualification} · {doc.ratingNote}
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <div className="font-mono tabular-nums text-xl font-bold text-white">
                            ₹{doc.feeInr}
                          </div>
                          <div className="text-xs text-slate-400">Consultation Fee</div>
                        </div>
                      </div>

                      {/* Pace & Queue Metrics */}
                      <div className="mt-3 pt-3 border-t border-[#1D3E6B]/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums text-slate-300">
                        <span>Pace: ~{doc.avgConsultPaceMin} min/patient</span>
                        <span>Queue Ahead: {doc.currentQueueCount} patients</span>
                        <span className="text-[#00B4A6]">Est. Wait: ~{estWaitMin} min</span>
                      </div>

                      {/* Slot Picker inside Selected Doctor */}
                      <AnimatePresence initial={false}>
                        {isSelected && (
                          <motion.div
                            variants={disclosureVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="mt-4 pt-3 border-t border-[#1D3E6B] space-y-2.5">
                              <div className="text-xs font-medium text-slate-200">
                                Choose Appointment Time Window ({dateLabel})
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {doc.availableSlots.map((slot) => (
                                  <motion.button
                                    key={slot}
                                    type="button"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-mono tabular-nums border transition-colors cursor-pointer ${
                                      activeSlot === slot
                                        ? 'bg-[#00B4A6] border-[#00B4A6] text-[#08172B] font-semibold'
                                        : 'bg-[#091A31] border-[#23487A] text-slate-200 hover:border-[#00B4A6]'
                                    }`}
                                  >
                                    {slot}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Live Worst-Case Arrival Preview + Fee Payment Choice + Confirm */}
          {activeDoctor && liveWorstCasePreview && (
            <div className="bg-[#091A31] border border-[#00B4A6]/45 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-[#00B4A6] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Worst-Case Arrival Preview for {activeSlot}</span>
                  </div>
                  <div className="text-sm text-slate-200 mt-1">
                    Arrive by{' '}
                    <span className="font-mono tabular-nums font-bold text-[#00B4A6]">
                      {liveWorstCasePreview.worstCaseArrivalTime}
                    </span>{' '}
                    · Leave home by{' '}
                    <span className="font-mono tabular-nums font-bold text-white">
                      {liveWorstCasePreview.leaveByTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(['Paid Online', 'Pay at Clinic Desk'] as const).map((mode) => (
                    <motion.button
                      key={mode}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setPaymentChoice(mode)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                        paymentChoice === mode
                          ? 'bg-[#173763] border-[#00B4A6] text-white'
                          : 'bg-[#0E2340] border-[#23487A] text-slate-300'
                      }`}
                    >
                      {mode}
                    </motion.button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {formError && (
                  <motion.div
                    variants={disclosureVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-lg bg-[#FF6B57]/15 border border-[#FF6B57]/50 text-xs text-[#FFB3A8]">
                      {formError}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                {...buttonInteraction}
                className="w-full py-3.5 px-6 rounded-lg bg-[#FF6B57] hover:bg-[#FF7F6D] text-[#08172B] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B57]"
              >
                <span>
                  Confirm Booking with {activeDoctor.name} (₹{activeDoctor.feeInr})
                </span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </motion.section>
      </div>
    </form>
  );
}
