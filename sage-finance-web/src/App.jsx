import React, { useState, useEffect } from 'react';
import { transactionApi } from './api';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  LogOut,
  BarChart3,
  List as ListIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

function App() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'list', 'form'

  // Login simples para demonstração (deve ser expandido)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // No seu app original, você usa biometria/DataStore.
      // Aqui faremos um login via API.
      const response = await transactionApi.loginUser(email, password);
      if (response && response.status === 'success') {
        setUser({ email });
        fetchTransactions(email);
      } else {
        alert('Falha no login');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao conectar com a AWS');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (userEmail) => {
    setLoading(true);
    try {
      const data = await transactionApi.getTransactions(userEmail);
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-sage-600 p-4 rounded-full mb-4">
              <span className="text-4xl">🦉</span>
            </div>
            <h1 className="text-2xl font-bold text-sage-800">SAGE Finance Web</h1>
            <p className="text-gray-500">Sua sabedoria financeira no navegador</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage-600 text-white p-3 rounded-lg font-semibold hover:bg-sage-700 transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalIn = transactions
    .filter(t => t.type === 'Receita')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOut = transactions
    .filter(t => t.type === 'Despesa')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIn - totalOut;

  return (
    <div className="min-h-screen bg-sage-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦉</span>
            <span className="font-bold text-sage-800 text-xl">SAGE Finance</span>
          </div>
          <button onClick={() => setUser(null)} className="text-gray-500 hover:text-red-500 transition">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span>Entradas</span>
              <TrendingUp size={20} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">R$ {totalIn.toLocaleString('pt-BR')}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-red-500">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span>Saídas</span>
              <TrendingDown size={20} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">R$ {totalOut.toLocaleString('pt-BR')}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-sage-500">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span>Saldo</span>
              <Wallet size={20} className="text-sage-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">R$ {balance.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* Gráfico Simples */}
        <div className="bg-white p-6 rounded-2xl shadow-sm h-80">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Fluxo de Caixa</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Entradas', value: totalIn, color: '#10b981' },
              { name: 'Saídas', value: totalOut, color: '#ef4444' }
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                { [0, 1].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de Transações */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Últimas Transações</h2>
            <button className="text-sage-600 font-semibold text-sm">Ver todas</button>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.slice(0, 5).map((t, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${t.type === 'Receita' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {t.type === 'Receita' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{t.description}</p>
                    <p className="text-xs text-gray-400">{t.category} • {t.date}</p>
                  </div>
                </div>
                <p className={`font-bold ${t.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'Receita' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="p-8 text-center text-gray-400">Nenhuma transação encontrada.</p>
            )}
          </div>
        </div>
      </main>

      {/* Navegação Mobile-Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-2 flex justify-around items-center md:hidden">
        <button className="p-2 text-sage-600"><BarChart3 size={24} /></button>
        <button className="bg-sage-600 text-white p-3 rounded-full -mt-8 shadow-lg"><PlusCircle size={28} /></button>
        <button className="p-2 text-gray-400"><ListIcon size={24} /></button>
      </nav>
    </div>
  );
}

export default App;
