"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Country, State } from "country-state-city";

interface Props {
  defaultCountry?: string;
  defaultState?: string;
  onChange: (country: string, state: string) => void;
}

export default function LocationSelector({ defaultCountry = "", defaultState = "", onChange }: Props) {
  const [country, setCountry] = useState(defaultCountry);
  const [stateSearch, setStateSearch] = useState(defaultState);
  const [selectedState, setSelectedState] = useState(defaultState);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const countries = useMemo(() => Country.getAllCountries(), []);

  const states = useMemo(() => {
    const c = countries.find(c => c.name === country);
    return c ? State.getStatesOfCountry(c.isoCode) : [];
  }, [country, countries]);

  const filteredStates = useMemo(() => {
    if (!stateSearch || stateSearch === selectedState) return states;
    const q = stateSearch.toLowerCase();
    return states.filter(s => s.name.toLowerCase().includes(q));
  }, [states, stateSearch, selectedState]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleCountryChange(newCountry: string) {
    setCountry(newCountry);
    setSelectedState("");
    setStateSearch("");
    onChange(newCountry, "");
  }

  function handleStateSelect(stateName: string) {
    setSelectedState(stateName);
    setStateSearch(stateName);
    setShowDropdown(false);
    onChange(country, stateName);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Country — native select */}
      <div className="space-y-1">
        <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Country</label>
        <select
          value={country}
          onChange={e => handleCountryChange(e.target.value)}
          className="input-field text-sm"
        >
          <option value="">Select country</option>
          {countries.map(c => (
            <option key={c.isoCode} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* State — searchable input */}
      <div className="space-y-1 relative" ref={dropdownRef}>
        <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">State / Province</label>
        <input
          ref={inputRef}
          value={stateSearch}
          onChange={e => {
            setStateSearch(e.target.value);
            setSelectedState("");
            setShowDropdown(true);
          }}
          onFocus={() => { if (country) setShowDropdown(true); }}
          placeholder={country ? "Search state…" : "Select country first"}
          disabled={!country}
          className="input-field text-sm"
        />

        {showDropdown && country && filteredStates.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-sanctuary-surface-lowest border border-sanctuary-outline-variant/20 rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50">
            {filteredStates.map(s => (
              <button
                key={s.isoCode}
                type="button"
                onClick={() => handleStateSelect(s.name)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-sanctuary-surface-low ${
                  s.name === selectedState ? "text-sanctuary-primary font-medium bg-sanctuary-primary-container/10" : "text-sanctuary-on-surface"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {showDropdown && country && stateSearch && filteredStates.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-sanctuary-surface-lowest border border-sanctuary-outline-variant/20 rounded-lg shadow-lg p-3 z-50">
            <p className="text-xs text-sanctuary-outline text-center">No matching states</p>
          </div>
        )}
      </div>
    </div>
  );
}
