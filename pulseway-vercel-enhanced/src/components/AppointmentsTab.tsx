import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Car,
  Clock,
  Globe,
  MapPin,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
  Timer,
  User,
} from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import {
  LANGUAGES,
  buildLocalizedAlert,
  calculateWorstCaseArrival,
  formatCountdownHMS,
} from '../data/mockData';
import { Appointment, Language } from '../types';
import {
  EASE_OUT_EXPO,
  SPRING_GENTLE,
  VIEWPORT_ONCE,
  buttonInteraction,
  cardInteraction,
  disclosureVariants,
  imageRevealVariants,
  sectionRevealVariants,
  staggerContainerVariants,
  staggerItemVariants,
  textRevealVariants,
} from '../utils/motion';
import sectionAppointmentsImg from '../assets/images/section_appointments.jpg';
import AppointmentRouteMap from './AppointmentRouteMap';

interface AppointmentsTabProps {
  appointments: Appointment[];
  selectedAppointmentId: string;
  onSelectAppointment: (id: string) => void;
  newlyBookedId: string | null;
  patientLanguage: Language;
  simDoctorDelay: number;
  simTrafficSpike: number;
  onChangeSimDoctorDelay: (min: number) => void;
  onChangeSimTrafficSpike: (min: number) => void;
  onGoToBookTab: () => void;
}

