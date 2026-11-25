import { Activity, LogOut } from 'lucide-react';
import { LayoutGroup, motion } from 'motion/react';
import { ActiveTab, PatientProfile } from '../types';
import { SPRING_SNAPPY, TRANSITION_BASE, buttonInteraction } from '../utils/motion';

interface TopNavBarProps {
  patient: PatientProfile;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  appointmentCount: number;
  onSignOut: () => void;
}

export default function TopNavBar({
  patient,
  activeTab,
  onSelectTab,
  appointmentCount,
  onSignOut,
}: TopNavBarProps) {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'appointments', label: `Appointments (${appointmentCount})` },
    { id: 'book', label: 'Book Clinic' },
    { id: 'online', label: 'Online Consultations' },
    { id: 'hospitals', label: 'Hospitals Near Me' },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION_BASE}
      className="w-full bg-[#08172B] border-b border-[#1C3B66] px-4 sm:px-8 py-3.5"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <div className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
          <span>PulseWay</span>
          <motion.span
            role="img"
            aria-label="pulse heart"
            className="text-lg leading-none inline-block"
            animate={{ scale: [1, 1.12, 1, 1.07, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            💓
          </motion.span>
        </div>

        {/* Zone 2: Clean Single-Line Tab Links */}
        <LayoutGroup id="top-nav-tabs">
          <nav
            aria-label="Primary workspace navigation"
            className="flex items-center gap-5 sm:gap-7 overflow-x-auto"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00B4A6] ${
                    isActive ? 'text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="top-nav-active-indicator"
                      transition={SPRING_SNAPPY}
                      className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-[#00B4A6]"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </LayoutGroup>

        {/* Zone 3: Patient Context + Clinic Live Status + Sign Out */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap">
            <motion.span
              className="inline-flex"
              animate={{ opacity: [0.65, 1, 0.65], scale: [0.95, 1.06, 0.95] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Activity className="w-3.5 h-3.5 text-[#00B4A6]" />
            </motion.span>
            <span className="text-[#00B4A6] font-medium">Clinic Live</span>
            <span aria-hidden="true">·</span>
            <span className="text-white font-medium">{patient.name}</span>
            <span aria-hidden="true">·</span>
            <span>{patient.language}</span>
          </div>

          <motion.button
            type="button"
            onClick={onSignOut}
            {...buttonInteraction}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#112A4C] hover:bg-[#173763] border border-[#23487A] text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B4A6]"
          >
            <LogOut className="w-3.5 h-3.5 text-[#FF6B57]" />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
