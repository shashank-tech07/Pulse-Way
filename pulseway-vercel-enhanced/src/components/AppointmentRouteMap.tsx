import { useEffect, useRef, useState } from 'react';
import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  Map as GoogleMap,
  Pin,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Car, Clock, MapPin, Navigation, Route as RouteIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { LatLngPoint } from '../types';
import { EASE_OUT_EXPO, VIEWPORT_ONCE } from '../utils/motion';

type TravelModeOption = 'DRIVING' | 'TWO_WHEELER' | 'TRANSIT' | 'WALKING';

interface AppointmentRouteMapProps {
  origin: LatLngPoint;
  destination: LatLngPoint;
  clinicWing: string;
  doctorName: string;
  simulatedTrafficSpikeMin: number;
  baseTravelMin: number;
}

interface RouteSummary {
  distanceMeters: number;
  durationMillis: number;
}

const MAPS_API_KEY: string =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_API_KEY) ||
  '';

interface GooglePolylineInstance {
  setOptions: (options: {
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
  }) => void;
  setMap: (map: unknown) => void;
}

interface RouteComputeResult {
  routes?: Array<{
    createPolylines: () => GooglePolylineInstance[];
    viewport?: unknown;
    distanceMeters?: number;
    durationMillis?: number;
  }>;
}

