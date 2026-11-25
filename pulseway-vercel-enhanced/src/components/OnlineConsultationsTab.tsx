import { useEffect, useRef, useState } from 'react';
import {
  Clock,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import { ONLINE_CONSULTATIONS } from '../data/mockData';
import { OnlineConsultation, PatientProfile } from '../types';
import {
  EASE_OUT_EXPO,
  VIEWPORT_ONCE,
  buttonInteraction,
  cardInteraction,
  imageRevealVariants,
  sectionRevealVariants,
  staggerContainerVariants,
  staggerItemVariants,
  textRevealVariants,
} from '../utils/motion';
import sectionOnlineConsultImg from '../assets/images/section_online_consult.jpg';

interface OnlineConsultationsTabProps {
  patient: PatientProfile;
}

export default function OnlineConsultationsTab({ patient }: OnlineConsultationsTabProps) {
  const [activeRoom, setActiveRoom] = useState<OnlineConsultation | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [preCallNotes, setPreCallNotes] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const heroSectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroSectionRef,
    offset: ['start end', 'end start'],
  });
  const smoothHeroScroll = useSpring(heroScrollProgress, { stiffness: 120, damping: 24 });
  const heroImageY = useTransform(smoothHeroScroll, [0, 1], [-10, 10]);
  const heroImageScale = useTransform(smoothHeroScroll, [0, 0.5, 1], [1.05, 1.02, 1.05]);

  const paidSessions = ONLINE_CONSULTATIONS.filter((c) => c.sessionType === 'paid');
  const freeSessions = ONLINE_CONSULTATIONS.filter((c) => c.sessionType === 'free');

  useEffect(() => {
    if (!activeRoom) {
      setSecondsElapsed(0);
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeRoom]);

  const openRoom = (consult: OnlineConsultation) => {
    setActiveRoom(consult);
    setMicEnabled(true);
    setCamEnabled(true);
    setSpeakerEnabled(true);
    setSecondsElapsed(0);
    setPreCallNotes(
      `Patient: ${patient.name} (${patient.age} yrs) · Preferred Language: ${patient.language}`
    );
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderConsultCard = (item: OnlineConsultation) => {
    const isPaid = item.sessionType === 'paid';
    return (
      <motion.div
        key={item.id}
        variants={staggerItemVariants}
        {...cardInteraction}
        className="bg-[#0E2340] border border-[#1E3F6D] rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-5 motion-gpu"
      >
        <div className="space-y-3">
          {/* Clean text kicker without pill boxes */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <span
              className={`font-semibold ${
                isPaid ? 'text-[#FF6B57]' : 'text-[#00B4A6]'
              }`}
            >
              {isPaid ? 'Paid Session' : 'Free Session'}
            </span>
            <span className="font-mono tabular-nums text-slate-300">
              Room {item.roomCode}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <img
              src={item.doctorPhoto}
              alt={item.doctorName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover object-top border border-[#23487A] bg-[#091A31] shrink-0 mt-0.5"
            />
            <div>
              <h3 className="font-display text-lg font-bold text-white leading-snug">
                {item.sessionTitle}
              </h3>
              <div className="text-sm text-slate-200 font-medium mt-1">
                {item.doctorName}{' '}
                <span className="text-slate-400 font-normal">· {item.specialty}</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{item.qualification}</div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{item.summaryNote}</p>

          <div className="pt-3 border-t border-[#1D3E6B] grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
            <div>
              <div className="text-slate-400">Session Fee</div>
              <div className="text-white font-semibold mt-0.5">
                {isPaid ? `₹${item.feeAmount}` : '₹0 (Free)'}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Queue Wait</div>
              <div className="text-[#00B4A6] font-semibold mt-0.5">
                ~{item.queueWaitMin} min
              </div>
            </div>
            <div>
              <div className="text-slate-400">Ahead</div>
              <div className="text-white font-semibold mt-0.5">
                {item.patientsAhead} waiting
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Languages: {item.languagesSpoken.join(' · ')}
          </div>
        </div>

        <motion.button
          type="button"
          onClick={() => openRoom(item)}
          {...buttonInteraction}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            isPaid
              ? 'bg-[#FF6B57] hover:bg-[#FF7F6D] text-[#08172B]'
              : 'bg-[#00B4A6] hover:bg-[#00C9BA] text-[#08172B]'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Join Live Consultation Room</span>
        </motion.button>
      </motion.div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Top Section Header + Full-Visibility Reference Photo */}
      <motion.section
        ref={heroSectionRef}
        aria-label="Online Consultations Section Overview"
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
              03 · Live Video &amp; Audio Consultancy Hub
            </motion.p>
            <motion.h1
              variants={textRevealVariants}
              className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5"
            >
              Online Consultations (Paid &amp; Free)
            </motion.h1>
            <motion.p
              variants={textRevealVariants}
              className="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed"
            >
              Join specialist video rooms with transparent session fees, or connect to zero-fee
              triage and follow-up desks immediately.
            </motion.p>
          </div>

          <motion.div
            variants={textRevealVariants}
            className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#1D3E6B] text-xs font-mono tabular-nums"
          >
            <span className="text-[#FF6B57]">{paidSessions.length} Paid Specialist Rooms</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-[#00B4A6]">{freeSessions.length} Free Community Rooms</span>
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
              src={sectionOnlineConsultImg}
              alt="Clinician conducting a live video consultation on medical monitor"
              referrerPolicy="no-referrer"
              className="w-full h-full max-h-[300px] lg:max-h-none object-cover object-center"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Section 1: Paid Consultations */}
      <motion.section
        variants={sectionRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#1D3E6B] pb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Consultations With Fee (Paid Specialist Rooms)
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              20-minute live specialist video review, lab interpretation, and digital prescription.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#FF6B57]">
            {paidSessions.length} Live Specialist Rooms
          </span>
        </div>

        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {paidSessions.map(renderConsultCard)}
        </motion.div>
      </motion.section>

      {/* Section 2: Free Consultations */}
      <motion.section
        variants={sectionRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#1D3E6B] pb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Consultations Without Fee (Free Triage & Follow-Up Rooms)
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Zero-fee clinician triage, fever guidance, and post-visit reaction check-ins.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#00B4A6]">
            {freeSessions.length} Free Community Rooms
          </span>
        </div>

        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {freeSessions.map(renderConsultCard)}
        </motion.div>
      </motion.section>

      {/* Interactive Live Consultation Room Modal */}
      <AnimatePresence>
        {activeRoom && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Live consultation room with ${activeRoom.doctorName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="fixed inset-0 z-50 bg-[#050E1B]/90 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
              className="w-full max-w-4xl bg-[#0B1F3A] border border-[#23487A] rounded-2xl overflow-hidden shadow-2xl motion-gpu"
            >
              {/* Room Top Bar */}
              <div className="bg-[#08172B] border-b border-[#1D3E6B] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span
                      className={
                        activeRoom.sessionType === 'paid' ? 'text-[#FF6B57]' : 'text-[#00B4A6]'
                      }
                    >
                      {activeRoom.sessionType === 'paid'
                        ? `Paid Session · ₹${activeRoom.feeAmount}`
                        : 'Free Session · ₹0'}
                    </span>
                    <span aria-hidden="true" className="text-slate-500">
                      ·
                    </span>
                    <span className="text-slate-300">Room {activeRoom.roomCode}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-white mt-0.5">
                    {activeRoom.doctorName} · {activeRoom.specialty}
                  </h2>
                </div>

                <div className="flex items-center gap-4 font-mono tabular-nums">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Users className="w-3.5 h-3.5 text-[#00B4A6]" />
                    <span>Queue: {activeRoom.patientsAhead} ahead</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0E2340] border border-[#1E3F6D] text-sm font-semibold text-[#00B4A6]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimer(secondsElapsed)}</span>
                  </div>
                </div>
              </div>

              {/* Room Body: Video Stage + Pre-Call Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Video / Audio Stage */}
                <div className="lg:col-span-7 p-6 bg-[#071528] flex flex-col justify-between min-h-[300px] border-b lg:border-b-0 lg:border-r border-[#1D3E6B]">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 text-[#00B4A6]">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Encrypted Clinical Room Active</span>
                    </span>
                    <span className="font-mono">HD Audio · Low Bandwidth Ready</span>
                  </div>

                  {/* Doctor Presence Avatar & Audio Bars */}
                  <div className="my-6 flex flex-col items-center justify-center text-center space-y-4">
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative"
                    >
                      <img
                        src={activeRoom.doctorPhoto}
                        alt={activeRoom.doctorName}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-full object-cover object-top border-2 border-[#00B4A6] bg-[#112A4C]"
                      />
                    </motion.div>
                    <div>
                      <div className="font-display text-base font-bold text-white">
                        {activeRoom.doctorName}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {activeRoom.patientsAhead === 0
                          ? 'Clinician connected and reviewing your chart'
                          : `Waiting room ready · Est. clinician join in ~${activeRoom.queueWaitMin} min`}
                      </div>
                    </div>

                    {/* Audio spectrum bars */}
                    <div className="flex items-end justify-center gap-1.5 h-8" aria-hidden="true">
                      {[14, 24, 18, 28, 16, 22, 12].map((h, idx) => (
                        <motion.span
                          key={idx}
                          animate={
                            micEnabled
                              ? { height: [h * 0.45, h, h * 0.6, h * 0.92, h * 0.5] }
                              : { height: 4 }
                          }
                          transition={
                            micEnabled
                              ? {
                                  duration: 1.15 + idx * 0.14,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }
                              : { duration: 0.2 }
                          }
                          className={`w-1.5 rounded-full transition-colors duration-200 ${
                            micEnabled ? 'bg-[#00B4A6]' : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Self Camera Preview Bar + Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#1D3E6B]">
                    <div className="text-xs text-slate-300">
                      Camera:{' '}
                      <span className="text-white font-medium">
                        {camEnabled ? 'Active (Encrypted Preview)' : 'Camera Muted'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setMicEnabled((m) => !m)}
                        className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          micEnabled
                            ? 'bg-[#112A4C] border-[#23487A] text-white hover:border-[#00B4A6]'
                            : 'bg-[#FF6B57]/20 border-[#FF6B57] text-[#FF6B57]'
                        }`}
                        aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                        title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                      >
                        {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setCamEnabled((c) => !c)}
                        className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          camEnabled
                            ? 'bg-[#112A4C] border-[#23487A] text-white hover:border-[#00B4A6]'
                            : 'bg-[#FF6B57]/20 border-[#FF6B57] text-[#FF6B57]'
                        }`}
                        aria-label={camEnabled ? 'Turn camera off' : 'Turn camera on'}
                        title={camEnabled ? 'Turn camera off' : 'Turn camera on'}
                      >
                        {camEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setSpeakerEnabled((s) => !s)}
                        className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          speakerEnabled
                            ? 'bg-[#112A4C] border-[#23487A] text-white hover:border-[#00B4A6]'
                            : 'bg-[#FF6B57]/20 border-[#FF6B57] text-[#FF6B57]'
                        }`}
                        aria-label={speakerEnabled ? 'Mute speaker' : 'Unmute speaker'}
                        title={speakerEnabled ? 'Mute speaker' : 'Unmute speaker'}
                      >
                        {speakerEnabled ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4" />
                        )}
                      </motion.button>

                      <motion.button
                        type="button"
                        {...buttonInteraction}
                        onClick={() => setActiveRoom(null)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#FF6B57] hover:bg-[#FF7F6D] text-[#08172B] font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <PhoneOff className="w-4 h-4" />
                        <span>End Consultation</span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Pre-Call Notes Column */}
                <div className="lg:col-span-5 p-6 bg-[#0B1F3A] flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="font-display text-sm font-bold text-white">
                      Pre-Call Symptoms & Notes
                    </h3>
                    <p className="text-xs text-slate-300">
                      Share symptoms, recent temperature/BP readings, or current medications directly
                      with {activeRoom.doctorName}.
                    </p>
                    <textarea
                      rows={6}
                      value={preCallNotes}
                      onChange={(e) => setPreCallNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#08172B] border border-[#23487A] text-xs text-white leading-relaxed focus:outline-none focus:border-[#00B4A6]"
                    />
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#0E2340] border border-[#1D3E6B] text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-white">Session Details</div>
                    <div>Mode: Encrypted Video & Audio</div>
                    <div>Expected Length: ~{activeRoom.avgSessionDurationMin} minutes</div>
                    <div>
                      Languages: {activeRoom.languagesSpoken.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
