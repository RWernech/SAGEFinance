import axios from 'axios';

const API_BASE_URL = 'https://uqnedctqy444gt6kwb6a2cwahy0dlofz.lambda-url.sa-east-1.on.aws/';
const API_KEY = 'SAGE-FINANCE-7B9A2C4D-8E5F-4A1B-9C3D-6E2F8A0B1C3D';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

export const transactionApi = {
  getTransactions: (email) => api.get(`/?userEmail=${email}`).then(res => res.data),
  saveTransaction: (transaction) => api.post('/', transaction),
  deleteTransaction: (id) => api.delete(`/?id=${id}`),
  registerUser: (user) => api.post('/', { ...user, type: 'register' }), // Note: backend usually differentiates by fields or a type field
  loginUser: (email, password) => api.post('/', { email, password, type: 'login' }).then(res => res.data),
};

export default api;
