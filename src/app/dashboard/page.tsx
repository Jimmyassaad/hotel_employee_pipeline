"use client";

import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import crmData from "@/data/data.json";
import { buildAggregations } from "@/lib/aggregations";
import { formatNumber, formatPercent } from "@/lib/format";
import type { CrmData, Hotel } from "@/lib/types";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CountryBarChart } from "@/components/charts/CountryBarChart";
import { CategoryDonutChart, type CategoryChartRow } from "@/components/charts/CategoryDonutChart";
import {
  TopHotelsChart,
  type TopHotelRow,
} from "@/components/charts/TopHotelsChart";

import { CountryMap3D } from "@/components/map/CountryMap3D";

const data = crmData as CrmData;

const COUNTRY_CHART_LIMIT = 15;

const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "overview", label: "Overview" },
  { id: "countries", label: "Countries" },
  { id: "breakdown", label: "Breakdown" },
  { id: "map", label: "Map" },
] as const;

function useAggregations() {
  return useMemo(() => buildAggregations(data), []);
}

function useHotelByIdMap(): Map<string, Hotel> {
  return useMemo(() => new Map(data.hotels.map((h) => [h.id, h])), []);
}

function useCountryChartData() {
  const agg = useAggregations();
  return useMemo(() => {
    const entries = Object.entries(agg.byCountry)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
    if (entries.length <= COUNTRY_CHART_LIMIT) {
      return entries;
    }
    const top = entries.slice(0, COUNTRY_CHART_LIMIT);
    const otherCount = entries
      .slice(COUNTRY_CHART_LIMIT)
      .reduce((sum, e) => sum + e.count, 0);
    return [...top, { country: "Other", count: otherCount }];
  }, [agg.byCountry]);
}

function useSalesGroupsPercentages() {
  const agg = useAggregations();
  return useMemo(() => {
    const total = agg.totals.sales + agg.totals.groups;
    if (total === 0) {
      return { salesPct: 0, groupsPct: 0 };
    }
    return {
      salesPct: agg.totals.sales / total,
      groupsPct: agg.totals.groups / total,
    };
  }, [agg.totals.sales, agg.totals.groups]);
}

function useSalesVsGroupsDisplay() {
  const agg = useAggregations();
  const pct = useSalesGroupsPercentages();
  return useMemo(
    () => ({
      sales: formatNumber(agg.totals.sales),
      groups: formatNumber(agg.totals.groups),
      salesPct: formatPercent(pct.salesPct),
      groupsPct: formatPercent(pct.groupsPct),
    }),
    [agg.totals.sales, agg.totals.groups, pct.salesPct, pct.groupsPct]
  );
}

function useCategoryChartData(
  hotelById: Map<string, Hotel>
): CategoryChartRow[] {
  return useMemo(() => {
    const cityMap: Record<string, Record<string, number>> = {
      Sales: {},
      Groups: {},
    };

    for (const e of data.employees) {
      const cat = e.category;
      if (cat !== "Sales" && cat !== "Groups") continue;
      const hotel = hotelById.get(e.hotelId);
      const city = hotel?.city ?? "Unknown";
      cityMap[cat][city] = (cityMap[cat][city] ?? 0) + 1;
    }

    function topCities(map: Record<string, number>): { city: string; count: number }[] {
      return Object.entries(map)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    }

    return [
      {
        name: "Sales",
        value: Object.values(cityMap.Sales).reduce((a, b) => a + b, 0),
        cities: topCities(cityMap.Sales),
      },
      {
        name: "Groups",
        value: Object.values(cityMap.Groups).reduce((a, b) => a + b, 0),
        cities: topCities(cityMap.Groups),
      },
    ];
  }, [hotelById]);
}

