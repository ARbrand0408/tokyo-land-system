// Backend API response shapes (mirrors Prisma models in backend/prisma/schema.prisma).

export type CustomerStatus = '商談中' | '内見予定' | '契約準備' | '成約' | '保留';

export type Customer = {
  id: string;
  code: string;
  name: string;
  nameKana: string;
  phone: string | null;
  email: string | null;
  assignedTo: string;
  status: CustomerStatus;
  desiredArea: string | null;
  desiredRooms: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  notes: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PropertyStatus = '公開中' | '商談中' | '成約済' | '非公開' | '準備中';
export type PropertyType = '新築マンション' | '中古マンション' | '一戸建て' | '土地' | '投資用';

export type Property = {
  id: string;
  code: string;
  name: string;
  area: string;
  address: string;
  type: PropertyType;
  rooms: string;
  sizeSqm: number;
  rent: number | null;
  price: number | null;
  builtYear: number | null;
  vacancy: string;
  status: PropertyStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListResponse<T> = {
  data: T[];
  count: number;
};

export type ItemResponse<T> = {
  data: T;
};

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

export type ProposalItem = {
  id: string;
  proposalId: string;
  propertyId: string;
  property: Property;
  propertyImageUrl: string | null;
  floorPlanUrl: string | null;
  comment: string | null;
  order: number;
};

export type ProposalItemInput = {
  propertyId: string;
  propertyImageUrl?: string | null;
  floorPlanUrl?: string | null;
  comment?: string | null;
};

export type Proposal = {
  id: string;
  slug: string;
  pin: string; // 発行直後のレスポンスにのみ含まれる
  customerId: string;
  customer: Pick<Customer, 'id' | 'code' | 'name'>;
  title: string | null;
  message: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ProposalItem[];
};

export type PublicProposal = Omit<Proposal, 'pin'> & {
  customer: { name: string; nameKana: string };
};

export type CreateProposalInput = {
  customerId: string;
  title?: string;
  message?: string;
  items: ProposalItemInput[];
};
