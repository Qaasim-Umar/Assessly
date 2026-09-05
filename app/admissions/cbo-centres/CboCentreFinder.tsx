"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  ChevronDown,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  getCboCentreLocations,
  getCboCentresByLocation,
  type CboCentreLocation,
  type PublicCboCentre,
} from "@/lib/cboCentreService";

const INITIAL_VISIBLE_COUNT = 12;

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function phoneHref(phoneNumber: string) {
  return `tel:${phoneNumber.replace(/[^+\d]/g, "")}`;
}

function directionsHref(centre: PublicCboCentre) {
  const destination = [centre.office_address, centre.town, centre.lga, centre.state]
    .filter(Boolean)
    .join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
}

export function CboFinderLoading() {
  return (
    <div className="cbo-finder" aria-busy="true" aria-label="Loading centre finder">
      <div className="cbo-filter-panel">
        <div className="cbo-loading-line cbo-loading-heading" />
        <div className="cbo-loading-line cbo-loading-copy" />
        <div className="cbo-filter-grid">
          <div className="cbo-loading-field" />
          <div className="cbo-loading-field" />
        </div>
      </div>
      <div className="cbo-initial-state">
        <div className="cbo-loading-orb" />
        <div className="cbo-loading-line cbo-loading-copy" />
      </div>
    </div>
  );
}

