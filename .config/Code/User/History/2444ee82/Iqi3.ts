import {
  AddDheetoResponse,
  AddItemBody,
  AddItemResponse,
  AddPersonResponse,
  AddTransactionBody,
  AddTransactionResponse,
  CreateDheetoBody,
  CreatePersonBody,
  DeleteDheetoResponse,
  DeleteItemResponse,
  DeletePersonResponse,
  DeleteTransactionResponse,
  GetAllDheetosQuery,
  GetAllDheetosResponse,
  GetAllPersonsQuery,
  GetAllPersonsResponse,
  GetDheetoResponse,
  GetItemsByDheetoIdResponse,
  GetPersonResponse,
  GetTransactionsByDheetoIdResponse,
  SearchDheetosQuery,
  SearchDheetosResponse,
  SearchPersonQuery,
  SearchPersonResponse,
  UpdateDheetoBody,
  UpdateDheetoResponse,
  UpdateItemBody,
  UpdateItemResponse,
  UpdatePersonBody,
  UpdatePersonResponse,
  UpdateTransactionBody,
  UpdateTransactionResponse,
} from '../types';


import axios, { AxiosInstance } from "axios";


export const api: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SERVER_IP,
  // baseURL: "http://192.168.254.168:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);



// ------------------Persons------------------------

export const createPerson = async (data: CreatePersonBody): Promise<AddPersonResponse> => {
  const response = await api.post('/add-person', data);
  return response.data;
};

export const fetchAllPersons = async (
  params?: Partial<GetAllPersonsQuery>
): Promise<GetAllPersonsResponse> => {
  const response = await api.get('/all-person', { params: params || {} });
  return response.data;
};

export const searchPersons = async (
  searchParams: Partial<SearchPersonQuery>
): Promise<SearchPersonResponse> => {
  const response = await api.get('/search-person', { params: searchParams});
  return response.data;
};

export const fetchPersonById = async (person_id: string): Promise<GetPersonResponse> => {
  const response = await api.get(`/person/${person_id}`);
  return response.data;
};

export const updatePerson = async (
  id: string,
  data: UpdatePersonBody
): Promise<UpdatePersonResponse> => {
  const response = await api.put(`/person/${id}`, data);
  return response.data;
};

export const deletePerson = async (id: string): Promise<DeletePersonResponse> => {
  const response = await api.delete(`/person/${id}`);
  return response.data;
};


// --------------Dheetos ---------------------------------

export const createDheeto = async (data: CreateDheetoBody): Promise<AddDheetoResponse> => {
  const res = await api.post('/add-dheeto', data);
  return res.data;
};

export const getDheetoById = async (id: string): Promise<GetDheetoResponse> => {
  const res = await api.get(`/dheeto/${id}`);
  return res.data;
};

export const getAllDheetos = async (query: GetAllDheetosQuery): Promise<GetAllDheetosResponse> => {
  const res = await api.get('/all-dheetos', { params: query });
  return res.data;
};

export const searchDheetos = async (query: SearchDheetosQuery): Promise<SearchDheetosResponse> => {
  const res = await api.get('/search-dheetos', { params: query });
  return res.data;
};

export const updateDheeto = async (
  id: string,
  data: UpdateDheetoBody
): Promise<UpdateDheetoResponse> => {
  const res = await api.put(`/dheeto/${id}`, data);
  return res.data;
};

export const deleteDheeto = async (id: string): Promise<DeleteDheetoResponse> => {
  const res = await api.delete(`/dheeto/${id}`);
  return res.data;
};


// ----------------ITEMS-----------------------
export const addItem = async (dheetoId: string, data: AddItemBody): Promise<AddItemResponse> => {
  const response = await api.post(`/dheeto/${dheetoId}/add-item`, data);
  return response.data;
};

export const updateItem = async (
  dheetoId: string,
  itemId: string,
  data: UpdateItemBody
): Promise<UpdateItemResponse> => {
  const response = await api.put(`/dheeto/${dheetoId}/item/${itemId}`, data);
  return response.data;
};

export const deleteItem = async (dheetoId: string, itemId: string): Promise<DeleteItemResponse> => {
  const response = await api.delete(`/dheeto/${dheetoId}/item/${itemId}`);
  return response.data;
};

export const getItemsByDheetoId = async (
  dheetoId: string,
): Promise<GetItemsByDheetoIdResponse> => {
  const response = await api.get(`/dheeto/${dheetoId}/items`);
  return response.data;
};



// ---------------transactions -------------------------
export const addTransaction = async (
  dheetoId: string,
  data: AddTransactionBody
): Promise<AddTransactionResponse> => {
  const response = await api.post(`/dheeto/${dheetoId}/add-transaction`, data);
  return response.data;
};

export const updateTransaction = async (
  dheetoId: string,
  transactionId: string,
  data: UpdateTransactionBody
): Promise<UpdateTransactionResponse> => {
  const response = await api.put(`/dheeto/${dheetoId}/transaction/${transactionId}`, data);
  return response.data;
};

export const deleteTransaction = async (
  dheetoId: string,
  transactionId: string
): Promise<DeleteTransactionResponse> => {
  const response = await api.delete(`/dheeto/${dheetoId}/transaction/${transactionId}`);
  return response.data;
};

export const getTransactionsByDheetoId = async (
  dheetoId: string,
): Promise<GetTransactionsByDheetoIdResponse> => {
  const response = await api.get(`/dheeto/${dheetoId}/transactions`);
  return response.data;
};
