/**
 * CRM domain types — normalized entities.
 */

export type EmployeeCategory = "Sales" | "Groups";

export interface Hotel {
  id: string; // hmid
  name: string;
  city: string;
  country: string;
  iso3: string;
}

export interface Employee {
  id: string; // uuid
  hotelId: string; // FK → Hotel.id
  firstName: string;
  lastName: string;
  role: string;
  category: EmployeeCategory;
  email: string;
  companyLinkedin: string;
  personLinkedin: string;
  /** Precomputed for search: (firstName + " " + lastName + " " + email).toLowerCase() */
  searchIndex?: string;
}

export interface CrmData {
  hotels: Hotel[];
  employees: Employee[];
}
