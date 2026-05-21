// Backend API response shapes (mirrors Prisma models in backend/prisma/schema.prisma).

export type Station = { line: string; station: string; walkMin: number };

export type PropertyType =
  | '賃貸マンション'
  | '賃貸戸建て'
  | '売買マンション'
  | '売買戸建て';

export type PropertyStatus = '公開' | '下書き';

export type Property = {
  id: string;
  name: string;
  propertyType: PropertyType;
  area: string;
  address: string | null;
  stations: Station[];
  highlights: string[];
  rooms: string | null;
  sizeSqm: number | null;
  terraceSqm: number | null;
  floor: number | null;
  totalFloors: number | null;
  basementFloors: number | null;
  builtYearMonth: string | null;
  structure: string | null;
  totalUnits: number | null;
  mainLight: string | null;
  availableFrom: string | null;
  rent: number | null;
  maintenanceFee: number | null;
  deposit: string | null;
  keyMoney: string | null;
  brokerFee: string | null;
  renewalFee: string | null;
  contractTerm: string | null;
  cancelNotice: string | null;
  insurance: string | null;
  guarantor: string | null;
  officeUse: string | null;
  sohoUse: string | null;
  pets: string | null;
  instruments: string | null;
  smoking: string | null;
  currentStatus: string | null;
  parking: string | null;
  parkingFee: string | null;
  description: string | null;
  facilities: string[];
  images: string[];
  floorPlanUrl: string | null;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
};

export type PropertyInput = Partial<Omit<Property, 'id' | 'createdAt' | 'updatedAt'>>;

export type Customer = {
  id: string;
  name: string;
  companyName: string | null;
  accessCode: string;
  email: string | null;
  phone: string | null;
  moveInDate: string | null;
  birthDate: string | null;
  preferences: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListItem = Customer & {
  proposalCount: number;
  sentCount: number;
};

export type CustomerInput = Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>;

export type ProposalStatus = '下書き' | '送信済み';

export type ProposalItem = {
  id: string;
  proposalId: string;
  propertyId: string;
  property: Property;
  order: number;
};

export type Proposal = {
  id: string;
  slug: string;
  customerId: string;
  customer: { id: string; name: string; companyName: string | null; accessCode: string };
  title: string | null;
  message: string | null;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  items: ProposalItem[];
};

export type CustomerDetail = Customer & {
  proposals: Array<Proposal>;
};

export type ProposalInput = {
  customerId: string;
  title?: string | null;
  message?: string | null;
  status?: ProposalStatus;
  propertyIds: string[];
};

export type PublicProposal = {
  id: string;
  slug: string;
  title: string | null;
  message: string | null;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; companyName: string | null };
  items: ProposalItem[];
};

export type PublicProposalMeta = {
  slug: string;
  customerName: string;
  companyName: string | null;
};

export type ListResponse<T> = { data: T[]; count: number };
export type ItemResponse<T> = { data: T };

export type UploadKind = 'property_image' | 'floor_plan';

export type UploadedAsset = {
  id: string;
  url: string;
  kind: UploadKind;
  fileName: string;
  contentType: string;
  size: number;
  storage: 's3-mock';
  uploadedAt: string;
};