export default function CboCentreFinder() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<CboCentreLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState("");
  const [selectedState, setSelectedState] = useState(
    () => searchParams.get("state")?.trim() ?? "",
  );
  const [selectedLga, setSelectedLga] = useState(
    () => searchParams.get("lga")?.trim() ?? "",
  );
  const [centres, setCentres] = useState<PublicCboCentre[]>([]);
  const [centresLoading, setCentresLoading] = useState(false);
  const [centresError, setCentresError] = useState("");
  const [centresRetryKey, setCentresRetryKey] = useState(0);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const loadLocations = useCallback(async () => {
    setLocationsLoading(true);
    setLocationsError("");

    try {
      setLocations(await getCboCentreLocations());
    } catch {
      setLocationsError(
        "We could not load the location list. Check your connection and try again.",
      );
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  const states = useMemo(
    () => uniqueSorted(locations.map((location) => location.state)),
    [locations],
  );

  const lgas = useMemo(
    () =>
      uniqueSorted(
        locations
          .filter((location) => location.state === selectedState)
          .map((location) => location.lga),
      ),
    [locations, selectedState],
  );

  useEffect(() => {
    if (locationsLoading || locations.length === 0) return;

    if (selectedState && !states.includes(selectedState)) {
      setSelectedState("");
      setSelectedLga("");
      router.replace(pathname, { scroll: false });
      return;
    }

    if (selectedLga && !lgas.includes(selectedLga)) {
      setSelectedLga("");
      const params = new URLSearchParams();
      if (selectedState) params.set("state", selectedState);
      router.replace(
        params.size > 0 ? `${pathname}?${params.toString()}` : pathname,
        { scroll: false },
      );
    }
  }, [
    lgas,
    locations.length,
    locationsLoading,
    pathname,
    router,
    selectedLga,
    selectedState,
    states,
  ]);

  useEffect(() => {
    let active = true;

    if (!selectedState || !selectedLga) {
      setCentres([]);
      setCentresError("");
      setCentresLoading(false);
      return () => {
        active = false;
      };
    }

    async function loadCentres() {
      setCentresLoading(true);
      setCentresError("");
      setCentres([]);

      try {
        const nextCentres = await getCboCentresByLocation(
          selectedState,
          selectedLga,
        );
        if (active) setCentres(nextCentres);
      } catch {
        if (active) {
          setCentresError(
            "We could not load centres for this location. Please try again.",
          );
        }
      } finally {
        if (active) setCentresLoading(false);
      }
    }

    void loadCentres();

    return () => {
      active = false;
    };
  }, [centresRetryKey, selectedLga, selectedState]);

  const filteredCentres = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return centres;

    return centres.filter((centre) =>
      [centre.cyber_cafe, centre.office_address, centre.town]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [centres, query]);

  const visibleCentres = filteredCentres.slice(0, visibleCount);

  function updateUrl(state: string, lga: string) {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (lga) params.set("lga", lga);
    router.replace(
      params.size > 0 ? `${pathname}?${params.toString()}` : pathname,
      { scroll: false },
    );
  }

  function handleStateChange(nextState: string) {
    setSelectedState(nextState);
    setSelectedLga("");
    setQuery("");
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    updateUrl(nextState, "");
  }

  function handleLgaChange(nextLga: string) {
    setSelectedLga(nextLga);
    setQuery("");
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    updateUrl(selectedState, nextLga);
  }

  function retryCentres() {
    setCentresRetryKey((key) => key + 1);
  }

  return (
    <div className="cbo-finder">
      <div className="cbo-filter-panel">
        <div className="cbo-filter-heading">
          <div>
            <span className="cbo-step-label">Start here</span>
            <h2>Choose your location</h2>
          </div>
          <span className="cbo-filter-badge">
            <LocateFixed size={16} aria-hidden="true" />
            Nigeria
          </span>
        </div>
        <p className="cbo-filter-help">
          Local government options appear after you select a state.
        </p>

        {locationsError ? (
          <div className="cbo-inline-error" role="alert">
            <p>{locationsError}</p>
            <button type="button" onClick={() => void loadLocations()}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : (
          <div className="cbo-filter-grid">
            <label className="cbo-field">
              <span>State</span>
              <span className="cbo-select-wrap">
                <select
                  value={selectedState}
                  onChange={(event) => handleStateChange(event.target.value)}
                  disabled={locationsLoading}
                  aria-describedby="cbo-location-help"
                >
                  <option value="">
                    {locationsLoading ? "Loading states..." : "Select a state"}
                  </option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} aria-hidden="true" />
              </span>
            </label>

            <label className="cbo-field">
              <span>Local government area</span>
              <span className="cbo-select-wrap">
                <select
                  value={selectedLga}
                  onChange={(event) => handleLgaChange(event.target.value)}
                  disabled={!selectedState || locationsLoading}
                >
                  <option value="">
                    {selectedState ? "Select an LGA" : "Select a state first"}
                  </option>
                  {lgas.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} aria-hidden="true" />
              </span>
            </label>
          </div>
        )}
        <span id="cbo-location-help" className="cbo-sr-only">
          Select your state, then select a local government area to load nearby
          registration centres.
        </span>
      </div>

      <div className="cbo-results" aria-busy={centresLoading}>
        {!selectedState || !selectedLga ? (
          <div className="cbo-initial-state">
            <span className="cbo-initial-icon">
              <MapPin size={28} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h2>
              {selectedState
                ? "Now choose your local government"
                : "Your nearest centres will appear here"}
            </h2>
            <p>
              {selectedState
                ? `Select an LGA in ${selectedState} to continue.`
                : "Use the two location fields above to browse the directory."}
            </p>
          </div>
        ) : centresLoading ? (
          <div>
            <div className="cbo-results-heading">
              <div>
                <span className="cbo-step-label">Searching directory</span>
                <h2>Finding centres in {selectedLga}</h2>
              </div>
            </div>
            <div className="cbo-card-grid" aria-label="Loading centres">
              {[1, 2, 3].map((item) => (
                <div key={item} className="cbo-centre-card cbo-card-skeleton">
                  <div className="cbo-loading-line cbo-loading-heading" />
                  <div className="cbo-loading-line cbo-loading-copy" />
                  <div className="cbo-loading-line cbo-loading-copy-short" />
                </div>
              ))}
            </div>
          </div>
        ) : centresError ? (
          <div className="cbo-error-state" role="alert">
            <span className="cbo-initial-icon cbo-error-icon">
              <RefreshCw size={26} aria-hidden="true" />
            </span>
            <h2>Something went wrong</h2>
            <p>{centresError}</p>
            <button type="button" onClick={retryCentres}>
              Try again
            </button>
          </div>
        ) : centres.length === 0 ? (
          <div className="cbo-initial-state" role="status">
            <span className="cbo-initial-icon">
              <Building2 size={28} aria-hidden="true" />
            </span>
            <h2>No listed centres found</h2>
            <p>
              There are currently no centres listed for {selectedLga},{" "}
              {selectedState}. Try a nearby local government area.
            </p>
          </div>
        ) : (
          <>
            <div className="cbo-results-heading">
              <div>
                <span className="cbo-step-label">Available centres</span>
                <h2>
                  {centres.length} {centres.length === 1 ? "centre" : "centres"}{" "}
                  in {selectedLga}
                </h2>
                <p>{selectedLga}, {selectedState}</p>
              </div>
              {centres.length > 4 && (
                <label className="cbo-result-search">
                  <span className="cbo-sr-only">Search these centres</span>
                  <Search size={17} aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setVisibleCount(INITIAL_VISIBLE_COUNT);
                    }}
                    placeholder="Search these centres"
                  />
                </label>
              )}
            </div>

            <p className="cbo-sr-only" aria-live="polite">
              {filteredCentres.length} centres match your current search.
            </p>

            {filteredCentres.length === 0 ? (
              <div className="cbo-no-match" role="status">
                <Search size={24} aria-hidden="true" />
                <h3>No centres match “{query}”</h3>
                <p>Try the centre name, town, street, or a shorter search.</p>
                <button type="button" onClick={() => setQuery("")}>
                  Clear search
                </button>
              </div>
            ) : (
              <div className="cbo-card-grid">
                {visibleCentres.map((centre) => (
                  <article key={centre.sn} className="cbo-centre-card">
                    <div className="cbo-card-topline">
                      <span className="cbo-centre-icon">
                        <Building2 size={20} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <span className="cbo-centre-number">Centre #{centre.sn}</span>
                    </div>
                    <h3>{centre.cyber_cafe}</h3>
                    <div className="cbo-card-location">
                      <MapPin size={18} strokeWidth={1.9} aria-hidden="true" />
                      <div>
                        <span>Office address</span>
                        <p>{centre.office_address}</p>
                        {centre.town && centre.town !== centre.office_address && (
                          <small>{centre.town}</small>
                        )}
                      </div>
                    </div>

                    <div className="cbo-card-actions">
                      {centre.phone_number ? (
                        <a
                          href={phoneHref(centre.phone_number)}
                          className="cbo-call-link"
                          aria-label={`Call ${centre.cyber_cafe} on ${centre.phone_number}`}
                        >
                          <Phone size={17} aria-hidden="true" />
                          {centre.phone_number}
                        </a>
                      ) : (
                        <span className="cbo-phone-unavailable">No phone listed</span>
                      )}
                      <a
                        href={directionsHref(centre)}
                        target="_blank"
                        rel="noreferrer"
                        className="cbo-directions-link"
                        aria-label={`Open directions to ${centre.cyber_cafe} in Google Maps`}
                      >
                        <Navigation size={17} aria-hidden="true" />
                        Directions
                      </a>
                    </div>

                    {centre.alternative_phone_number && (
                      <p className="cbo-alt-phone">
                        Alternate:{" "}
                        <a href={phoneHref(centre.alternative_phone_number)}>
                          {centre.alternative_phone_number}
                        </a>
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            {visibleCount < filteredCentres.length && (
              <div className="cbo-load-more-wrap">
                <button
                  type="button"
                  className="cbo-load-more"
                  onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_COUNT)}
                >
                  Show more centres
                </button>
                <span>
                  Showing {visibleCentres.length} of {filteredCentres.length}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
