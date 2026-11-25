import { useRef, useState, FormEvent } from 'react';
import { ArrowRight, Globe, KeyRound, ShieldCheck, Stethoscope, UserCheck } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import heroPulsewayArrivalImg from '../assets/images/hero_pulseway_arrival_1795614192647.jpg';
import { DOCTORS, LANGUAGES } from '../data/mockData';
import { Language, PatientProfile } from '../types';
import {
  EASE_OUT_EXPO,
  VIEWPORT_ONCE,
  buttonInteraction,
  disclosureVariants,
  imageRevealVariants,
  sectionRevealVariants,
  staggerContainerVariants,
  staggerItemVariants,
  textRevealVariants,
} from '../utils/motion';

interface LoginScreenProps {
  onLogin: (profile: PatientProfile) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [age, setAge] = useState('32');
  const [language, setLanguage] = useState<Language>('English');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpCode, setOtpCode] = useState('4829');
  const [errorMsg, setErrorMsg] = useState('');
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const heroFrameRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroFrameRef,
    offset: ['start end', 'end start'],
  });
  const smoothHeroScroll = useSpring(heroScrollProgress, { stiffness: 120, damping: 24 });
  const heroParallaxY = useTransform(smoothHeroScroll, [0, 1], [-12, 12]);
  const heroParallaxScale = useTransform(smoothHeroScroll, [0, 0.5, 1], [1.04, 1.02, 1.05]);

  const featuredDoctors = DOCTORS.slice(0, 4);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name to load your patient workspace.');
      return;
    }
    if (!contact.trim()) {
      setErrorMsg('Please enter your email or mobile number.');
      return;
    }
    if (otpRequested && otpCode.trim().length < 4) {
      setErrorMsg('Please enter the 4-digit verification code.');
      return;
    }
    setErrorMsg('');
    onLogin({
      name: name.trim(),
      contact: contact.trim(),
      age: Math.max(1, Math.min(115, parseInt(age, 10) || 32)),
      language,
    });
  };

  const handleDemoLogin = () => {
    onLogin({
      name: 'Ananya Rao',
      contact: '+91 98450 21490',
      age: 34,
      language: 'Kannada',
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1F3A] text-white flex flex-col lg:flex-row">
      {/* Left Hero & Clinical Arrival Showcase Column */}
      <div className="w-full lg:w-[57%] bg-gradient-to-br from-[#08172B] via-[#0B1F3A] to-[#0E294D] p-6 sm:p-10 lg:p-12 flex flex-col justify-between gap-7 border-b lg:border-b-0 lg:border-r border-[#1C3B66]">
        {/* Top Brand Row */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: EASE_OUT_EXPO }}
          className="flex flex-wrap items-baseline justify-between gap-4"
        >
          <div className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap">
            <span>PulseWay</span>
            <motion.span
              role="img"
              aria-label="pulse heart"
              className="text-xl leading-none inline-block"
              animate={{ scale: [1, 1.12, 1, 1.07, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              💓
            </motion.span>
          </div>
          <div className="text-xs text-slate-300 font-mono flex items-center gap-2">
            <span className="text-[#00B4A6]">Clinic Queue</span>
            <span aria-hidden="true">·</span>
            <span>Video Consults</span>
            <span aria-hidden="true">·</span>
            <span>Nearby Hospitals</span>
          </div>
        </motion.div>

        {/* Center Editorial Headline + Unobstructed Hero Photo */}
        <div className="space-y-6 my-auto">
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3 max-w-2xl"
          >
            <motion.h1
              variants={textRevealVariants}
              className="font-display text-3xl sm:text-4xl xl:text-[2.6rem] font-bold tracking-tight text-white leading-[1.14] [text-wrap:balance]"
            >
              Know your exact arrival window before leaving home.
            </motion.h1>
            <motion.p
              variants={textRevealVariants}
              className="text-sm sm:text-[15px] text-slate-300 leading-relaxed max-w-xl"
            >
              PulseWay calculates live clinic delays, consultation pace, road traffic, and nearby
              hospital availability in one calm timeline—so you walk straight into care on time.
            </motion.p>
          </motion.div>

          {/* Primary Clinical Photography Frame */}
          <motion.div
            ref={heroFrameRef}
            variants={sectionRevealVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.65, delay: 0.14, ease: EASE_OUT_EXPO }}
            className="rounded-2xl overflow-hidden border border-[#23487A] bg-[#08172B] shadow-2xl motion-gpu"
          >
            {!heroImgFailed ? (
              <div className="relative w-full aspect-[4/3] max-h-[410px] overflow-hidden bg-[#08172B]">
                <motion.div
                  style={{ y: heroParallaxY, scale: heroParallaxScale }}
                  className="w-full h-full motion-gpu"
                >
                  <motion.img
                    variants={imageRevealVariants}
                    initial="hidden"
                    animate="visible"
                    src={heroPulsewayArrivalImg}
                    alt="Smiling specialist greeting an arriving patient inside a sunlit modern PulseWay outpatient clinic lobby"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover object-center"
                  />
                </motion.div>
              </div>
            ) : (
              <div className="w-full aspect-[4/3] max-h-[410px] bg-gradient-to-br from-[#0D2545] to-[#08172B] flex flex-col items-center justify-center p-8 text-center gap-3">
                <Stethoscope className="w-10 h-10 text-[#00B4A6]" />
                <div className="font-display text-lg font-semibold text-white">
                  PulseWay Outpatient Arrival &amp; Queue Desk
                </div>
                <p className="text-xs text-slate-300 max-w-sm">
                  Coordinated specialist scheduling, live departure alerts, and hospital navigation.
                </p>
              </div>
            )}

            {/* Integrated Specialist Trust Footer Bar */}
            <div className="px-5 py-3.5 bg-[#08172B] border-t border-[#1C3B66] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5 shrink-0">
                  {featuredDoctors.map((doc, idx) => (
                    <motion.img
                      key={doc.id}
                      src={doc.photoUrl}
                      alt={doc.name}
                      referrerPolicy="no-referrer"
                      initial={{ opacity: 0, x: -6, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.38, delay: 0.28 + idx * 0.06, ease: EASE_OUT_EXPO }}
                      whileHover={{ y: -3, scale: 1.1, zIndex: 10 }}
                      className="w-8 h-8 rounded-full object-cover object-top ring-2 ring-[#08172B] bg-[#13325C] relative"
                    />
                  ))}
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  12 Verified Specialists <span className="text-slate-400">· 5 Departments</span>
                </div>
              </div>
              <div className="text-xs font-mono tabular-nums text-[#00B4A6]">
                Real-Time Queue &amp; Route Sync
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom 3-Column Capability Summary */}
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-5 border-t border-[#1C3B66]"
        >
          <motion.div variants={staggerItemVariants} whileHover={{ y: -2 }}>
            <div className="text-xs font-mono text-[#00B4A6]">01. Arrival Buffer Guard</div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Decreasing countdown timers combining wing drift, travel, and check-in buffers.
            </p>
          </motion.div>
          <motion.div variants={staggerItemVariants} whileHover={{ y: -2 }}>
            <div className="text-xs font-mono text-[#00B4A6]">02. Clinic &amp; Telehealth</div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Book in-person clinic tokens or join instant video triage and specialist rooms.
            </p>
          </motion.div>
          <motion.div variants={staggerItemVariants} whileHover={{ y: -2 }}>
            <div className="text-xs font-mono text-[#FF6B57]">03. Hospitals Near You</div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Locate nearby hospitals with live driving distance, ETA, and open-now details.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Sign-In Gate Column */}
      <div className="w-full lg:w-[43%] flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-[#091A31]">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.975 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.58, delay: 0.1, ease: EASE_OUT_EXPO }}
          style={{ transformPerspective: 1000 }}
          className="w-full max-w-md bg-[#0D2340] border border-[#1E3F6D] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 motion-gpu"
        >
          <div>
            <p className="text-xs font-mono text-[#00B4A6] tracking-wide">
              Patient Entry Gate
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1.5 tracking-tight">
              Sign in to PulseWay
            </h2>
            <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
              Access your booked visits, decreasing arrival timers, alert language, and nearby hospitals.
            </p>
          </div>

          {/* One-Click Demo Patient Sign-In */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
            className="bg-[#112C50] border border-[#00B4A6]/45 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="text-sm font-semibold text-white">
                Instant Demo Access
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Ananya Rao · Kannada alerts · 2 active visits
              </div>
            </div>
            <motion.button
              type="button"
              onClick={handleDemoLogin}
              {...buttonInteraction}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#00B4A6] text-[#08172B] font-semibold text-xs hover:bg-[#00C9BA] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B4A6]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Demo Patient Sign-In</span>
            </motion.button>
          </motion.div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-[#1C3B66]" />
            <span>or enter patient details</span>
            <div className="h-px flex-1 bg-[#1C3B66]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="patient-name" className="block text-xs font-medium text-slate-200 mb-1.5">
                Patient Full Name
              </label>
              <input
                id="patient-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Siddharth Menon"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1F3A] border border-[#23487A] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00B4A6] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="patient-contact" className="block text-xs font-medium text-slate-200 mb-1.5">
                  Email or Phone Number
                </label>
                <input
                  id="patient-contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+91 98450 21490"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1F3A] border border-[#23487A] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00B4A6] transition-colors"
                />
              </div>
              <div>
                <label htmlFor="patient-age" className="block text-xs font-medium text-slate-200 mb-1.5">
                  Age
                </label>
                <input
                  id="patient-age"
                  type="number"
                  min={1}
                  max={115}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1F3A] border border-[#23487A] text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#00B4A6] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#00B4A6]" />
                  <span>Preferred Alert Language</span>
                </label>
                <span className="text-xs text-slate-400">Used for delay updates</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LANGUAGES.map((lang) => {
                  const active = language === lang;
                  return (
                    <motion.button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#00B4A6]/18 border-[#00B4A6] text-white'
                          : 'bg-[#0B1F3A] border-[#1F406D] text-slate-300 hover:border-[#34619E]'
                      }`}
                    >
                      {lang}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Optional OTP step */}
            <div className="pt-1">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOtpRequested((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#00B4A6] hover:text-[#2CE0D1] transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{otpRequested ? 'Hide OTP verification' : 'Verify with 4-digit OTP code'}</span>
                </button>
                {otpRequested && (
                  <span className="text-xs text-slate-400 font-mono">Sample OTP: 4829</span>
                )}
              </div>

              <AnimatePresence initial={false}>
                {otpRequested && (
                  <motion.div
                    variants={disclosureVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="mt-2.5">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter 4-digit OTP"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1F3A] border border-[#23487A] text-sm font-mono tracking-widest text-white focus:outline-none focus:border-[#00B4A6]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  variants={disclosureVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-lg bg-[#FF6B57]/15 border border-[#FF6B57]/50 text-xs text-[#FFB3A8]">
                    {errorMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              {...buttonInteraction}
              className="w-full py-3 px-5 rounded-lg bg-[#FF6B57] hover:bg-[#FF7F6D] text-[#08172B] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B57]"
            >
              <span>Enter Patient Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#00B4A6] shrink-0" />
            <span>Encrypted patient session · Automated departure &amp; queue alerts</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
