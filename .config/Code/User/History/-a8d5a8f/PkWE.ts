export interface Person {
  id: string;
  name: string;
  phoneNo?: string ;
  desc?: string ;
  createdAt: Date;
  totalBalance: number;
  totalGold: number;
  totalSilver: number;
  totalDheetosCount: number;
  unsettledDheetosCount: number;
}

export interface Dheeto {
  id: string;
  personId: string;
  isSettled: boolean;
  createdAt: Date;
  updatedAt: Date;
  dheetoBalance: number;
  desc?: string;
}

export interface Item {
  id: string;
  dheetoId: string;
  name: string;
  type: "gold" | "silver";
  purity: number;
  weightInTola: number;
  createdAt: Date;
  isSettled: boolean;
  settledAt?: Date ;
  desc?: string ;
}

export interface Transaction {
  id: string;
  dheetoId: string;
  type: "gave" | "received";
  amount: number;
  createdAt: Date;
  desc?: string;
}

// --------- Api Types -------------
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface SuccessMessageResponse {
  success: true;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// --------------Dheeto types------------
export interface CreateDheetoBody {
  personId: string;
  desc?: string;
  initialItems?: Omit<Item, "id" | "createdAt" | "settledAt">[];
  initialTransactions?: Omit<Transaction, "id" | "createdAt">[];
}
export interface UpdateDheetoBody {
  desc?: string;
  isSettled?: boolean;
}
export interface DheetoIdParams {
  id: string;
}
export interface GetAllDheetosQuery {
  personId?: string;
  isSettled?: "true" | "false" | "all";
  page?:number;
  limit?:number;
  sortBy?: "createdAt" | "updatedAt";
  order?: "asc" | "desc";
}
export interface SearchDheetosQuery {
  personId?: string;
  isSettled?: "true" | "false" | "all";
  createdAfter?: string;
  createdBefore?: string;
  desc?: string;
  page?:number;
  limit?:number;
}
export type AddDheetoResponse = SuccessResponse<Dheeto> | ErrorResponse;
export type UpdateDheetoResponse = SuccessResponse<Dheeto> | ErrorResponse;
export type GetDheetoResponse = SuccessResponse<Dheeto> | ErrorResponse;
export type DeleteDheetoResponse = SuccessMessageResponse | ErrorResponse;
export type GetAllDheetosResponse = PaginatedResponse<Dheeto> | ErrorResponse;
export type SearchDheetosResponse = PaginatedResponse<Dheeto> | ErrorResponse;

export interface AddItemBody {
  name: string;
  type: "gold" | "silver";
  purity: number;
  weightInTola: number;
  desc?: string;
}
export interface UpdateItemBody {
  name?: string;
  type?: "gold" | "silver";
  purity?: number;
  weightInTola?: number;
  desc?: string;
  isSettled?: boolean;
  settledAt?: Date;
}
export interface ItemIdParams {
  dheetoId: string;
  itemId: string;
}
export type AddItemResponse = SuccessResponse<Dheeto> | ErrorResponse;
export type UpdateItemResponse = SuccessResponse<Dheeto> | ErrorResponse;
export type DeleteItemResponse = SuccessMessageResponse | ErrorResponse;

export interface CreatePersonBody {
  name: string;
  phoneNo?: string;
  desc?: string;
}
export interface UpdatePersonBody {
  name?: string;
  phoneNo?: string;
  desc?: string;
}
export interface PersonIdParams {
  id: string;
}
export interface GetAllPersonsQuery {
  page?:number;
  limit?:number;
  sortBy?: string;
  order?: string;
  includeSettled?: string;
}
export interface SearchPersonQuery {
  name?: string;
  phoneNo?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  page?:number;
  limit?:number;
}

export type AddPersonResponse = SuccessResponse<Person> | ErrorResponse;
export type UpdatePersonResponse = SuccessResponse<Person> | ErrorResponse;
export type GetPersonResponse = SuccessResponse<Person> | ErrorResponse;
export type DeletePersonResponse = SuccessMessageResponse | ErrorResponse;
export type GetAllPersonsResponse = PaginatedResponse<Person> | ErrorResponse;
export type SearchPersonResponse = PaginatedResponse<Person> | ErrorResponse;

export interface AddTransactionBody {
  type: "gave" | "received";
  amount: number;
  desc?: string;
}

export interface UpdateTransactionBody {
  type?: "gave" | "received";
  amount?: number;
  desc?: string;
}

export interface TransactionIdParams {
  dheetoId: string;
  transactionId: string;
}

export type AddTransactionResponse = SuccessResponse<Dheeto> | ErrorResponse;
export type UpdateTransactionResponse = SuccessResponse<Dheeto> | ErrorResponse;
export type DeleteTransactionResponse = SuccessMessageResponse | ErrorResponse;
export type GetTransactionsByDheetoIdResponse = PaginatedResponse<Dheeto> | ErrorResponse;