export default function AppointmentsTab({
  appointments,
  selectedAppointmentId,
  onSelectAppointment,
  newlyBookedId,
  patientLanguage,
  simDoctorDelay,
  simTrafficSpike,
  onChangeSimDoctorDelay,
  onChangeSimTrafficSpike,
  onGoToBookTab,
}: AppointmentsTabProps) {
  const [previewLang, setPreviewLang] = useState<Language>(patientLanguage);
  // Real-time ticking seconds elapsed since viewing/simulating, driving decreasing countdown timers
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const heroSectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroSectionRef,
    offset: ['start end', 'end start'],
  });
  const smoothHeroScroll = useSpring(heroScrollProgress, { stiffness: 120, damping: 24 });
  const heroImageY = useTransform(smoothHeroScroll, [0, 1], [-10, 10]);
  const heroImageScale = useTransform(smoothHeroScroll, [0, 0.5, 1], [1.05, 1.02, 1.05]);

  const selectedAppointment =
    appointments.find((a) => a.id === selectedAppointmentId) || appointments[0] || null;

  useEffect(() => {
    setElapsedSeconds(0);
  }, [selectedAppointment?.id, simDoctorDelay, simTrafficSpike]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!selectedAppointment) {
    return (
      <motion.div
        variants={sectionRevealVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#0F2747] border border-[#1E3F6D] rounded-xl p-10 text-center space-y-4 section-highlight"
      >
        <CalendarClock className="w-10 h-10 text-[#00B4A6] mx-auto" />
        <h2 className="font-display text-xl font-bold text-white">
          No active clinic appointments yet
        </h2>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Book a clinic slot to generate your queue token and worst-case arrival timeline.
        </p>
        <motion.button
          type="button"
          onClick={onGoToBookTab}
          {...buttonInteraction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF6B57] hover:bg-[#FF7F6D] text-[#08172B] font-semibold text-sm transition-colors cursor-pointer"
        >
          <span>Book Clinic Appointment</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    );
  }

  const arrivalResult = calculateWorstCaseArrival(
    selectedAppointment,
    simDoctorDelay,
    simTrafficSpike
  );
  const { breakdown } = arrivalResult;

  // Decreasing timers in seconds
  const appointmentCountdownSec = Math.max(
    0,
    arrivalResult.minutesUntilAppointment * 60 - elapsedSeconds
  );
  const leaveCountdownSec = Math.max(0, arrivalResult.minutesUntilLeave * 60 - elapsedSeconds);
  const arrivalCountdownSec = Math.max(0, arrivalResult.minutesUntilArrival * 60 - elapsedSeconds);

  const localizedAlert = buildLocalizedAlert(
    previewLang,
    selectedAppointment,
    arrivalResult,
    simDoctorDelay,
    simTrafficSpike
  );

  const totalBuf = Math.max(1, breakdown.totalBufferMin);
  const clinicPct = (breakdown.liveClinicDelayMin / totalBuf) * 100;
  const pacePct = (breakdown.consultationPaceBufferMin / totalBuf) * 100;
  const travelPct = (breakdown.travelBufferMin / totalBuf) * 100;
  const parkingPct = (breakdown.parkingCheckInBufferMin / totalBuf) * 100;

  const isCriticalLeave = leaveCountdownSec <= 18 * 60 || arrivalResult.departureStatus === 'Leave Now';
  const isPrepareLeave = !isCriticalLeave && (leaveCountdownSec <= 40 * 60 || arrivalResult.departureStatus === 'Prepare to Leave');
  const isDelayActive = simDoctorDelay > 0 || simTrafficSpike > 0;

  return (
    <div className="space-y-8">
      {/* Top Section Header + Full-Visibility Reference Photo */}
      <motion.section
        ref={heroSectionRef}
        aria-label="Appointments Section Overview"
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
              01 · Active Queue &amp; Decreasing Arrival Timers
            </motion.p>
            <motion.h1
              variants={textRevealVariants}
              className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5"
            >
              Booked Appointments &amp; Worst-Case Arrival
            </motion.h1>
            <motion.p
              variants={textRevealVariants}
              className="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed"
            >
              Track live consultation wing drift, decreasing departure countdowns, and real-time
              campus route travel buffers for every booked visit.
            </motion.p>
          </div>

          <motion.div
            variants={textRevealVariants}
            className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#1D3E6B]"
          >
            <motion.button
              type="button"
              onClick={onGoToBookTab}
              {...buttonInteraction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF6B57] hover:bg-[#FF7F6D] text-[#08172B] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>New Clinic Booking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
            <span className="text-xs font-mono tabular-nums text-slate-300">
              {appointments.length} Active Clinic {appointments.length === 1 ? 'Visit' : 'Visits'}
            </span>
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
              src={sectionAppointmentsImg}
              alt="Hospital reception lobby and clinic check-in lounge"
              referrerPolicy="no-referrer"
              className="w-full h-full max-h-[300px] lg:max-h-none object-cover object-center"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Booked Appointments Grid */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {appointments.map((apt) => {
          const isSelected = apt.id === selectedAppointment.id;
          const isNewlyBooked = apt.id === newlyBookedId;
          const previewCalc = calculateWorstCaseArrival(
            apt,
            isSelected ? simDoctorDelay : 0,
            isSelected ? simTrafficSpike : 0
          );
          const cardAppointmentSec = Math.max(
            0,
            previewCalc.minutesUntilAppointment * 60 - elapsedSeconds
          );
          const cardArrivalSec = Math.max(
            0,
            previewCalc.minutesUntilArrival * 60 - (isSelected ? elapsedSeconds : 0)
          );

          return (
            <motion.button
              key={apt.id}
              type="button"
              onClick={() => onSelectAppointment(apt.id)}
              variants={staggerItemVariants}
              {...cardInteraction}
              className={`text-left w-full rounded-xl p-5 sm:p-6 border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B4A6] motion-gpu ${
                isSelected
                  ? 'bg-[#122D52] border-[#00B4A6]'
                  : 'bg-[#0E2340] border-[#1D3E6B] hover:border-[#34619E]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  <span className="text-[#00B4A6] font-semibold">{apt.token}</span>
                  <span aria-hidden="true">·</span>
                  <span>Queue #{apt.queuePosition}</span>
                  <span aria-hidden="true">·</span>
                  <span>{apt.consultationMode}</span>
                </div>
                <span className="font-mono tabular-nums text-white font-medium">
                  {apt.dateLabel} · {apt.scheduledTime} ·{' '}
                  <span className="text-[#FF6B57]">
                    Starts in {formatCountdownHMS(cardAppointmentSec)}
                  </span>
                </span>
              </div>

              <AnimatePresence>
                {isNewlyBooked && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                    className="mt-2.5 text-xs font-semibold text-[#00B4A6]"
                  >
                    Booking Confirmed — Decreasing Arrival Timer & Route Loaded Below
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Doctor Photo + Name & Fee */}
              <div className="mt-3.5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={apt.doctorPhoto}
                    alt={apt.doctorName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover object-top border border-[#23487A] bg-[#091A31] shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold text-white truncate">
                      {apt.doctorName}
                    </h2>
                    <div className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{apt.specialty}</span>
                      <span aria-hidden="true">·</span>
                      <span>{apt.clinicWing}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#FF6B57]">{apt.demandLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums shrink-0">
                  <div className="text-sm font-semibold text-white">
                    {apt.feeAmount === 0 ? 'Free' : `₹${apt.feeAmount}`}
                  </div>
                  <div className="text-xs text-[#00B4A6]">{apt.feeStatus}</div>
                </div>
              </div>

              {/* Symptoms & Notes entered during booking */}
              <div className="mt-4 pt-4 border-t border-[#1D3E6B] space-y-2.5">
                <div>
                  <div className="text-xs font-medium text-slate-400">
                    Reported Symptoms ({apt.severity} · {apt.duration})
                  </div>
                  <p className="text-sm text-slate-100 mt-0.5 leading-relaxed">
                    {apt.symptoms}
                  </p>
                  {apt.notes && (
                    <p className="text-xs text-slate-300 mt-1">
                      Patient Notes: {apt.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-[#1D3E6B]/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#00B4A6]" />
                    <span>
                      {apt.patientName}, {apt.patientAge} yrs · {apt.patientPhone}
                    </span>
                  </div>
                  <div className="font-mono tabular-nums text-white flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#FF6B57]" />
                      <span>Slot In:</span>
                      <span className="text-[#FF6B57] font-semibold">
                        {formatCountdownHMS(cardAppointmentSec)}
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5 text-[#00B4A6]" />
                      <span>Arrival In:</span>
                      <span className="text-[#00B4A6] font-semibold">
                        {formatCountdownHMS(cardArrivalSec)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Dedicated Worst-Case Arrival Panel Directly Below Appointment Cards */}
      <motion.section
        aria-label="Worst-Case Arrival Timing Engine"
        variants={sectionRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="bg-[#0E2340] border border-[#1E3F6D] rounded-xl p-6 sm:p-8 space-y-7"
      >
        {/* Live Warning Banner */}
        <motion.div
          key={`${arrivalResult.departureStatus}-${selectedAppointment.id}`}
          initial={{ opacity: 0.75, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
          role="status"
          className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
            isCriticalLeave
              ? 'bg-[#FF6B57]/15 border-[#FF6B57]'
              : isPrepareLeave
                ? 'bg-[#FF6B57]/10 border-[#FF6B57]/60'
                : 'bg-[#00B4A6]/12 border-[#00B4A6]/60'
          }`}
        >
          <div className="flex items-start gap-3">
            {isCriticalLeave || isPrepareLeave ? (
              <AlertTriangle className="w-5 h-5 text-[#FF6B57] shrink-0 mt-0.5" />
            ) : (
              <Stethoscope className="w-5 h-5 text-[#00B4A6] shrink-0 mt-0.5" />
            )}
            <div>
              <div
                className={`font-display text-sm sm:text-base font-bold ${
                  isCriticalLeave || isPrepareLeave ? 'text-[#FF6B57]' : 'text-[#00B4A6]'
                }`}
              >
                {arrivalResult.warningTitle}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                {arrivalResult.warningDetail}
              </p>
            </div>
          </div>

          <div className="font-mono tabular-nums text-xs text-slate-200 bg-[#08172B] border border-[#1E3F6D] px-3 py-2 rounded-lg shrink-0">
            Status: <span className="font-semibold text-white">{arrivalResult.departureStatus}</span>
          </div>
        </motion.div>

        {/* Header & Decreasing Countdown Timers */}
        <div className="space-y-6 pb-6 border-b border-[#1D3E6B]">
          <div className="flex items-start gap-4">
            <img
              src={selectedAppointment.doctorPhoto}
              alt={selectedAppointment.doctorName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover object-top border border-[#00B4A6]/50 bg-[#091A31] shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[#00B4A6]">
                <Clock className="w-4 h-4" />
                <span>
                  Live Countdown · {selectedAppointment.token} ({selectedAppointment.doctorName})
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Decreasing Appointment, Arrival & Departure Timers
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl">
                Ticking down in real time for your booked appointment slot, worst-case arrival
                window, and departure margin ahead of Queue #{selectedAppointment.queuePosition}.
              </p>
            </div>
          </div>

          {/* 4 Tabular Decreasing Timer KPIs */}
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div
              variants={staggerItemVariants}
              whileHover={{ y: -2 }}
              className="bg-[#091A31] border border-[#23487A] rounded-lg px-4 py-3"
            >
              <div className="text-xs text-slate-400">Appointment Time Timer</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-white mt-1">
                {formatCountdownHMS(appointmentCountdownSec)}
              </div>
              <div className="text-xs text-slate-300 font-mono tabular-nums mt-0.5">
                Booked Slot {arrivalResult.scheduledTimeFormatted}
              </div>
            </motion.div>

            <motion.div
              variants={staggerItemVariants}
              whileHover={{ y: -2 }}
              className="bg-[#091A31] border border-[#00B4A6]/55 rounded-lg px-4 py-3"
            >
              <div className="text-xs text-slate-400">Worst-Case Arrival Timer</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-[#00B4A6] mt-1">
                {formatCountdownHMS(arrivalCountdownSec)}
              </div>
              <div className="text-xs text-slate-300 font-mono tabular-nums mt-0.5">
                Target {arrivalResult.worstCaseArrivalTime}
              </div>
            </motion.div>

            <motion.div
              variants={staggerItemVariants}
              whileHover={{ y: -2 }}
              className={`rounded-lg px-4 py-3 border transition-colors ${
                isCriticalLeave
                  ? 'bg-[#FF6B57]/15 border-[#FF6B57]'
                  : 'bg-[#091A31] border-[#1E3F6D]'
              }`}
            >
              <div className="text-xs text-slate-300">Leave Home Timer</div>
              <div
                className={`font-mono tabular-nums text-2xl font-bold mt-1 ${
                  isCriticalLeave ? 'text-[#FF6B57]' : 'text-white'
                }`}
              >
                {formatCountdownHMS(leaveCountdownSec)}
              </div>
              <div className="text-xs text-slate-300 font-mono tabular-nums mt-0.5">
                Leave by {arrivalResult.leaveByTime}
              </div>
            </motion.div>

            <motion.div
              variants={staggerItemVariants}
              whileHover={{ y: -2 }}
              className="bg-[#091A31] border border-[#1E3F6D] rounded-lg px-4 py-3"
            >
              <div className="text-xs text-slate-400">Total Protected Buffer</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-[#FF6B57] mt-1">
                +{breakdown.totalBufferMin} min
              </div>
              <div className="text-xs text-slate-300 font-mono tabular-nums mt-0.5">
                {selectedAppointment.clinicWing}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Buffer Breakdown Gauge */}
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-white">
              Buffer Breakdown Gauge
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-300">
              Total Protected Buffer: +{breakdown.totalBufferMin} minutes
            </span>
          </div>

          <div
            className="w-full h-4 rounded-md overflow-hidden bg-[#091A31] flex border border-[#1E3F6D]"
            role="img"
            aria-label={`Buffer breakdown: ${breakdown.liveClinicDelayMin}m clinic delay, ${breakdown.consultationPaceBufferMin}m pace buffer, ${breakdown.travelBufferMin}m travel, ${breakdown.parkingCheckInBufferMin}m parking`}
          >
            <motion.div
              initial={false}
              animate={{ width: `${clinicPct}%` }}
              transition={SPRING_GENTLE}
              className="h-full bg-[#FF6B57]"
              title={`Live Clinic Delay: +${breakdown.liveClinicDelayMin} min`}
            />
            <motion.div
              initial={false}
              animate={{ width: `${pacePct}%` }}
              transition={SPRING_GENTLE}
              className="h-full bg-[#00B4A6]"
              title={`Consultation Pace Buffer: +${breakdown.consultationPaceBufferMin} min`}
            />
            <motion.div
              initial={false}
              animate={{ width: `${travelPct}%` }}
              transition={SPRING_GENTLE}
              className="h-full bg-[#38BDF8]"
              title={`Travel Buffer: +${breakdown.travelBufferMin} min`}
            />
            <motion.div
              initial={false}
              animate={{ width: `${parkingPct}%` }}
              transition={SPRING_GENTLE}
              className="h-full bg-[#64748B]"
              title={`Parking & Check-In Buffer: +${breakdown.parkingCheckInBufferMin} min`}
            />
          </div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div
              variants={staggerItemVariants}
              whileHover={{ y: -2 }}
              className="bg-[#091A31] border border-[#1D3E6B] rounded-lg p-4"
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#FF6B57]" />
                  <span>Live Clinic Delay</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-[#FF6B57]">
                  +{breakdown.liveClinicDelayMin} min
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Real-time wing drift ({selectedAppointment.baseClinicDelayMin}m base
                {simDoctorDelay > 0 ? ` + ${simDoctorDelay}m surge` : ''}).
              </p>
            </motion.div>

            <motion.div
              variants={staggerItemVariants}
              whileHover={{ y: -2 }}
              className="bg-[#091A31] border border-[#1D3E6B] rounded-lg p-4"
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#00B4A6]" />
                  <span>Consult Pace Buffer</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-[#00B4A6]">
                  +{breakdown.consultationPaceBufferMin} min
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {selectedAppointment.avgConsultPaceMin} min/patient pace across{' '}
                {Math.max(1, selectedAppointment.queuePosition - 1)} patients ahead.
              </p>
            </motion.div>

            <motion.div
              variants={staggerItemVariants}
              whileHover={{ y: -2 }}
              className="bg-[#091A31] border border-[#1D3E6B] rounded-lg p-4"
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#38BDF8]" />
                  <span>Travel Buffer</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-white">
                  +{breakdown.travelBufferMin} min
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Door-to-campus transit ({selectedAppointment.baseTravelMin}m base
                {simTrafficSpike > 0 ? ` + ${simTrafficSpike}m traffic` : ''}).
              </p>
            </motion.div>

            <motion.div
              variants={staggerItemVariants}
              whileHover={{ y: -2 }}
              className="bg-[#091A31] border border-[#1D3E6B] rounded-lg p-4"
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#64748B]" />
                  <span>Parking & Check-In</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-white">
                  +{breakdown.parkingCheckInBufferMin} min
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Campus entry, elevator walk to {selectedAppointment.clinicWing}, and desk scan.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Live Delay Simulator + Multi-Language Alert Preview */}
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-[#1D3E6B]"
        >
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#FF6B57]" />
                  <span>Live Delay & Traffic Simulator</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Test how sudden clinic or route changes shift your decreasing timers and route.
                </p>
              </div>
              <AnimatePresence>
                {isDelayActive && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      onChangeSimDoctorDelay(0);
                      onChangeSimTrafficSpike(0);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#00B4A6] hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-3 bg-[#091A31] border border-[#1D3E6B] rounded-lg p-4">
              <div>
                <div className="text-xs font-medium text-slate-200 mb-2">
                  Simulate Sudden Doctor Delay
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '+0m', val: 0 },
                    { label: '+10m', val: 10 },
                    { label: '+20m', val: 20 },
                    { label: '+35m', val: 35 },
                  ].map((opt) => (
                    <motion.button
                      key={opt.val}
                      type="button"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onChangeSimDoctorDelay(opt.val)}
                      className={`py-2 px-2 rounded-md text-xs font-mono tabular-nums font-medium border transition-colors cursor-pointer ${
                        simDoctorDelay === opt.val
                          ? 'bg-[#FF6B57] border-[#FF6B57] text-[#08172B] font-semibold'
                          : 'bg-[#0E2340] border-[#23487A] text-slate-200 hover:border-[#FF6B57]/60'
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-200 mb-2 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-[#00B4A6]" />
                  <span>Simulate Route Traffic Spike</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Clear (+0m)', val: 0 },
                    { label: 'Moderate (+12m)', val: 12 },
                    { label: 'Heavy (+24m)', val: 24 },
                  ].map((opt) => (
                    <motion.button
                      key={opt.val}
                      type="button"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onChangeSimTrafficSpike(opt.val)}
                      className={`py-2 px-2 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                        simTrafficSpike === opt.val
                          ? 'bg-[#00B4A6] border-[#00B4A6] text-[#08172B] font-semibold'
                          : 'bg-[#0E2340] border-[#23487A] text-slate-200 hover:border-[#00B4A6]/60'
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#00B4A6]" />
                  <span>Local Language Alert Preview</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Plain-language SMS & app alert sent automatically in the patient&apos;s chosen language.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-[#091A31] p-1 rounded-lg border border-[#1D3E6B]">
                {LANGUAGES.map((lang) => (
                  <motion.button
                    key={lang}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPreviewLang(lang)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      previewLang === lang
                        ? 'bg-[#00B4A6] text-[#08172B] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {lang}
                  </motion.button>
                ))}
              </div>
            </div>

            <div
              className={`rounded-xl p-5 border transition-colors ${
                isDelayActive
                  ? 'bg-[#FF6B57]/10 border-[#FF6B57]/60'
                  : 'bg-[#091A31] border-[#00B4A6]/45'
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${previewLang}-${simDoctorDelay}-${simTrafficSpike}-${selectedAppointment.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className={isDelayActive ? 'text-[#FF6B57]' : 'text-[#00B4A6]'}>
                      {previewLang} Alert · {localizedAlert.actionTag}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedAppointment.clinicWing}</span>
                    </span>
                  </div>
                  <div className="font-display text-base font-bold text-white mt-2">
                    {localizedAlert.headline}
                  </div>
                  <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                    {localizedAlert.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Map Route Section Down Inside Appointments */}
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="pt-4 border-t border-[#1D3E6B]"
        >
          <AppointmentRouteMap
            origin={selectedAppointment.originLocation}
            destination={selectedAppointment.clinicLocation}
            clinicWing={selectedAppointment.clinicWing}
            doctorName={selectedAppointment.doctorName}
            simulatedTrafficSpikeMin={simTrafficSpike}
            baseTravelMin={selectedAppointment.baseTravelMin}
          />
        </motion.div>
      </motion.section>
    </div>
  );
}
