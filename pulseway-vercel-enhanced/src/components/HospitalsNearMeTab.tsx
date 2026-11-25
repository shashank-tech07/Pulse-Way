import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
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
import {
  Building2,
  Clock,
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Star,
} from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import sectionHospitalsNearbyImg from '../assets/images/section_hospitals_nearby.jpg';
import { DEFAULT_PATIENT_ORIGIN } from '../data/mockData';
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

const MAPS_API_KEY: string =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_API_KEY) ||
  '';

interface LatLngCoords {
  lat: number;
  lng: number;
}

interface NearbyHospitalItem {
  id: string;
  name: string;
  address: string;
  location: LatLngCoords;
  rating?: number;
  ratingCount?: number;
  businessStatus?: string;
  distanceKm: number;
}

interface RouteMetrics {
  distanceMeters: number;
  durationMillis: number;
}

interface GoogleLatLngLike {
  lat: number | (() => number);
  lng: number | (() => number);
}

interface PlaceSDKResult {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: GoogleLatLngLike | null;
  rating?: number | null;
  userRatingCount?: number | null;
  businessStatus?: string | null;
}

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

function extractCoords(loc: GoogleLatLngLike | null | undefined): LatLngCoords | null {
  if (!loc) return null;
  const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
  const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return { lat, lng };
}

function computeDistanceKm(a: LatLngCoords, b: LatLngCoords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function isQuotaErrorText(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err);
  return (
    text.includes('RESOURCE_EXHAUSTED') ||
    text.includes('OVER_QUERY_LIMIT') ||
    text.includes('QuotaExceededError') ||
    text.includes('429')
  );
}

function MapStatusWatcher({ onFailure }: { onFailure: (failed: boolean) => void }) {
  const status = useApiLoadingStatus();
  useEffect(() => {
    if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
      onFailure(true);
    } else if (status === APILoadingStatus.LOADED) {
      onFailure(false);
    }
  }, [status, onFailure]);
  return null;
}

