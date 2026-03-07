import axios from 'axios';

// URL sem a barra no final
const API_BASE_URL = 'https://uqnedctqy444gt6kwb6a2cwahy0dlofz.lambda-url.sa-east-1.on.aws';
const API_KEY = 'SAGE-FINANCE-7B9A2C4D-8E5F-4A1B-9C3D-6E2F8A0B1C3D';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

export const transactionApi = {
  // Removida a barra inicial nos métodos para não duplicar com a baseURL
  getTransactions: (email) => api.get(`?userEmail=${email}`).then(res => res.data),
  saveTransaction: (transaction) => api.post('', transaction).then(res => res.data),
  deleteTransaction: (id) => api.delete(`?id=${id}`).then(res => res.data),
  loginUser: (email, password) => api.post('', { email, password }).then(res => res.data),
};

export default api;
