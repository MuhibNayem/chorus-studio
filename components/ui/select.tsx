"use client";

/**
 * Accessible, fully-themed custom Select.
 *
 * Modes (composable):
 *   <Select value={s} onChange={fn}>               — single select (default)
 *   <Select searchable …>                          — adds filtered search input
 *   <Select multiple value={arr} onChange={fn}>    — multi-select with checkmarks
 *   <Select multiple selectAll …>                  — adds "Select all" toggle row
 *
 * ARIA implementation:
 *   Non-searchable  → trigger has role="combobox", aria-activedescendant tracks focused option
 *   Searchable      → trigger opens panel, focus moves to input[role="combobox"]
 *                     with aria-autocomplete="list" and aria-activedescendant
 *   Listbox         → role="listbox", aria-multiselectable for multiple
 *   Options         → role="option", aria-selected, aria-disabled
 *
 * Keyboard (all modes):
 *   ↑ ↓        navigate options (opens if closed)
 *   Enter/Space select focused option (or toggle in multi)
 *   Home/End   jump to first/last
 *   Escape     close
 *   Tab        close and move focus
 *   [char]     type-ahead (non-searchable mode)
 */

import * as React from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OptionDef {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Array of option objects — alternative to <option> children */
  options?: OptionDef[];
  /** <option value="…">label</option> children — parsed at render time */
  children?: React.ReactNode;

  /** Current value. string for single, string[] for multiple */
  value?: string | string[];
  /** Called with new string (single) or string[] (multiple) */
  onChange?: (value: string | string[]) => void;

  /** Enable multi-select mode */
  multiple?: boolean;
  /** Show a filter search box inside the dropdown */
  searchable?: boolean;
  /** Show a "Select all / Deselect all" toggle row (multiple only) */
  selectAll?: boolean;

  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  style?: React.CSSProperties;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseChildren(children: React.ReactNode): OptionDef[] {
  const list: OptionDef[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === "option") {
      const p = child.props as { value?: string; children?: React.ReactNode; disabled?: boolean };
      list.push({ value: p.value ?? "", label: String(p.children ?? ""), disabled: p.disabled });
    }
  });
  return list;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Select = React.forwardRef<HTMLElement, SelectProps>(
  (
    {
      options: optionsProp,
      children,
      value,
      onChange,
      multiple = false,
      searchable = false,
      selectAll = false,
      placeholder = "Select…",
      disabled = false,
      required = false,
      id,
      style,
      ...ariaProps
    },
    _ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState<number>(-1);
    const [query, setQuery] = React.useState("");

    const uid = React.useId();
    const triggerId = id ?? `${uid}-trigger`;
    const listboxId = `${uid}-listbox`;
    const searchId = `${uid}-search`;
    const optionId = (i: number) => `${uid}-opt-${i}`;

    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);
    const listboxRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Resolve options from prop or children
    const allOptions = React.useMemo<OptionDef[]>(
      () => optionsProp ?? parseChildren(children),
      [optionsProp, children]
    );

    // Filter by search query
    const filteredOptions = React.useMemo(
      () =>
        query.trim()
          ? allOptions.filter((o) =>
              o.label.toLowerCase().includes(query.toLowerCase())
            )
          : allOptions,
      [allOptions, query]
    );

    // Normalised value helpers
    const singleValue = multiple ? "" : (value as string) ?? "";
    const multiValues: string[] = multiple ? ((value as string[]) ?? []) : [];
    const isSelected = (v: string) =>
      multiple ? multiValues.includes(v) : v === singleValue;

    const enabledOptions = filteredOptions.filter((o) => !o.disabled);
    const allEnabledSelected =
      enabledOptions.length > 0 &&
      enabledOptions.every((o) => multiValues.includes(o.value));

    // ── Trigger label ──────────────────────────────────────────────────────

    const triggerLabel = React.useMemo(() => {
      if (!multiple) {
        return allOptions.find((o) => o.value === singleValue)?.label ?? null;
      }
      if (multiValues.length === 0) return null;
      if (multiValues.length === allOptions.length) return `All selected (${allOptions.length})`;
      if (multiValues.length === 1)
        return allOptions.find((o) => o.value === multiValues[0])?.label ?? null;
      return `${multiValues.length} selected`;
    }, [multiple, allOptions, singleValue, multiValues]);

    // ── Open / close ───────────────────────────────────────────────────────

    const openList = React.useCallback(
      (focusIdx?: number) => {
        setOpen(true);
        if (!searchable) {
          const def = focusIdx ?? allOptions.findIndex((o) => isSelected(o.value));
          setActiveIndex(def >= 0 ? def : 0);
        } else {
          setActiveIndex(focusIdx ?? -1);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [searchable, allOptions, singleValue, multiValues]
    );

    const closeList = React.useCallback(() => {
      setOpen(false);
      setActiveIndex(-1);
      setQuery("");
      triggerRef.current?.focus();
    }, []);

    // Focus search input when searchable dropdown opens
    React.useEffect(() => {
      if (open && searchable) {
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    }, [open, searchable]);

    // Scroll active option into view
    React.useEffect(() => {
      if (!open || activeIndex < 0) return;
      listboxRef.current
        ?.querySelector<HTMLElement>(`#${optionId(activeIndex)}`)
        ?.scrollIntoView({ block: "nearest" });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex, open]);

    // Close on outside click
    React.useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false);
          setActiveIndex(-1);
          setQuery("");
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // ── Selection logic ────────────────────────────────────────────────────

    const commitSingle = React.useCallback(
      (opt: OptionDef) => {
        if (opt.disabled) return;
        (onChange as (v: string) => void)?.(opt.value);
        setOpen(false);
        setActiveIndex(-1);
        setQuery("");
        triggerRef.current?.focus();
      },
      [onChange]
    );

    const commitMulti = React.useCallback(
      (opt: OptionDef) => {
        if (opt.disabled) return;
        const next = multiValues.includes(opt.value)
          ? multiValues.filter((v) => v !== opt.value)
          : [...multiValues, opt.value];
        (onChange as (v: string[]) => void)?.(next);
      },
      [multiValues, onChange]
    );

    const commitSelectAll = React.useCallback(() => {
      const allEnabled = allOptions.filter((o) => !o.disabled).map((o) => o.value);
      const next = allEnabledSelected ? [] : allEnabled;
      (onChange as (v: string[]) => void)?.(next);
    }, [allOptions, allEnabledSelected, onChange]);

    const commitByIndex = React.useCallback(
      (idx: number) => {
        const opt = filteredOptions[idx];
        if (!opt) return;
        multiple ? commitMulti(opt) : commitSingle(opt);
      },
      [filteredOptions, multiple, commitMulti, commitSingle]
    );

    // ── Keyboard navigation ────────────────────────────────────────────────

    const nextEnabled = (from: number, dir: 1 | -1) => {
      let i = from + dir;
      // Account for select-all row: filteredOptions[i] when idx offset is 0-based over filteredOptions
      while (i >= 0 && i < filteredOptions.length) {
        if (!filteredOptions[i].disabled) return i;
        i += dir;
      }
      return -1;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!open) { openList(); break; }
          setActiveIndex((ai) => {
            const n = nextEnabled(ai, 1);
            return n >= 0 ? n : ai;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          if (!open) { openList(filteredOptions.length - 1); break; }
          setActiveIndex((ai) => {
            const p = nextEnabled(ai, -1);
            return p >= 0 ? p : ai;
          });
          break;
        case "Home":
          e.preventDefault();
          if (open) setActiveIndex(nextEnabled(-1, 1));
          break;
        case "End":
          e.preventDefault();
          if (open) setActiveIndex(nextEnabled(filteredOptions.length, -1));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (!open) { openList(); break; }
          if (activeIndex >= 0) commitByIndex(activeIndex);
          break;
        case "Escape":
          e.preventDefault();
          closeList();
          break;
        case "Tab":
          if (open) closeList();
          break;
        default:
          // Type-ahead for non-searchable only
          if (!searchable && e.key.length === 1) {
            e.preventDefault();
            const ch = e.key.toLowerCase();
            const start = open ? activeIndex + 1 : 0;
            let found = filteredOptions
              .slice(start)
              .findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(ch));
            if (found >= 0) found += start;
            else
              found = filteredOptions
                .slice(0, start)
                .findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(ch));
            if (found >= 0) {
              if (!open) openList(found);
              else setActiveIndex(found);
            }
          }
      }
    };

    // ── Render ─────────────────────────────────────────────────────────────

    return (
      <div ref={containerRef} style={{ position: "relative", ...style }}>

        {/* Trigger button */}
        <button
          ref={triggerRef}
          type="button"
          id={triggerId}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            !searchable && open && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          aria-multiselectable={multiple || undefined}
          aria-required={required || undefined}
          aria-disabled={disabled || undefined}
          aria-label={ariaProps["aria-label"]}
          aria-labelledby={ariaProps["aria-labelledby"]}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onClick={() => (open ? closeList() : openList())}
          style={{
            width: "100%",
            height: 36,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 10px 0 12px",
            background: "hsl(var(--card-elev))",
            border: open
              ? "1px solid hsl(var(--primary) / 0.5)"
              : "1px solid hsl(var(--border) / 0.2)",
            borderRadius: 10,
            boxShadow: open ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "border-color 0.15s, box-shadow 0.15s",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: triggerLabel ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.6)",
            opacity: disabled ? 0.5 : 1,
            textAlign: "left",
          }}
        >
          {/* Multi-select value chips (2 max, then "+N more") */}
          {multiple && multiValues.length > 0 ? (
            <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", minWidth: 0 }}>
              {multiValues.slice(0, 2).map((v) => {
                const lbl = allOptions.find((o) => o.value === v)?.label ?? v;
                return (
                  <span
                    key={v}
                    style={{
                      background: "hsl(var(--primary) / 0.1)",
                      color: "hsl(var(--primary))",
                      borderRadius: 6,
                      padding: "1px 7px",
                      fontSize: 11,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 120,
                    }}
                  >
                    {lbl}
                  </span>
                );
              })}
              {multiValues.length > 2 && (
                <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, whiteSpace: "nowrap" }}>
                  +{multiValues.length - 2} more
                </span>
              )}
            </span>
          ) : (
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {triggerLabel ?? placeholder}
            </span>
          )}

          {/* Clear button for multi when has selection */}
          {multiple && multiValues.length > 0 && (
            <span
              role="button"
              aria-label="Clear selection"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                (onChange as (v: string[]) => void)?.([]);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "2px 3px",
                borderRadius: 5,
                color: "hsl(var(--muted-foreground))",
                transition: "color 0.1s, background 0.1s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "hsl(var(--foreground))";
                e.currentTarget.style.background = "hsl(var(--muted)/0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X size={11} />
            </span>
          )}

          <ChevronDown
            size={13}
            style={{
              flexShrink: 0,
              color: "hsl(var(--muted-foreground))",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.18s",
            }}
          />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 5px)",
              left: 0,
              right: 0,
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border) / 0.15)",
              borderRadius: 12,
              boxShadow: "0 12px 40px hsl(0 0% 0% / 0.28), 0 0 0 1px hsl(var(--border) / 0.08)",
              zIndex: 200,
              overflow: "hidden",
              minWidth: "100%",
            }}
          >
            {/* Search input */}
            {searchable && (
              <div style={{
                padding: "8px 8px 4px",
                borderBottom: "1px solid hsl(var(--border) / 0.1)",
              }}>
                <div style={{ position: "relative" }}>
                  <Search
                    size={12}
                    style={{
                      position: "absolute",
                      left: 9,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "hsl(var(--muted-foreground))",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    ref={searchRef}
                    id={searchId}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={open}
                    aria-controls={listboxId}
                    aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
                    aria-label="Search options"
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search…"
                    style={{
                      width: "100%",
                      height: 30,
                      paddingLeft: 28,
                      paddingRight: query ? 28 : 8,
                      background: "hsl(var(--card-elev))",
                      border: "1px solid hsl(var(--border) / 0.15)",
                      borderRadius: 7,
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "hsl(var(--foreground))",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {query && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => { setQuery(""); setActiveIndex(-1); searchRef.current?.focus(); }}
                      style={{
                        position: "absolute", right: 6, top: "50%",
                        transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "hsl(var(--muted-foreground))",
                        display: "flex", alignItems: "center", padding: 1,
                        borderRadius: 3,
                      }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Listbox */}
            <div
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={triggerId}
              aria-multiselectable={multiple || undefined}
              style={{ overflowY: "auto", maxHeight: 220, padding: 4 }}
            >
              {/* Select all row */}
              {multiple && selectAll && filteredOptions.length > 0 && !query && (
                <SelectAllRow
                  allSelected={allEnabledSelected}
                  partialSelected={multiValues.length > 0 && !allEnabledSelected}
                  count={enabledOptions.length}
                  onToggle={commitSelectAll}
                />
              )}

              {filteredOptions.length === 0 ? (
                <div style={{
                  padding: "12px 10px",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "hsl(var(--muted-foreground))",
                  textAlign: "center",
                }}>
                  No results
                </div>
              ) : (
                filteredOptions.map((opt, idx) => (
                  <OptionRow
                    key={opt.value}
                    id={optionId(idx)}
                    label={opt.label}
                    selected={isSelected(opt.value)}
                    active={idx === activeIndex}
                    disabled={opt.disabled}
                    multiple={multiple}
                    onSelect={() => commitByIndex(idx)}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(idx)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export { Select };

// ── Sub-components ────────────────────────────────────────────────────────────

function OptionRow({
  id,
  label,
  selected,
  active,
  disabled,
  multiple,
  onSelect,
  onMouseEnter,
}: {
  id: string;
  label: string;
  selected: boolean;
  active: boolean;
  disabled?: boolean;
  multiple: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}) {
  const bg = (() => {
    if (disabled) return "transparent";
    if (active && selected) return "hsl(var(--primary) / 0.14)";
    if (active) return "hsl(var(--muted) / 0.4)";
    if (selected) return "hsl(var(--primary) / 0.08)";
    return "transparent";
  })();

  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 10px",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        userSelect: "none",
        transition: "background 0.1s",
        color: disabled
          ? "hsl(var(--muted-foreground) / 0.35)"
          : selected
          ? "hsl(var(--primary))"
          : "hsl(var(--foreground))",
        background: bg,
        fontWeight: selected ? 600 : 400,
      }}
    >
      {/* Checkbox indicator in multi mode */}
      {multiple && (
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            flexShrink: 0,
            border: selected
              ? "1.5px solid hsl(var(--primary))"
              : "1.5px solid hsl(var(--border) / 0.5)",
            background: selected ? "hsl(var(--primary))" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.1s, border-color 0.1s",
          }}
        >
          {selected && <Check size={9} style={{ color: "hsl(var(--primary-foreground, #fff))", strokeWidth: 3 }} />}
        </span>
      )}

      <span style={{ flex: 1 }}>{label}</span>

      {/* Checkmark in single mode */}
      {!multiple && selected && (
        <Check size={12} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
      )}
    </div>
  );
}

function SelectAllRow({
  allSelected,
  partialSelected,
  count,
  onToggle,
}: {
  allSelected: boolean;
  partialSelected: boolean;
  count: number;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      role="option"
      aria-selected={allSelected}
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 10px",
        borderRadius: 8,
        cursor: "pointer",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        fontWeight: 600,
        userSelect: "none",
        marginBottom: 2,
        borderBottom: "1px solid hsl(var(--border) / 0.1)",
        paddingBottom: 9,
        marginLeft: -4,
        marginRight: -4,
        background: hovered ? "hsl(var(--muted) / 0.35)" : "transparent",
        color: allSelected ? "hsl(var(--primary))" : "hsl(var(--foreground))",
        transition: "background 0.1s",
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          flexShrink: 0,
          border: allSelected || partialSelected
            ? "1.5px solid hsl(var(--primary))"
            : "1.5px solid hsl(var(--border) / 0.5)",
          background: allSelected
            ? "hsl(var(--primary))"
            : partialSelected
            ? "hsl(var(--primary) / 0.4)"
            : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.1s, border-color 0.1s",
        }}
      >
        {(allSelected || partialSelected) && (
          <span style={{
            width: 6,
            height: 1.5,
            background: "hsl(var(--primary-foreground, #fff))",
            borderRadius: 1,
            display: "block",
          }} />
        )}
      </span>
      <span style={{ flex: 1 }}>
        {allSelected ? "Deselect all" : "Select all"}
      </span>
      <span style={{
        fontSize: 10,
        color: "hsl(var(--muted-foreground))",
        background: "hsl(var(--muted) / 0.4)",
        borderRadius: 5,
        padding: "1px 6px",
      }}>
        {count}
      </span>
    </div>
  );
}
