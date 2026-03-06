"use client";

import { Suspense, useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { List } from "react-window";
import crmData from "@/data/data.json";
import type { CrmData, Employee, Hotel } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";

const data = crmData as CrmData;

const ROW_HEIGHT = 44;

const COLUMN_IDS = [
  "firstName",
  "lastName",
  "hotel",
  "city",
  "country",
  "role",
  "category",
  "email",
  "companyLinkedin",
  "personLinkedin",
] as const;

type ColumnId = (typeof COLUMN_IDS)[number];

const COLUMN_LABELS: Record<ColumnId, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  hotel: "Hotel",
  city: "City",
  country: "Country",
  role: "Role",
  category: "Category",
  email: "Email",
  companyLinkedin: "Company LinkedIn",
  personLinkedin: "Person LinkedIn",
};

const COLUMN_WIDTHS: Record<ColumnId, number> = {
  firstName: 120,
  lastName: 120,
  hotel: 200,
  city: 120,
  country: 120,
  role: 180,
  category: 90,
  email: 220,
  companyLinkedin: 180,
  personLinkedin: 180,
};

interface EnrichedEmployee {
  employee: Employee;
  hotelName: string;
  city: string;
  country: string;
}

function useHotelByIdMap(): Map<string, Hotel> {
  return useMemo(() => new Map(data.hotels.map((h) => [h.id, h])), []);
}

function useCountryOptions(): string[] {
  return useMemo(() => {
    const set = new Set<string>();
    for (const h of data.hotels) if (h.country) set.add(h.country);
    return Array.from(set).sort();
  }, []);
}

function useCityOptions(countryFilterKey: string, countryFilterSet: Set<string>): string[] {
  const hotels = data.hotels;
  return useMemo(() => {
    const set = new Set<string>();
    for (const h of hotels) {
      if (!h.city) continue;
      if (countryFilterSet.size === 0 || countryFilterSet.has(h.country)) {
        set.add(h.city);
      }
    }
    return Array.from(set).sort();
  }, [hotels, countryFilterKey]);
}

function useHotelOptions(
  countryFilterKey: string,
  countryFilterSet: Set<string>,
  cityFilterKey: string,
  cityFilterSet: Set<string>
): { id: string; name: string }[] {
  const hotels = data.hotels;
  return useMemo(() => {
    return hotels
      .filter((h) => {
        if (countryFilterSet.size > 0 && !countryFilterSet.has(h.country))
          return false;
        if (cityFilterSet.size > 0 && !cityFilterSet.has(h.city))
          return false;
        return true;
      })
      .map((h) => ({ id: h.id, name: h.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hotels, countryFilterKey, cityFilterKey]);
}

function useFilteredEmployees(
  countryFilterKey: string,
  countryFilterSet: Set<string>,
  cityFilterKey: string,
  cityFilterSet: Set<string>,
  hotelFilterKey: string,
  hotelFilterSet: Set<string>,
  categoryFilterKey: string,
  categoryFilterSet: Set<string>,
  searchQuery: string,
  hotelById: Map<string, Hotel>
): Employee[] {
  const employees = data.employees;
  return useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return employees.filter((e) => {
      const hotel = hotelById.get(e.hotelId);
      if (countryFilterSet.size > 0 && hotel && !countryFilterSet.has(hotel.country))
        return false;
      if (cityFilterSet.size > 0 && hotel && !cityFilterSet.has(hotel.city))
        return false;
      if (hotelFilterSet.size > 0 && !hotelFilterSet.has(e.hotelId))
        return false;
      if (categoryFilterSet.size > 0 && !categoryFilterSet.has(e.category))
        return false;
      if (q) {
        const idx = e.searchIndex;
        if (idx !== undefined) {
          if (!idx.includes(q)) return false;
        } else {
          const first = (e.firstName ?? "").toLowerCase();
          const last = (e.lastName ?? "").toLowerCase();
          const em = (e.email ?? "").toLowerCase();
          if (!first.includes(q) && !last.includes(q) && !em.includes(q))
            return false;
        }
      }
      return true;
    });
  }, [
    employees,
    countryFilterKey,
    cityFilterKey,
    hotelFilterKey,
    categoryFilterKey,
    searchQuery,
    hotelById,
  ]);
}

function useEnrichedEmployees(
  filtered: Employee[],
  hotelById: Map<string, Hotel>
): EnrichedEmployee[] {
  return useMemo(() => {
    return filtered.map((e) => {
      const hotel = hotelById.get(e.hotelId);
      return {
        employee: e,
        hotelName: hotel?.name ?? "—",
        city: hotel?.city ?? "—",
        country: hotel?.country ?? "—",
      };
    });
  }, [filtered, hotelById]);
}

type SortDir = "asc" | "desc";

function useSortedEnriched(
  enriched: EnrichedEmployee[],
  sortKey: ColumnId | null,
  sortDir: SortDir
): EnrichedEmployee[] {
  return useMemo(() => {
    if (!sortKey) return enriched;
    const list = [...enriched];
    const mult = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let av: string;
      let bv: string;
      switch (sortKey) {
        case "firstName":
          av = a.employee.firstName ?? "";
          bv = b.employee.firstName ?? "";
          break;
        case "lastName":
          av = a.employee.lastName ?? "";
          bv = b.employee.lastName ?? "";
          break;
        case "hotel":
          av = a.hotelName;
          bv = b.hotelName;
          break;
        case "city":
          av = a.city;
          bv = b.city;
          break;
        case "country":
          av = a.country;
          bv = b.country;
          break;
        case "role":
          av = a.employee.role ?? "";
          bv = b.employee.role ?? "";
          break;
        case "category":
          av = a.employee.category ?? "";
          bv = b.employee.category ?? "";
          break;
        case "email":
          av = a.employee.email ?? "";
          bv = b.employee.email ?? "";
          break;
        case "companyLinkedin":
          av = a.employee.companyLinkedin ?? "";
          bv = b.employee.companyLinkedin ?? "";
          break;
        case "personLinkedin":
          av = a.employee.personLinkedin ?? "";
          bv = b.employee.personLinkedin ?? "";
          break;
        default:
          return 0;
      }
      return mult * av.localeCompare(bv, undefined, { sensitivity: "base" });
    });
    return list;
  }, [enriched, sortKey, sortDir]);
}

