import axios from 'axios';

const API_BASE_URL = 'https://uqnedctqy444gt6kwb6a2cwahy0dlofz.lambda-url.sa-east-1.on.aws';
const API_KEY = 'SAGE-FINANCE-7B9A2C4D-8E5F-4A1B-9C3D-6E2F8A0B1C3D';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

// Interceptor para injetar o Token JWT automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sage_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const transactionApi = {
  // Não precisamos mais do email no GET, a Lambda descobre pelo Token
  getTransactions: () => api.get('/').then(res => res.data),

  // No POST, a Lambda também vai ignorar o email do corpo e usar o do Token
  saveTransaction: (transaction) => api.post('/', transaction).then(res => res.data),

  deleteTransaction: (id) => api.delete(`?id=${id}`).then(res => res.data),

  loginUser: (email, password) => api.post('/', { email, password }).then(res => res.data),
};

export default api;