function RoutePathLayer({
  origin,
  destination,
  travelMode,
  trafficActive,
  onRouteComputed,
  onRouteError,
}: {
  origin: LatLngPoint;
  destination: LatLngPoint;
  travelMode: TravelModeOption;
  trafficActive: boolean;
  onRouteComputed: (summary: RouteSummary | null) => void;
  onRouteError: (msg: string | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<GooglePolylineInstance[]>([]);

  useEffect(() => {
    if (!map || !routesLib) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onRouteError(null);

    let cancelled = false;

    const request = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    const RouteClass = (routesLib as unknown as {
      Route?: {
        computeRoutes: (req: unknown) => Promise<RouteComputeResult>;
      };
    }).Route;

    if (!RouteClass || typeof RouteClass.computeRoutes !== 'function') {
      onRouteError('Routes service unavailable in current SDK build.');
      return;
    }

    RouteClass.computeRoutes(request)
      .then((res) => {
        if (cancelled) return;
        const primaryRoute = res?.routes?.[0];
        if (!primaryRoute) {
          onRouteComputed(null);
          onRouteError('No drivable route found between these coordinates.');
          return;
        }

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((poly) => {
          poly.setOptions({
            strokeColor: trafficActive ? '#FF6B57' : '#00B4A6',
            strokeOpacity: 0.92,
            strokeWeight: 6,
          });
          poly.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          (map as unknown as { fitBounds: (bounds: unknown, padding?: number) => void }).fitBounds(
            primaryRoute.viewport,
            48
          );
        }

        onRouteComputed({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const errText = err instanceof Error ? err.message : String(err);
        if (
          errText.includes('RESOURCE_EXHAUSTED') ||
          errText.includes('OVER_QUERY_LIMIT') ||
          errText.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteError('Live route geometry unavailable; showing corridor estimate.');
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, origin.lat, origin.lng, destination.lat, destination.lng, travelMode, trafficActive, onRouteComputed, onRouteError]);

  return (
    <>
      <AdvancedMarker position={{ lat: origin.lat, lng: origin.lng }} title={origin.label}>
        <Pin background="#00B4A6" borderColor="#08172B" glyphColor="#08172B" />
      </AdvancedMarker>
      <AdvancedMarker position={{ lat: destination.lat, lng: destination.lng }} title={destination.label}>
        <Pin background="#FF6B57" borderColor="#08172B" glyphColor="#08172B" />
      </AdvancedMarker>
    </>
  );
}

function MapStatusMonitor({
  onStatusFailure,
}: {
  onStatusFailure: (failed: boolean) => void;
}) {
  const status = useApiLoadingStatus();

  useEffect(() => {
    if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
      onStatusFailure(true);
    } else if (status === APILoadingStatus.LOADED) {
      onStatusFailure(false);
    }
  }, [status, onStatusFailure]);

  return null;
}

export default function AppointmentRouteMap({
  origin,
  destination,
  clinicWing,
  doctorName,
  simulatedTrafficSpikeMin,
  baseTravelMin,
}: AppointmentRouteMapProps) {
  const [travelMode, setTravelMode] = useState<TravelModeOption>('DRIVING');
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [mapFailed, setMapFailed] = useState(false);

  const trafficActive = simulatedTrafficSpikeMin > 0;
  const effectiveTravelMin = baseTravelMin + simulatedTrafficSpikeMin;

  const displayDistanceKm = routeSummary
    ? (routeSummary.distanceMeters / 1000).toFixed(1)
    : '5.8';
  const displayMinutes = routeSummary
    ? Math.max(1, Math.round(routeSummary.durationMillis / 60000) + simulatedTrafficSpikeMin)
    : effectiveTravelMin;

  const canRenderGoogleMap = Boolean(MAPS_API_KEY) && !mapFailed;

  return (
    <div className="bg-[#091A31] border border-[#1D3E6B] rounded-xl overflow-hidden">
      {/* Route Header Bar */}
      <div className="px-5 py-4 border-b border-[#1D3E6B] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#00B4A6]">
            <RouteIcon className="w-3.5 h-3.5" />
            <span>Clinic Route & Transit Corridor · {clinicWing}</span>
          </div>
          <h3 className="font-display text-base font-bold text-white">
            {origin.label} → {destination.label}
          </h3>
          <p className="text-xs text-slate-300">
            Destination: {doctorName} · Estimated corridor transit{' '}
            <span className="font-mono tabular-nums font-semibold text-white">
              {displayDistanceKm} km ({displayMinutes} min)
            </span>
            {trafficActive && (
              <span className="text-[#FF6B57] font-semibold">
                {' '}
                · Includes +{simulatedTrafficSpikeMin}m traffic spike
              </span>
            )}
          </p>
        </div>

        {/* Travel Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0B1F3A] p-1 rounded-lg border border-[#1E3F6D] shrink-0">
          {(
            [
              { id: 'DRIVING', label: 'Car' },
              { id: 'TWO_WHEELER', label: 'Two-Wheeler' },
              { id: 'TRANSIT', label: 'Metro / Bus' },
              { id: 'WALKING', label: 'Walk' },
            ] as const
          ).map((mode) => (
            <motion.button
              key={mode.id}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTravelMode(mode.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                travelMode === mode.id
                  ? 'bg-[#00B4A6] text-[#08172B] font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {mode.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Map Viewport (Explicit height to prevent 0x0 collapse) */}
      <div className="relative w-full h-[320px] sm:h-[360px] bg-[#071528]">
        {canRenderGoogleMap ? (
          <APIProvider apiKey={MAPS_API_KEY} language="en" region="IN">
            <MapStatusMonitor onStatusFailure={setMapFailed} />
            <GoogleMap
              mapId="DEMO_MAP_ID"
              defaultCenter={{
                lat: (origin.lat + destination.lat) / 2,
                lng: (origin.lng + destination.lng) / 2,
              }}
              defaultZoom={13}
              gestureHandling="greedy"
              disableDefaultUI={false}
              streetViewControl={false}
              mapTypeControl={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <RoutePathLayer
                origin={origin}
                destination={destination}
                travelMode={travelMode}
                trafficActive={trafficActive}
                onRouteComputed={setRouteSummary}
                onRouteError={setRouteError}
              />
            </GoogleMap>
          </APIProvider>
        ) : (
          /* Stylized interactive corridor fallback when Maps key is not yet injected in preview runtime */
          <div className="w-full h-full flex flex-col justify-between p-5 sm:p-6 bg-[#08172B] relative overflow-hidden">
            <svg
              viewBox="0 0 800 300"
              className="absolute inset-0 w-full h-full opacity-85"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#16355E" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="300" fill="#08172B" />
              <rect width="800" height="300" fill="url(#mapgrid)" />
              {/* Arterial street geometry */}
              <path
                d="M 40 230 L 220 205 L 380 155 L 540 135 L 740 85"
                fill="none"
                stroke="#1A3E6F"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Active highlighted route */}
              <motion.path
                d="M 90 225 C 210 215, 290 175, 400 155 C 510 135, 610 110, 710 92"
                fill="none"
                stroke={trafficActive ? '#FF6B57' : '#00B4A6'}
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0.12, opacity: 0.5 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={VIEWPORT_ONCE}
                transition={{ duration: 1.05, ease: EASE_OUT_EXPO }}
              />
              {/* Origin Pin */}
              <circle cx="90" cy="225" r="10" fill="#00B4A6" stroke="#08172B" strokeWidth="3" />
              {/* Destination Pin + Subtle Beacon Pulse */}
              <motion.circle
                cx="710"
                cy="92"
                r="14"
                fill="none"
                stroke="#FF6B57"
                strokeWidth="2"
                animate={{ r: [11, 20, 11], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <circle cx="710" cy="92" r="11" fill="#FF6B57" stroke="#08172B" strokeWidth="3" />
            </svg>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
              <div className="bg-[#0B1F3A]/95 border border-[#1E3F6D] rounded-lg px-3.5 py-2 text-xs">
                <span className="text-[#00B4A6] font-mono font-semibold">Origin</span>
                <span className="text-slate-300 ml-2">{origin.label}</span>
              </div>
              <div className="bg-[#0B1F3A]/95 border border-[#1E3F6D] rounded-lg px-3.5 py-2 text-xs">
                <span className="text-[#FF6B57] font-mono font-semibold">Clinic Wing</span>
                <span className="text-slate-300 ml-2">{destination.label}</span>
              </div>
            </div>

            <div className="relative z-10 bg-[#0B1F3A]/95 border border-[#1E3F6D] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <Navigation className="w-4 h-4 text-[#00B4A6]" />
                <span>
                  Corridor via Residency Rd & Richmond Cir ·{' '}
                  <span className="font-mono tabular-nums text-white font-semibold">
                    {displayDistanceKm} km
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono tabular-nums">
                <span className="flex items-center gap-1 text-slate-300">
                  <Car className="w-3.5 h-3.5 text-[#00B4A6]" />
                  <span>{travelMode}</span>
                </span>
                <span
                  className={`flex items-center gap-1 font-semibold ${
                    trafficActive ? 'text-[#FF6B57]' : 'text-[#00B4A6]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{displayMinutes} min</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {routeError && canRenderGoogleMap && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-[#08172B]/95 border border-[#FF6B57]/60 rounded-lg px-3.5 py-2 text-xs text-slate-200 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#FF6B57] shrink-0" />
            <span>{routeError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
