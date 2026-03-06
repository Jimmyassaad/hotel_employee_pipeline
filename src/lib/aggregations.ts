/**
 * Aggregations over CRM data: counts by country, city, hotel, category, iso3.
 */

import type { CrmData, Employee, EmployeeCategory } from "./types";

export interface CountByKey {
  [key: string]: number;
}

export interface AggregationTotals {
  employees: number;
  hotels: number;
  countries: number;
  sales: number;
  groups: number;
}

export interface Aggregations {
  totals: AggregationTotals;
  byCountry: CountByKey;
  byCity: CountByKey;
  byHotel: CountByKey;
  byCategory: Record<EmployeeCategory, number>;
  byIso3: CountByKey;
  byIso3HotelCount: CountByKey;
}

function countBy(employees: Employee[], keyFn: (e: Employee) => string): CountByKey {
  const map: CountByKey = {};
  for (const e of employees) {
    const k = keyFn(e);
    map[k] = (map[k] ?? 0) + 1;
  }
  return map;
}

/**
 * Build all aggregations from CRM data.
 * Requires employees to be joined with hotel data for country/city/iso3;
 * pass a getHotel lookup so we can resolve hotelId → Hotel.
 */
export function buildAggregations(
  data: CrmData
): Aggregations {
  const hotelById = new Map(data.hotels.map((h) => [h.id, h]));

  const byHotel = countBy(data.employees, (e) => e.hotelId);

  const byCategory: Record<EmployeeCategory, number> = {
    Sales: 0,
    Groups: 0,
  };
  for (const e of data.employees) {
    if (e.category === "Sales" || e.category === "Groups") {
      byCategory[e.category]++;
    }
  }

  const byCountry: CountByKey = {};
  const byCity: CountByKey = {};
  const byIso3: CountByKey = {};
  const byIso3HotelCount: CountByKey = {};
  for (const e of data.employees) {
    const hotel = hotelById.get(e.hotelId);
    if (hotel) {
      byCountry[hotel.country] = (byCountry[hotel.country] ?? 0) + 1;
      byCity[hotel.city] = (byCity[hotel.city] ?? 0) + 1;
      byIso3[hotel.iso3] = (byIso3[hotel.iso3] ?? 0) + 1;
    }
  }
  for (const h of data.hotels) {
    const iso3 = h.iso3?.trim() || "";
    if (iso3) {
      byIso3HotelCount[iso3] = (byIso3HotelCount[iso3] ?? 0) + 1;
    }
  }

  const sales = byCategory.Sales;
  const groups = byCategory.Groups;

  const totals: AggregationTotals = {
    employees: data.employees.length,
    hotels: data.hotels.length,
    countries: Object.keys(byCountry).length,
    sales,
    groups,
  };

  return {
    totals,
    byCountry,
    byCity,
    byHotel,
    byCategory,
    byIso3,
    byIso3HotelCount,
  };
}