function useTopHotelsData(
  limit: number,
  hotelById: Map<string, Hotel>
): TopHotelRow[] {
  const agg = useAggregations();
  return useMemo(() => {
    return Object.entries(agg.byHotel)
      .map(([hotelId, count]) => ({
        name: hotelById.get(hotelId)?.name ?? hotelId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }, [agg.byHotel, hotelById, limit]);
}

export interface CityMapEntry {
  city: string;
  country: string;
  iso3: string;
  total: number;
  sales: number;
  groups: number;
  lng: number;
  lat: number;
}

const CITY_COORDS: Record<string, [number, number]> = {
  London: [-0.1276, 51.5074],
  Dubai: [55.2708, 25.2048],
  "New York": [-74.006, 40.7128],
  Paris: [2.3522, 48.8566],
  Amsterdam: [4.9041, 52.3676],
  "Las Vegas": [-115.1398, 36.1699],
  Madrid: [-3.7038, 40.4168],
  Melbourne: [144.9631, -37.8136],
};

function useCityMapData(hotelById: Map<string, Hotel>): CityMapEntry[] {
  return useMemo(() => {
    const cityData: Record<string, { country: string; iso3: string; sales: number; groups: number }> = {};

    for (const e of data.employees) {
      const hotel = hotelById.get(e.hotelId);
      if (!hotel) continue;
      const city = hotel.city;
      if (!cityData[city]) {
        cityData[city] = { country: hotel.country, iso3: hotel.iso3, sales: 0, groups: 0 };
      }
      if (e.category === "Sales") cityData[city].sales++;
      else if (e.category === "Groups") cityData[city].groups++;
    }

    return Object.entries(cityData).map(([city, d]) => ({
      city,
      country: d.country,
      iso3: d.iso3,
      total: d.sales + d.groups,
      sales: d.sales,
      groups: d.groups,
      lng: CITY_COORDS[city]?.[0] ?? 0,
      lat: CITY_COORDS[city]?.[1] ?? 0,
    }));
  }, [hotelById]);
}

function useActiveSection(scrollRef: React.RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const sections = container.querySelectorAll<HTMLElement>("[data-section]");
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          const idx = Number(entry.target.getAttribute("data-section-index"));
          if (isNaN(idx)) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { index: idx, ratio: entry.intersectionRatio };
          }
        }
        if (best && best.ratio > 0.4) {
          setActive(best.index);
        }
      },
      {
        root: container,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [scrollRef]);

  return active;
}

function ScrollDots({
  count,
  active,
  labels,
  onDotClick,
}: {
  count: number;
  active: number;
  labels: string[];
  onDotClick: (index: number) => void;
}) {
  return (
    <nav
      className="fixed top-1/2 -translate-y-1/2 z-50 flex-col items-center hidden sm:flex"
      style={{ right: "var(--dot-offset-right)", gap: "var(--dot-gap)" }}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onDotClick(i)}
          className="group relative flex items-center justify-center"
          style={{ width: "44px", height: "44px" }}
          aria-label={`Go to ${labels[i]}`}
        >
          <span
            className="absolute right-8 whitespace-nowrap bg-background-elevated border border-border px-2 py-1 text-primary opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-mono"
            style={{ fontSize: "var(--dot-tooltip-size, 10px)" }}
          >
            {labels[i]}
          </span>
          <span
            className={`block rounded-full transition-all duration-300 ${
              i === active
                ? "bg-accent"
                : "bg-transparent hover:border-primary-muted"
            }`}
            style={{
              width: "var(--dot-size)",
              height: "var(--dot-size)",
              borderWidth: "var(--dot-border)",
              borderStyle: "solid",
              borderColor: i === active ? "var(--cyan-accent)" : "var(--rule-grey)",
              boxShadow: i === active ? `0 0 var(--dot-glow-spread) var(--cyan-glow)` : "none",
            }}
          />
        </button>
      ))}
    </nav>
  );
}

