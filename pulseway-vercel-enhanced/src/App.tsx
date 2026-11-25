import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import AppointmentsTab from './components/AppointmentsTab';
import BookClinicTab from './components/BookClinicTab';
import HospitalsNearMeTab from './components/HospitalsNearMeTab';
import LoginScreen from './components/LoginScreen';
import OnlineConsultationsTab from './components/OnlineConsultationsTab';
import TopNavBar from './components/TopNavBar';
import { INITIAL_APPOINTMENTS } from './data/mockData';
import { ActiveTab, Appointment, PatientProfile } from './types';
import { EASE_OUT_EXPO, pageTabVariants } from './utils/motion';

export default function App() {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    INITIAL_APPOINTMENTS[0].id
  );
  const [newlyBookedId, setNewlyBookedId] = useState<string | null>(null);
  const [simDoctorDelay, setSimDoctorDelay] = useState<number>(0);
  const [simTrafficSpike, setSimTrafficSpike] = useState<number>(0);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setMapsQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  const handleLogin = (profile: PatientProfile) => {
    setPatient(profile);
    setAppointments((prev) =>
      prev.map((apt) => ({
        ...apt,
        patientName: profile.name,
        patientAge: profile.age,
        patientPhone: profile.contact,
      }))
    );
    setActiveTab('appointments');
  };

  const handleSignOut = () => {
    setPatient(null);
    setSimDoctorDelay(0);
    setSimTrafficSpike(0);
    setNewlyBookedId(null);
  };

  const handleBookAppointment = (newAppointment: Appointment) => {
    setAppointments((prev) => [newAppointment, ...prev]);
    setSelectedAppointmentId(newAppointment.id);
    setNewlyBookedId(newAppointment.id);
    setSimDoctorDelay(0);
    setSimTrafficSpike(0);
    setActiveTab('appointments');
  };

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {!patient ? (
          <motion.div
            key="login-gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
          >
            <LoginScreen onLogin={handleLogin} />
          </motion.div>
        ) : (
          <motion.div
            key="patient-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36, ease: EASE_OUT_EXPO }}
            className="min-h-screen bg-[#0B1F3A] text-white flex flex-col"
          >
            <AnimatePresence>
              {mapsQuotaExceeded && (
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                  className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm"
                >
                  <span>
                    Google Maps Platform quota reached. If you are the app owner, visit{' '}
                    <a
                      href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-amber-950 hover:text-amber-800"
                    >
                      maps developer site
                    </a>{' '}
                    for instructions to update your account.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <TopNavBar
              patient={patient}
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                if (tab !== 'appointments') {
                  setNewlyBookedId(null);
                }
              }}
              appointmentCount={appointments.length}
              onSignOut={handleSignOut}
            />

            {/* Main Content Workspace */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={pageTabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="motion-gpu"
                >
                  {activeTab === 'appointments' && (
                    <AppointmentsTab
                      appointments={appointments}
                      selectedAppointmentId={selectedAppointmentId}
                      onSelectAppointment={(id) => {
                        setSelectedAppointmentId(id);
                        setNewlyBookedId(null);
                      }}
                      newlyBookedId={newlyBookedId}
                      patientLanguage={patient.language}
                      simDoctorDelay={simDoctorDelay}
                      simTrafficSpike={simTrafficSpike}
                      onChangeSimDoctorDelay={setSimDoctorDelay}
                      onChangeSimTrafficSpike={setSimTrafficSpike}
                      onGoToBookTab={() => setActiveTab('book')}
                    />
                  )}

                  {activeTab === 'book' && (
                    <BookClinicTab patient={patient} onBookAppointment={handleBookAppointment} />
                  )}

                  {activeTab === 'online' && <OnlineConsultationsTab patient={patient} />}

                  {activeTab === 'hospitals' && <HospitalsNearMeTab />}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
