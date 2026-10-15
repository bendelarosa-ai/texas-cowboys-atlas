"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalize } from "@/lib/search";

export interface FilterOption {
  label: string;
  count: number;
}

interface Props {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
}

/** A filter button that opens a searchable, keyboard-friendly option list. */
export default function FilterMenu({ label, value, options, onChange, searchable = true }: Props) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const visible = useMemo(() => {
    const t = normalize(term);
    return options.filter((o) => (o.count > 0 || o.label === value) && (!t || normalize(o.label).includes(t)));
  }, [options, term, value]);

  // Row 0 is "Any <label>"; option rows follow.
  const rows = visible.length + 1;

  useEffect(() => {
    if (!open) return;
    setTerm("");
    const selected = visible.findIndex((o) => o.label === value);
    setActive(selected >= 0 ? selected + 1 : 0);
    requestAnimationFrame(() => (searchable ? inputRef.current : listRef.current)?.focus());

    function onPointer(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-row="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function choose(row: number) {
    onChange(row === 0 ? "" : visible[row - 1].label);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, rows - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  const isSet = value !== "";

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors ${
          isSet
            ? "border-burnt/50 bg-burnt/[0.06] font-medium text-burnt-dark"
            : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
        }`}
      >
        <span>{isSet ? value : label}</span>
        <svg className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-stone-900/20 sm:hidden" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl border border-stone-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 sm:max-h-80 sm:w-72 sm:rounded-xl"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center justify-between px-4 pb-1 pt-3 sm:hidden">
              <p className="text-sm font-semibold text-stone-900">{label}</p>
              <button type="button" onClick={close} className="btn-ghost btn-sm">Done</button>
            </div>
            {searchable && (
              <div className="border-b border-stone-100 p-2">
                <input
                  ref={inputRef}
                  value={term}
                  onChange={(e) => {
                    setTerm(e.target.value);
                    setActive(e.target.value ? 1 : 0);
                  }}
                  placeholder={`Search ${label.toLowerCase()}…`}
                  aria-label={`Search ${label}`}
                  aria-controls={listId}
                  aria-activedescendant={`${listId}-${active}`}
                  className="input h-9 text-sm"
                />
              </div>
            )}
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={label}
              tabIndex={searchable ? -1 : 0}
              aria-activedescendant={`${listId}-${active}`}
              className="flex-1 overflow-y-auto overscroll-contain p-1.5 focus:outline-none"
            >
              <li
                id={`${listId}-0`}
                data-row={0}
                role="option"
                aria-selected={!isSet}
                onMouseEnter={() => setActive(0)}
                onClick={() => choose(0)}
                className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm ${active === 0 ? "bg-stone-100" : ""} ${!isSet ? "font-medium text-stone-900" : "text-stone-700"}`}
              >
                Any {label.toLowerCase()}
                {!isSet && <Check />}
              </li>
              {visible.map((o, i) => {
                const row = i + 1;
                const selected = o.label === value;
                return (
                  <li
                    key={o.label}
                    id={`${listId}-${row}`}
                    data-row={row}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(row)}
                    onClick={() => choose(row)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${active === row ? "bg-stone-100" : ""} ${selected ? "font-medium text-stone-900" : "text-stone-700"}`}
                  >
                    <span className="truncate">{o.label}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums text-[13px] text-stone-500">{o.count}</span>
                      {selected && <Check />}
                    </span>
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-stone-500">No matches for “{term}”</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Check() {
  return (
    <svg className="h-4 w-4 text-burnt" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.58l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  );
}