export default function DashboardPage() {
  const agg = useAggregations();
  const hotelById = useHotelByIdMap();
  const countryChartData = useCountryChartData();
  const categoryChartData = useCategoryChartData(hotelById);
  const topHotels = useTopHotelsData(10, hotelById);
  const salesVsGroupsDisplay = useSalesVsGroupsDisplay();
  const cityMapData = useCityMapData(hotelById);

  const scrollRef = useRef<HTMLElement>(null);
  const activeSection = useActiveSection(scrollRef);

  const scrollToSection = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const section = container.querySelector<HTMLElement>(
      `[data-section-index="${index}"]`
    );
    section?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      <ScrollDots
        count={SECTIONS.length}
        active={activeSection}
        labels={SECTIONS.map((s) => s.label)}
        onDotClick={scrollToSection}
      />

      <main
        ref={scrollRef}
        className="h-[100dvh] overflow-y-auto snap-y snap-mandatory"
      >
        {/* Section 0: Hero / Title */}
        <section
          data-section
          data-section-index={0}
          className="relative min-h-[100dvh] snap-start flex items-center justify-center py-16 px-4"
        >
          <div className="flex flex-col items-center text-center">
            <p className="font-mono text-section-label uppercase tracking-widest text-primary-muted mb-4 sm:mb-6 text-[10px] sm:text-xs">
              Sales &amp; Groups CRM
            </p>
            <h1 className="font-serif text-3xl sm:text-display text-primary leading-tight">
              Hotel Employee Pipeline
            </h1>
            <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <button
                type="button"
                onClick={() => scrollToSection(1)}
                className="border border-accent bg-accent/10 px-6 sm:px-8 py-3 font-mono text-body-sm uppercase tracking-wider text-accent transition-colors duration-hover hover:bg-accent/20 min-w-[130px]"
              >
                Dashboard
              </button>
              <Link
                href="/crm"
                className="border border-border px-6 sm:px-8 py-3 font-mono text-body-sm uppercase tracking-wider text-primary-muted transition-colors duration-hover hover:border-primary-muted hover:text-primary min-w-[130px] text-center"
              >
                CRM
              </Link>
            </div>
          </div>

          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary-muted/40 animate-bounce">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M10 4v12M5 11l5 5 5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </section>

        {/* Section 1: Overview / KPIs */}
        <section
          data-section
          data-section-index={1}
          className="relative min-h-[100dvh] snap-start flex items-center py-12 sm:py-16"
        >
          <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
            <header className="mb-8 sm:mb-12 lg:mb-16">
              <h1 className="font-serif text-2xl sm:text-display text-primary">
                Dashboard
              </h1>
              <p className="mt-2 sm:mt-3 text-body text-primary-muted">
                Sales & Groups CRM{" "}
                <span className="italic text-accent">Overview</span>
              </p>
            </header>

            <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
              <KpiCard
                label="Total Employees"
                value={formatNumber(agg.totals.employees)}
              />
              <KpiCard
                label="Total Hotels"
                value={formatNumber(agg.totals.hotels)}
              />
              <KpiCard
                label="Countries Covered"
                value={formatNumber(agg.totals.countries)}
              />
              <div className="border-b-2 border-border pb-6">
                <p className="font-mono text-stat-label text-primary-muted uppercase">
                  Sales vs Groups
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-serif text-kpi text-accent">{salesVsGroupsDisplay.sales}</span>
                    <span className="font-mono text-body-sm text-primary-muted">Sales <span className="text-accent/60">{salesVsGroupsDisplay.salesPct}</span></span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-serif text-kpi text-primary">{salesVsGroupsDisplay.groups}</span>
                    <span className="font-mono text-body-sm text-primary-muted">Groups <span className="text-primary-muted/60">{salesVsGroupsDisplay.groupsPct}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Country Analysis */}
        <section
          data-section
          data-section-index={2}
          className="min-h-[100dvh] snap-start flex items-center py-12 sm:py-16"
        >
          <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title={
                <>
                  <span className="italic text-accent">Analysis</span> —
                  Employees per Country
                </>
              }
              description="Headcount by country"
            />
            <div className="h-[55vh] sm:h-[calc(100dvh-220px)] max-h-[600px]">
              <CountryBarChart data={countryChartData} />
            </div>
          </div>
        </section>

        {/* Section 3: Category Breakdown */}
        <section
          data-section
          data-section-index={3}
          className="min-h-[100dvh] snap-start flex items-center py-12 sm:py-16"
        >
          <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <SectionHeader
                  title="Sales vs Groups"
                  description="Category split"
                />
                <div className="h-[40vh] sm:h-[calc(50dvh-120px)] max-h-[500px] min-h-[260px]">
                  <CategoryDonutChart data={categoryChartData} />
                </div>
              </div>
              <div>
                <SectionHeader
                  title="Top 10 Hotels"
                  description="Highest headcount"
                />
                <div className="h-[40vh] sm:h-[calc(50dvh-120px)] max-h-[500px] min-h-[260px]">
                  <TopHotelsChart data={topHotels} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: City Bubble Map */}
        <section
          data-section
          data-section-index={4}
          className="min-h-[100dvh] snap-start flex items-center py-12 sm:py-16"
        >
          <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden border border-border">
              <div className="px-4 sm:px-5 pt-4 sm:pt-5">
                <SectionHeader
                  title="Global Employee Distribution"
                  description="Employees by city"
                />
              </div>
              <div className="h-[55vh] sm:h-[calc(100dvh-240px)] max-h-[600px] min-h-[280px]">
                <CountryMap3D cities={cityMapData} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