interface FilterState<T> {
  set: Set<T>;
  key: string;
}

function filterKeyFromSet(set: Set<string>): string {
  return [...set].sort().join("\n");
}

function toggleSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

const EMPTY_FILTER: FilterState<string> = { set: new Set(), key: "" };

function FilterCheckboxList({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [filterText, setFilterText] = useState("");
  const filtered = useMemo(() => {
    if (!filterText.trim()) return options;
    const q = filterText.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, filterText]);

  const selectedCount = selected.size;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-stat-label text-primary-muted uppercase">
          {label}
        </span>
        {selectedCount > 0 && (
          <button
            type="button"
            className="text-[11px] text-accent hover:text-accent/80 transition-colors"
            onClick={() => onChange(new Set())}
          >
            Clear ({selectedCount})
          </button>
        )}
      </div>
      {options.length > 6 && (
        <input
          type="text"
          placeholder={`Search ${label.toLowerCase()}…`}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full mb-1.5 rounded-sm border border-border bg-background px-2.5 py-1.5 text-body-sm text-primary placeholder:text-primary-muted/50 outline-none focus:border-accent/40 transition-colors"
        />
      )}
      <div className="max-h-[140px] overflow-y-auto rounded-sm border border-border bg-background">
        {filtered.length === 0 ? (
          <p className="px-2.5 py-2 text-body-sm text-primary-muted/50 italic">
            No matches
          </p>
        ) : (
          filtered.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2.5 py-1.5 text-body-sm text-primary cursor-pointer hover:bg-background-elevated/60 transition-colors"
              onClick={() => onChange(toggleSet(selected, opt.value))}
            >
              <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-all ${
                  selected.has(opt.value)
                    ? "border-accent bg-accent text-[#0a0a0a]"
                    : "border-border-strong bg-transparent"
                }`}
              >
                {selected.has(opt.value) && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5.5L4 7.5L8 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="truncate">{opt.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function CrmPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hotelById = useHotelByIdMap();

  const [countryFilter, setCountryFilter] = useState<FilterState<string>>(EMPTY_FILTER);
  const [cityFilter, setCityFilter] = useState<FilterState<string>>(EMPTY_FILTER);
  const [hotelFilter, setHotelFilter] = useState<FilterState<string>>(EMPTY_FILTER);
  const [categoryFilter, setCategoryFilter] = useState<FilterState<string>>(EMPTY_FILTER);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortState, setSortState] = useState<{ sortKey: ColumnId | null; sortDir: SortDir }>({
    sortKey: null,
    sortDir: "asc",
  });
  const { sortKey, sortDir } = sortState;
  const [columnVisibility, setColumnVisibility] = useState<Record<ColumnId, boolean>>(
    () => Object.fromEntries(COLUMN_IDS.map((c) => [c, true])) as Record<ColumnId, boolean>
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);

  const iso3Param = searchParams.get("iso3");

  useEffect(() => {
    if (!iso3Param || countryFilter.set.size > 0) return;
    const iso3 = decodeURIComponent(iso3Param).trim().toUpperCase();
    const hotelsWithIso3 = data.hotels.filter(
      (h) => (h.iso3 ?? "").trim().toUpperCase() === iso3
    );
    const countryNames = [
      ...new Set(
        hotelsWithIso3.map((h) => h.country).filter((c): c is string => Boolean(c))
      ),
    ].sort();
    if (countryNames.length === 0) return;
    setCountryFilter({
      set: new Set(countryNames),
      key: filterKeyFromSet(new Set(countryNames)),
    });
  }, [iso3Param, countryFilter.set.size]);

  useEffect(() => {
    if (iso3Param) window.scrollTo(0, 0);
  }, [iso3Param]);

  const countryOptions = useCountryOptions();
  const cityOptions = useCityOptions(countryFilter.key, countryFilter.set);
  const hotelOptions = useHotelOptions(
    countryFilter.key,
    countryFilter.set,
    cityFilter.key,
    cityFilter.set
  );

  const filtered = useFilteredEmployees(
    countryFilter.key,
    countryFilter.set,
    cityFilter.key,
    cityFilter.set,
    hotelFilter.key,
    hotelFilter.set,
    categoryFilter.key,
    categoryFilter.set,
    searchQuery,
    hotelById
  );
  const enriched = useEnrichedEmployees(filtered, hotelById);
  const sortedEnriched = useSortedEnriched(enriched, sortKey, sortDir);

  const visibleColumns = useMemo(
    () => COLUMN_IDS.filter((id) => columnVisibility[id]),
    [columnVisibility]
  );

  const handleHeaderClick = useCallback((key: ColumnId) => {
    setSortState((prev) => ({
      sortKey: key,
      sortDir:
        prev.sortKey === key
          ? prev.sortDir === "asc"
            ? "desc"
            : "asc"
          : "asc",
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setCountryFilter(EMPTY_FILTER);
    setCityFilter(EMPTY_FILTER);
    setHotelFilter(EMPTY_FILTER);
    setCategoryFilter(EMPTY_FILTER);
    setSearchQuery("");
  }, []);

  const clearCountryFromUrl = useCallback(() => {
    setCountryFilter(EMPTY_FILTER);
    router.replace("/crm");
  }, [router]);

  const countryDisplayName = useMemo(() => {
    if (!iso3Param) return null;
    const iso3 = decodeURIComponent(iso3Param).trim().toUpperCase();
    const names = [
      ...new Set(
        data.hotels
          .filter((h) => (h.iso3 ?? "").trim().toUpperCase() === iso3)
          .map((h) => h.country)
          .filter((c): c is string => Boolean(c))
      ),
    ].sort();
    return names.length > 0 ? names.join(", ") : null;
  }, [iso3Param]);

  const listHeight = 560;
  const itemData = useMemo(
    () => ({ list: sortedEnriched, visibleColumns }),
    [sortedEnriched, visibleColumns]
  );

  const hasActiveFilters =
    countryFilter.set.size > 0 ||
    cityFilter.set.size > 0 ||
    hotelFilter.set.size > 0 ||
    categoryFilter.set.size > 0 ||
    searchQuery.trim().length > 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-section-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-display-sm text-primary">CRM</h1>
              <p className="mt-2 text-body text-primary-muted">
                <span className="italic text-accent">Employees</span> — Sales &
                Groups Directory
              </p>
            </div>
            <button
              type="button"
              className="lg:hidden rounded-md border border-border bg-background-elevated px-3 py-2 text-body-sm text-primary hover:bg-background-surface transition-colors"
              onClick={() => setSidebarOpen((o) => !o)}
            >
              {sidebarOpen ? "Hide filters" : "Filters"}
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar filters */}
          <aside
            className={`w-full shrink-0 lg:w-[260px] ${
              sidebarOpen ? "block" : "hidden lg:block"
            }`}
          >
            <div className="sticky top-6 space-y-5 rounded-md border border-border bg-background-surface/30 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-h3 text-primary">Filters</h3>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="text-[11px] text-accent hover:text-accent/80 transition-colors"
                    onClick={clearFilters}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div>
                <span className="font-mono text-stat-label text-primary-muted uppercase block mb-1.5">
                  Search
                </span>
                <div className="relative">
                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-muted/50"
                    fill="none"
                    viewBox="0 0 16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="6.5" cy="6.5" r="5.5" />
                    <path d="M10.5 10.5L15 15" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    className="w-full rounded-sm border border-border bg-background pl-8 pr-2.5 py-1.5 text-body-sm text-primary placeholder:text-primary-muted/50 outline-none focus:border-accent/40 transition-colors"
                    placeholder="Name or email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Country */}
              <FilterCheckboxList
                label="Country"
                options={countryOptions.map((c) => ({ value: c, label: c }))}
                selected={countryFilter.set}
                onChange={(next) =>
                  setCountryFilter({ set: next, key: filterKeyFromSet(next) })
                }
              />

              {/* City */}
              <FilterCheckboxList
                label="City"
                options={cityOptions.map((c) => ({ value: c, label: c }))}
                selected={cityFilter.set}
                onChange={(next) =>
                  setCityFilter({ set: next, key: filterKeyFromSet(next) })
                }
              />

              {/* Hotel */}
              <FilterCheckboxList
                label="Hotel"
                options={hotelOptions.map((h) => ({
                  value: h.id,
                  label: h.name,
                }))}
                selected={hotelFilter.set}
                onChange={(next) =>
                  setHotelFilter({ set: next, key: filterKeyFromSet(next) })
                }
              />

              {/* Category */}
              <div>
                <span className="font-mono text-stat-label text-primary-muted uppercase block mb-1.5">
                  Category
                </span>
                <div className="flex gap-2">
                  {(["Sales", "Groups"] as const).map((cat) => {
                    const active = categoryFilter.set.has(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`flex-1 rounded-sm border px-3 py-1.5 text-body-sm transition-all ${
                          active
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-background text-primary-muted hover:border-border-strong hover:text-primary"
                        }`}
                        onClick={() => {
                          const next = toggleSet(categoryFilter.set, cat);
                          setCategoryFilter({
                            set: next,
                            key: filterKeyFromSet(next),
                          });
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Main table area */}
          <div className="min-w-0 flex-1">
            {countryDisplayName && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-accent/20 bg-accent/5 px-4 py-2.5 text-body-sm">
                <span className="text-primary-muted">Filtered by map:</span>
                <span className="font-medium text-accent">
                  {countryDisplayName}
                </span>
                <button
                  type="button"
                  className="ml-auto rounded-sm border border-border px-2 py-0.5 text-caption text-primary-muted hover:bg-background-elevated hover:text-primary transition-colors"
                  onClick={clearCountryFromUrl}
                >
                  Clear
                </button>
              </div>
            )}

            <div className="overflow-hidden rounded-md border border-border">
              {/* Table toolbar */}
              <div className="flex items-center justify-between border-b border-border bg-background-elevated px-5 py-3.5">
                <h2 className="font-serif text-h3 text-primary">Employees</h2>
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-sm border border-border bg-background-surface px-3 py-1.5 text-body-sm text-primary-muted hover:text-primary hover:border-border-strong transition-colors"
                    onClick={() => setColumnsDropdownOpen((o) => !o)}
                    aria-expanded={columnsDropdownOpen}
                    aria-haspopup="true"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="2" y="2" width="4" height="12" rx="1" />
                      <rect x="10" y="2" width="4" height="12" rx="1" />
                    </svg>
                    Columns
                  </button>
                  {columnsDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        aria-hidden
                        onClick={() => setColumnsDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[180px] rounded-md border border-border bg-background-elevated py-1.5 shadow-lg shadow-black/30">
                        {COLUMN_IDS.map((id) => (
                          <button
                            key={id}
                            type="button"
                            className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-left text-body-sm text-primary hover:bg-background-surface/60 transition-colors border-0 bg-transparent"
                            onClick={() =>
                              setColumnVisibility((prev) => ({
                                ...prev,
                                [id]: !prev[id],
                              }))
                            }
                          >
                            <span
                              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-all ${
                                columnVisibility[id]
                                  ? "border-accent bg-accent text-[#0a0a0a]"
                                  : "border-border-strong bg-transparent"
                              }`}
                            >
                              {columnVisibility[id] && (
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 10 10"
                                  fill="none"
                                >
                                  <path
                                    d="M2 5.5L4 7.5L8 3"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            {COLUMN_LABELS[id]}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Table header + body */}
              <div className="flex flex-col">
                <div
                  className="flex w-full border-b-2 border-border"
                  role="row"
                  style={{ background: "var(--table-header-bg)" }}
                >
                  {visibleColumns.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className="flex items-center gap-1 px-4 py-3 text-left font-mono uppercase text-primary-muted hover:text-primary cursor-pointer border-0 bg-transparent transition-colors overflow-hidden"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.15em",
                        flex: `${COLUMN_WIDTHS[id]} 1 0`,
                        minWidth: 0,
                      }}
                      onClick={() => handleHeaderClick(id)}
                    >
                      <span className="truncate">{COLUMN_LABELS[id]}</span>
                      {sortKey === id && (
                        <span className="text-accent shrink-0">
                          {sortDir === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <List<RowPropsData>
                  rowComponent={Row}
                  rowCount={sortedEnriched.length}
                  rowHeight={ROW_HEIGHT}
                  rowProps={itemData}
                  overscanCount={10}
                  style={{ height: listHeight, overflowX: "hidden", overflowY: "auto" }}
                />
              </div>

              {/* Table footer */}
              <footer className="flex items-center justify-between border-t-2 border-border px-5 py-2.5 font-mono text-stat-label text-primary-muted">
                <span>
                  {sortedEnriched.length === 0
                    ? "No results"
                    : `${sortedEnriched.length.toLocaleString()} rows`}
                </span>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CrmPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background flex items-center justify-center">
          <span className="text-primary-muted">Loading…</span>
        </main>
      }
    >
      <CrmPageContent />
    </Suspense>
  );
}

type RowPropsData = Omit<RowComponentProps, "index" | "style" | "ariaAttributes">;

interface RowComponentProps {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  list: EnrichedEmployee[];
  visibleColumns: readonly ColumnId[];
}

function Row({
  index,
  style,
  ariaAttributes,
  list,
  visibleColumns,
}: RowComponentProps) {
  const row = list[index];
  const { employee, hotelName, city, country } = row;
  const isEven = index % 2 === 0;

  return (
    <div
      className={`flex items-center border-b border-border transition-colors ${
        isEven
          ? "bg-background hover:bg-background-surface/30"
          : "bg-background-surface/15 hover:bg-background-surface/30"
      }`}
      style={style}
      role="row"
      aria-posinset={ariaAttributes["aria-posinset"]}
      aria-setsize={ariaAttributes["aria-setsize"]}
    >
      {visibleColumns.map((id) => (
        <div
          key={id}
          className="overflow-hidden text-ellipsis whitespace-nowrap px-4 py-2 text-body-sm text-primary"
          style={{ flex: `${COLUMN_WIDTHS[id]} 1 0`, minWidth: 0 }}
          role="gridcell"
        >
          {id === "firstName" && employee.firstName}
          {id === "lastName" && employee.lastName}
          {id === "hotel" && hotelName}
          {id === "city" && city}
          {id === "country" && country}
          {id === "role" && employee.role}
          {id === "category" && (
            <span
              className={`inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
                employee.category === "Sales"
                  ? "bg-accent/10 text-accent"
                  : "bg-primary/10 text-primary-muted"
              }`}
            >
              {employee.category}
            </span>
          )}
          {id === "email" && (
            <button
              type="button"
              className="text-primary-muted hover:text-accent transition-colors cursor-pointer border-0 bg-transparent p-0 text-left text-body-sm"
              title="Click to copy"
              onClick={() => navigator.clipboard.writeText(employee.email)}
            >
              {employee.email}
            </button>
          )}
          {id === "companyLinkedin" && employee.companyLinkedin && (
            <a
              href={employee.companyLinkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 transition-colors"
              title={employee.companyLinkedin}
            >
              Company
            </a>
          )}
          {id === "personLinkedin" && employee.personLinkedin && (
            <a
              href={employee.personLinkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 transition-colors"
              title={employee.personLinkedin}
            >
              Profile
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