function NearbyHospitalsController({
  searchCenter,
  radiusMeters,
  rankPreference,
  textQuery,
  searchNonce,
  selectedHospital,
  onHospitalsLoaded,
  onLoadingChange,
  onErrorChange,
  onRouteMetricsChange,
  onViewportCenterChange,
}: {
  searchCenter: LatLngCoords;
  radiusMeters: number;
  rankPreference: 'DISTANCE' | 'POPULARITY';
  textQuery: string;
  searchNonce: number;
  selectedHospital: NearbyHospitalItem | null;
  onHospitalsLoaded: (items: NearbyHospitalItem[]) => void;
  onLoadingChange: (loading: boolean) => void;
  onErrorChange: (msg: string | null) => void;
  onRouteMetricsChange: (metrics: RouteMetrics | null) => void;
  onViewportCenterChange: (coords: LatLngCoords) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const coreLib = useMapsLibrary('core');
  const polylinesRef = useRef<GooglePolylineInstance[]>([]);

  // Track visible map center for "Search This Area"
  useEffect(() => {
    if (!map) return;
    const gMap = map as unknown as {
      addListener: (eventName: string, handler: () => void) => { remove: () => void };
      getCenter: () => GoogleLatLngLike | undefined;
    };
    const listener = gMap.addListener('idle', () => {
      const center = extractCoords(gMap.getCenter());
      if (center) {
        onViewportCenterChange(center);
      }
    });
    return () => listener.remove();
  }, [map, onViewportCenterChange]);

  // Recenter map when searchCenter updates explicitly
  useEffect(() => {
    if (!map) return;
    (map as unknown as { panTo: (coords: LatLngCoords) => void }).panTo(searchCenter);
  }, [map, searchCenter]);

  // Execute Google Maps Platform Places API (New) searchNearby / searchByText
  useEffect(() => {
    if (!placesLib || !map) return;

    let cancelled = false;
    onLoadingChange(true);
    onErrorChange(null);

    const PlacesNamespace = placesLib as unknown as {
      Place?: {
        searchNearby: (req: unknown) => Promise<{ places?: PlaceSDKResult[] }>;
        searchByText: (req: unknown) => Promise<{ places?: PlaceSDKResult[] }>;
      };
      SearchNearbyRankPreference?: {
        DISTANCE: string;
        POPULARITY: string;
      };
    };

    const PlaceClass = PlacesNamespace.Place;
    if (!PlaceClass) {
      onLoadingChange(false);
      onErrorChange('Places library unavailable in current Maps SDK session.');
      return;
    }

    const trimmedQuery = textQuery.trim();
    const fields = [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'rating',
      'userRatingCount',
      'businessStatus',
    ];

    const searchPromise = trimmedQuery
      ? PlaceClass.searchByText({
          textQuery: `${trimmedQuery} hospital`,
          fields,
          includedType: 'hospital',
          locationBias: {
            center: searchCenter,
            radius: radiusMeters,
          },
          maxResultCount: 12,
          language: 'en',
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        })
      : PlaceClass.searchNearby({
          fields,
          locationRestriction: {
            center: searchCenter,
            radius: radiusMeters,
          },
          includedPrimaryTypes: ['hospital'],
          maxResultCount: 12,
          rankPreference:
            rankPreference === 'DISTANCE'
              ? PlacesNamespace.SearchNearbyRankPreference?.DISTANCE ?? 'DISTANCE'
              : PlacesNamespace.SearchNearbyRankPreference?.POPULARITY ?? 'POPULARITY',
          language: 'en',
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        });

    searchPromise
      .then((res) => {
        if (cancelled) return;
        const rawPlaces = res?.places ?? [];
        const normalized: NearbyHospitalItem[] = [];

        for (let i = 0; i < rawPlaces.length; i++) {
          const p = rawPlaces[i];
          const coords = extractCoords(p.location);
          if (!coords) continue;
          normalized.push({
            id: p.id || `hospital-${i}`,
            name: p.displayName || 'Hospital',
            address: p.formattedAddress || 'Address available on map pin',
            location: coords,
            rating: typeof p.rating === 'number' ? p.rating : undefined,
            ratingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : undefined,
            businessStatus: p.businessStatus || undefined,
            distanceKm: computeDistanceKm(searchCenter, coords),
          });
        }

        if (rankPreference === 'DISTANCE') {
          normalized.sort((a, b) => a.distanceKm - b.distanceKm);
        }

        onHospitalsLoaded(normalized);

        if (normalized.length > 0 && coreLib) {
          const LatLngBoundsClass = (coreLib as unknown as {
            LatLngBounds?: new () => {
              extend: (pt: LatLngCoords) => void;
            };
          }).LatLngBounds;
          if (LatLngBoundsClass) {
            const bounds = new LatLngBoundsClass();
            bounds.extend(searchCenter);
            normalized.forEach((h) => bounds.extend(h.location));
            (map as unknown as { fitBounds: (b: unknown, padding?: number) => void }).fitBounds(
              bounds,
              52
            );
          }
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isQuotaErrorText(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onHospitalsLoaded([]);
        onErrorChange('Unable to load nearby hospitals right now. Please check your Maps API status.');
      })
      .finally(() => {
        if (!cancelled) {
          onLoadingChange(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    placesLib,
    coreLib,
    map,
    searchCenter,
    radiusMeters,
    rankPreference,
    textQuery,
    searchNonce,
    onHospitalsLoaded,
    onLoadingChange,
    onErrorChange,
  ]);

  // Compute driving route to the selected nearby hospital using Routes API (Route.computeRoutes)
  useEffect(() => {
    polylinesRef.current.forEach((poly) => poly.setMap(null));
    polylinesRef.current = [];
    onRouteMetricsChange(null);

    if (!map || !routesLib || !selectedHospital) return;

    let cancelled = false;

    const RouteClass = (routesLib as unknown as {
      Route?: {
        computeRoutes: (req: unknown) => Promise<RouteComputeResult>;
      };
    }).Route;

    if (!RouteClass || typeof RouteClass.computeRoutes !== 'function') return;

    RouteClass.computeRoutes({
      origin: searchCenter,
      destination: selectedHospital.location,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    })
      .then((res) => {
        if (cancelled) return;
        const primaryRoute = res?.routes?.[0];
        if (!primaryRoute) return;

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((poly) => {
          poly.setOptions({
            strokeColor: '#FF6B57',
            strokeOpacity: 0.92,
            strokeWeight: 6,
          });
          poly.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          (map as unknown as { fitBounds: (b: unknown, padding?: number) => void }).fitBounds(
            primaryRoute.viewport,
            56
          );
        }

        onRouteMetricsChange({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isQuotaErrorText(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((poly) => poly.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, searchCenter, selectedHospital, onRouteMetricsChange]);

  return null;
}

export default function HospitalsNearMeTab() {
  const [searchCenter, setSearchCenter] = useState<LatLngCoords>({
    lat: DEFAULT_PATIENT_ORIGIN.lat,
    lng: DEFAULT_PATIENT_ORIGIN.lng,
  });
  const [centerLabel, setCenterLabel] = useState<string>(DEFAULT_PATIENT_ORIGIN.label);
  const [viewportCenter, setViewportCenter] = useState<LatLngCoords | null>(null);
  const [radiusMeters, setRadiusMeters] = useState<number>(5000);
  const [rankPreference, setRankPreference] = useState<'DISTANCE' | 'POPULARITY'>('DISTANCE');
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeTextQuery, setActiveTextQuery] = useState<string>('');
  const [searchNonce, setSearchNonce] = useState<number>(0);

  const [hospitals, setHospitals] = useState<NearbyHospitalItem[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);

  const [loadingPlaces, setLoadingPlaces] = useState<boolean>(false);
  const [locatingGps, setLocatingGps] = useState<boolean>(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [mapFailed, setMapFailed] = useState<boolean>(false);

  const heroSectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroSectionRef,
    offset: ['start end', 'end start'],
  });
  const smoothHeroScroll = useSpring(heroScrollProgress, { stiffness: 120, damping: 24 });
  const heroImageY = useTransform(smoothHeroScroll, [0, 1], [-10, 10]);
  const heroImageScale = useTransform(smoothHeroScroll, [0, 0.5, 1], [1.05, 1.02, 1.05]);

  const handleHospitalsLoaded = useCallback((items: NearbyHospitalItem[]) => {
    setHospitals(items);
    setSelectedHospitalId((prev) => {
      if (prev && items.some((h) => h.id === prev)) return prev;
      return items[0]?.id ?? null;
    });
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsNotice('Browser geolocation is unavailable in this environment.');
      return;
    }
    setLocatingGps(true);
    setGpsNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setSearchCenter(nextCoords);
        setCenterLabel(
          `Your Live GPS (${nextCoords.lat.toFixed(4)}, ${nextCoords.lng.toFixed(4)})`
        );
        setActiveTextQuery('');
        setSearchInput('');
        setSearchNonce((n) => n + 1);
        setLocatingGps(false);
      },
      (err) => {
        setLocatingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsNotice(
            'Location permission was denied. Enable browser location access or search an area below.'
          );
        } else {
          setGpsNotice('Could not read GPS coordinates right now; showing active map center.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  const handleSearchAreaSubmit = (e: FormEvent) => {
    e.preventDefault();
    setActiveTextQuery(searchInput.trim());
    setSearchNonce((n) => n + 1);
  };

  const handleSearchVisibleArea = () => {
    if (!viewportCenter) return;
    setSearchCenter(viewportCenter);
    setCenterLabel(
      `Map Area (${viewportCenter.lat.toFixed(4)}, ${viewportCenter.lng.toFixed(4)})`
    );
    setActiveTextQuery('');
    setSearchNonce((n) => n + 1);
  };

  const selectedHospital =
    hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0] || null;
  const canUseGoogleMaps = Boolean(MAPS_API_KEY) && !mapFailed;

  return (
    <div className="space-y-8">
      {/* Top Section Header + Reference Photo */}
      <motion.section
        ref={heroSectionRef}
        aria-label="Hospitals Near Me Section Overview"
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
              04 · Live Proximity &amp; Emergency Discovery
            </motion.p>
            <motion.h1
              variants={textRevealVariants}
              className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5"
            >
              Hospitals Near Me
            </motion.h1>
            <motion.p
              variants={textRevealVariants}
              className="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed"
            >
              Quickly locate nearby hospitals around your live GPS location or any neighborhood,
              inspect distance and ratings, and preview live driving routes on the map.
            </motion.p>
          </div>

          <motion.div
            variants={textRevealVariants}
            className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#1D3E6B]"
          >
            <motion.button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locatingGps}
              {...buttonInteraction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00B4A6] hover:bg-[#00C9BA] disabled:opacity-60 text-[#08172B] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {locatingGps ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
              <span>{locatingGps ? 'Detecting GPS...' : 'Use My Current Location'}</span>
            </motion.button>

            <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF6B57]" />
              <span>{centerLabel}</span>
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
              src={sectionHospitalsNearbyImg}
              alt="Hospital campus exterior and patient drop-off entrance"
              referrerPolicy="no-referrer"
              className="w-full h-full max-h-[300px] lg:max-h-none object-cover object-center"
            />
          </motion.div>
        </div>
      </motion.section>

      <AnimatePresence>
        {gpsNotice && (
          <motion.div
            variants={disclosureVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-[#FF6B57]/12 border border-[#FF6B57]/60 px-4 py-3 text-xs sm:text-sm text-slate-100">
              {gpsNotice}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Controls Bar */}
      <motion.div
        variants={sectionRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="bg-[#0E2340] border border-[#1E3F6D] rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <form onSubmit={handleSearchAreaSubmit} className="flex flex-1 gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search hospital name, locality, or city (e.g. Koramangala, MG Road)..."
              aria-label="Search nearby hospitals or neighborhood"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#091A31] border border-[#23487A] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00B4A6]"
            />
          </div>
          <motion.button
            type="submit"
            {...buttonInteraction}
            className="px-4 py-2.5 rounded-lg bg-[#FF6B57] hover:bg-[#FF7F6D] text-[#08172B] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Find Hospitals
          </motion.button>
          {activeTextQuery && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setSearchInput('');
                setActiveTextQuery('');
                setSearchNonce((n) => n + 1);
              }}
              className="px-3 py-2.5 rounded-lg bg-[#091A31] border border-[#23487A] text-xs text-slate-200 hover:border-[#00B4A6] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Clear
            </motion.button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Radius Filter */}
          <div className="flex items-center gap-1 bg-[#091A31] p-1 rounded-lg border border-[#1D3E6B]">
            {[
              { label: '2 km', val: 2000 },
              { label: '5 km', val: 5000 },
              { label: '10 km', val: 10000 },
            ].map((opt) => (
              <motion.button
                key={opt.val}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setRadiusMeters(opt.val);
                  setActiveTextQuery('');
                }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-mono tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                  radiusMeters === opt.val && !activeTextQuery
                    ? 'bg-[#00B4A6] text-[#08172B] font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>

          {/* Sort Preference */}
          <div className="flex items-center gap-1 bg-[#091A31] p-1 rounded-lg border border-[#1D3E6B]">
            {[
              { id: 'DISTANCE' as const, label: 'Nearest' },
              { id: 'POPULARITY' as const, label: 'Top Rated' },
            ].map((opt) => (
              <motion.button
                key={opt.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setRankPreference(opt.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  rankPreference === opt.id
                    ? 'bg-[#173763] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Split: Nearby Hospital List + Interactive Google Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Live Nearby Hospitals List */}
        <motion.section
          aria-label="Nearby Hospitals Directory"
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="lg:col-span-5 bg-[#0E2340] border border-[#1E3F6D] rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#1D3E6B] pb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#00B4A6]" />
                <span>Nearby Hospitals</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeTextQuery
                  ? `Search: "${activeTextQuery}"`
                  : `Within ${(radiusMeters / 1000).toFixed(0)} km of active pin`}
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs text-[#00B4A6]">
              {loadingPlaces ? 'Searching...' : `${hospitals.length} Found`}
            </span>
          </div>

          {!canUseGoogleMaps ? (
            <div className="bg-[#091A31] border border-[#1D3E6B] rounded-lg p-5 space-y-3 text-sm text-slate-200">
              <p className="font-semibold text-white">
                Live Google Places Map Key Needed for Nearby Hospital Lookup
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hospital names, addresses, and ratings are retrieved dynamically from Google Maps
                Platform Places API so no unverified listings are shown. Configure{' '}
                <span className="font-mono text-[#00B4A6]">VITE_GOOGLE_MAPS_API_KEY</span> to load
                live nearby hospitals around your GPS position.
              </p>
            </div>
          ) : loadingPlaces ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-slate-300">
              <Loader2 className="w-6 h-6 text-[#00B4A6] animate-spin" />
              <span>Looking up nearby hospitals around your coordinates...</span>
            </div>
          ) : placesError ? (
            <div className="bg-[#091A31] border border-[#FF6B57]/60 rounded-lg p-4 text-xs text-slate-200">
              {placesError}
            </div>
          ) : hospitals.length === 0 ? (
            <div className="bg-[#091A31] border border-[#1D3E6B] rounded-lg p-5 text-center space-y-2">
              <p className="text-sm font-medium text-white">
                No hospitals matched within this search radius.
              </p>
              <p className="text-xs text-slate-400">
                Try expanding the radius to 10 km or panning the map and searching the visible area.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {hospitals.map((hospital, idx) => {
                const isSelected = selectedHospital?.id === hospital.id;
                return (
                  <motion.button
                    key={hospital.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.34,
                      delay: Math.min(idx * 0.045, 0.35),
                      ease: EASE_OUT_EXPO,
                    }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedHospitalId(hospital.id)}
                    className={`w-full text-left rounded-xl p-4 border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#122D52] border-[#FF6B57]'
                        : 'bg-[#091A31] border-[#1D3E6B] hover:border-[#00B4A6]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          <span className={isSelected ? 'text-[#FF6B57]' : 'text-[#00B4A6]'}>
                            #{idx + 1}
                          </span>
                          <span aria-hidden="true" className="text-slate-600">
                            ·
                          </span>
                          <span className="tabular-nums text-white font-semibold">
                            {hospital.distanceKm.toFixed(1)} km away
                          </span>
                          {hospital.businessStatus === 'OPERATIONAL' && (
                            <>
                              <span aria-hidden="true" className="text-slate-600">
                                ·
                              </span>
                              <span className="text-[#00B4A6]">Operational</span>
                            </>
                          )}
                        </div>
                        <h3 className="font-display text-sm sm:text-base font-bold text-white mt-1 leading-snug">
                          {hospital.name}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {hospital.address}
                        </p>
                      </div>

                      {typeof hospital.rating === 'number' && (
                        <div className="shrink-0 text-right font-mono tabular-nums">
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-white">
                            <Star className="w-3.5 h-3.5 text-[#FF6B57] fill-[#FF6B57]" />
                            <span>{hospital.rating.toFixed(1)}</span>
                          </div>
                          {typeof hospital.ratingCount === 'number' && (
                            <div className="text-[11px] text-slate-400">
                              ({hospital.ratingCount})
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Right: Interactive Live Map + Selected Hospital Route Summary */}
        <motion.section
          aria-label="Nearby Hospitals Map View"
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="lg:col-span-7 bg-[#0E2340] border border-[#1E3F6D] rounded-xl overflow-hidden"
        >
          {/* Selected Hospital / Route Bar */}
          <div className="px-5 py-4 border-b border-[#1D3E6B] flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-mono text-[#00B4A6] flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>
                  {selectedHospital
                    ? `Route to ${selectedHospital.name}`
                    : 'Interactive Hospital Proximity Map'}
                </span>
              </div>
              {selectedHospital ? (
                <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono tabular-nums">
                  <span>Straight-line: {selectedHospital.distanceKm.toFixed(1)} km</span>
                  {routeMetrics && (
                    <>
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                      <span className="text-white font-semibold">
                        Drive: {(routeMetrics.distanceMeters / 1000).toFixed(1)} km
                      </span>
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                      <span className="text-[#FF6B57] font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>~{Math.max(1, Math.round(routeMetrics.durationMillis / 60000))} min</span>
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any hospital marker or list item to inspect its address and driving route.
                </p>
              )}
            </div>

            {canUseGoogleMaps && viewportCenter && (
              <motion.button
                type="button"
                {...buttonInteraction}
                onClick={handleSearchVisibleArea}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#091A31] hover:bg-[#173763] border border-[#23487A] text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#00B4A6]" />
                <span>Search This Area</span>
              </motion.button>
            )}
          </div>

          {/* Explicit Map Container Height (CF2) */}
          <div className="relative w-full h-[440px] sm:h-[520px] bg-[#071528]">
            {canUseGoogleMaps ? (
              <APIProvider apiKey={MAPS_API_KEY} language="en" region="IN">
                <MapStatusWatcher onFailure={setMapFailed} />
                <GoogleMap
                  mapId="DEMO_MAP_ID"
                  defaultCenter={searchCenter}
                  defaultZoom={13}
                  gestureHandling="greedy"
                  streetViewControl={false}
                  mapTypeControl={false}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  <NearbyHospitalsController
                    searchCenter={searchCenter}
                    radiusMeters={radiusMeters}
                    rankPreference={rankPreference}
                    textQuery={activeTextQuery}
                    searchNonce={searchNonce}
                    selectedHospital={selectedHospital}
                    onHospitalsLoaded={handleHospitalsLoaded}
                    onLoadingChange={setLoadingPlaces}
                    onErrorChange={setPlacesError}
                    onRouteMetricsChange={setRouteMetrics}
                    onViewportCenterChange={setViewportCenter}
                  />

                  {/* User / Active Origin Pin */}
                  <AdvancedMarker position={searchCenter} title={centerLabel}>
                    <Pin background="#00B4A6" borderColor="#FFFFFF" glyphColor="#08172B" />
                  </AdvancedMarker>

                  {/* Discovered Hospital Markers */}
                  {hospitals.map((hospital, idx) => {
                    const isSelected = selectedHospital?.id === hospital.id;
                    return (
                      <AdvancedMarker
                        key={hospital.id}
                        position={hospital.location}
                        title={hospital.name}
                        onClick={() => setSelectedHospitalId(hospital.id)}
                      >
                        <Pin
                          background={isSelected ? '#FF6B57' : '#0E2340'}
                          borderColor={isSelected ? '#FFFFFF' : '#00B4A6'}
                          glyphColor="#FFFFFF"
                          glyphText={String(idx + 1)}
                        />
                      </AdvancedMarker>
                    );
                  })}
                </GoogleMap>
              </APIProvider>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <MapPin className="w-9 h-9 text-[#00B4A6]" />
                <div className="font-display text-base font-bold text-white">
                  Google Maps Nearby Hospital Radar
                </div>
                <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                  Once your Google Maps API key is active in the runtime environment, this interactive
                  map plots real nearby hospitals around{' '}
                  <span className="font-mono text-[#00B4A6]">{centerLabel}</span> with live
                  driving ETAs.
                </p>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
