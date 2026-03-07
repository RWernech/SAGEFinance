import React, { useState, useMemo, useEffect } from 'react';
import { transactionApi } from './api';
import {
  TrendingUp, TrendingDown, Wallet, Plus, LogOut, X, Trash2,
  ArrowUpRight, ArrowDownRight, Loader2, PiggyBank, Filter, Calendar
} from 'lucide-react';
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// --- ENUMS E TRADUÇÕES ---
const TRANSACTION_TYPES = { INCOME: "INCOME", EXPENSE: "EXPENSE", INVESTMENT: "INVESTMENT" };
const CATEGORIES = { BILL: "Conta", PHARMACY: "Farmácia", FINANCING: "Financiamento", LEISURE: "Lazer", TRANSPORT: "Locomoção", MAINTENANCE: "Manutenção", MARKET: "Mercado", OTHERS: "Outros", STREAMING: "Streaming", VETERINARY: "Veterinário" };
const PAYMENT_METHODS = { CREDIT: "Crédito", DEBIT: "Débito", PIX: "Pix", RECEIVED: "Recebido", TRANSFER: "Transferência", VR: "VR" };
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('sage_user')));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Filtros (Mês e Ano Atuais)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getUTCMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getUTCFullYear());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ description: '', amount: '', type: 'EXPENSE', category: 'MARKET', paymentMethod: 'DEBIT' });

  const COLORS = ['#00A86B', '#32D583', '#2E90FA', '#FDB022', '#F04438'];

  useEffect(() => {
    if (user) fetchTransactions(user.email);
  }, [user]);

  const fetchTransactions = async (userEmail) => {
    setLoading(true);
    try {
      const data = await transactionApi.getTransactions(userEmail);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await transactionApi.loginUser(email, password);
      if (response && response.status === 'success') {
        const userData = { email, name: response.name || 'Usuário' };
        setUser(userData);
        localStorage.setItem('sage_user', JSON.stringify(userData));
      } else alert('E-mail ou senha incorretos');
    } catch (e) { alert('Erro na AWS'); } finally { setLoading(false); }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      const mMatch = selectedMonth === -1 || d.getUTCMonth() === selectedMonth;
      const yMatch = d.getUTCFullYear() === selectedYear;
      return mMatch && yMatch;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === 'INCOME') acc.income += t.amount;
      else if (t.type === 'EXPENSE') acc.expense += t.amount;
      else if (t.type === 'INVESTMENT') acc.investment += t.amount;
      return acc;
    }, { income: 0, expense: 0, investment: 0 });
  }, [filteredTransactions]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const transaction = { ...formData, id: crypto.randomUUID(), userEmail: user.email, amount: parseFloat(formData.amount), date: Date.now(), isSynced: true };
      await transactionApi.saveTransaction(transaction);
      setShowModal(false);
      setFormData({ description: '', amount: '', type: 'EXPENSE', category: 'MARKET', paymentMethod: 'DEBIT' });
      fetchTransactions(user.email);
    } catch (e) { alert('Erro ao salvar'); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir?')) return;
    try {
      await transactionApi.deleteTransaction(id);
      fetchTransactions(user.email);
    } catch (e) { alert('Erro ao deletar'); }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4 font-sans text-white">
        <div className="bg-[#161B26] p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/5">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-[#00A86B] rounded-[2rem] flex items-center justify-center shadow-lg shadow-[#00A86B]/20 mb-6"><span className="text-4xl">🦉</span></div>
            <h1 className="text-3xl font-bold">SAGE Finance</h1>
            <p className="text-[#00A86B] font-bold mt-1 uppercase tracking-widest text-[10px]">Cloud Sync Enabled</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input className="w-full p-4 bg-[#0B0F19] border border-white/5 rounded-2xl focus:ring-2 focus:ring-[#00A86B] text-white outline-none" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="w-full p-4 bg-[#0B0F19] border border-white/5 rounded-2xl focus:ring-2 focus:ring-[#00A86B] text-white outline-none" placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button className="w-full bg-[#00A86B] text-white p-4 rounded-2xl font-bold shadow-lg flex justify-center">{loading ? <Loader2 className="animate-spin"/> : 'Entrar'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] pb-24 font-sans">
      <nav className="bg-[#161B26]/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00A86B] rounded-xl flex items-center justify-center"><span className="text-xl text-white">🦉</span></div>
          <h2 className="font-bold text-lg text-white">SAGE <span className="text-[#00A86B]">Finance</span></h2>
        </div>

        <div className="flex items-center gap-2 bg-[#0B0F19] px-3 py-1.5 rounded-xl border border-white/5">
          <Filter size={14} className="text-[#00A86B]"/>
          <select className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
            <option value={-1} className="bg-[#161B26]">Todos os Meses</option>
            {MONTHS.map((m, i) => <option key={i} value={i} className="bg-[#161B26]">{m}</option>)}
          </select>
          <select className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {[2024, 2025].map(y => <option key={y} value={y} className="bg-[#161B26]">{y}</option>)}
          </select>
        </div>

        <button onClick={() => { setUser(null); localStorage.removeItem('sage_user'); }} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-red-500"><LogOut size={22} /></button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SummaryCard icon={<TrendingUp size={20}/>} label="Entradas" value={totals.income} color="text-[#32D583]" bg="bg-[#32D583]/10" />
          <SummaryCard icon={<TrendingDown size={20}/>} label="Saídas" value={totals.expense} color="text-[#F04438]" bg="bg-[#F04438]/10" />
          <SummaryCard icon={<PiggyBank size={20}/>} label="Investido" value={totals.investment} color="text-[#2E90FA]" bg="bg-[#2E90FA]/10" />
          <div className="bg-[#00A86B] p-6 rounded-[2rem] shadow-xl shadow-[#00A86B]/10">
            <Wallet size={20} className="text-white mb-4"/>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Saldo Total</p>
            <h3 className="text-xl font-bold text-white">R$ {(totals.income - totals.expense - totals.investment).toLocaleString('pt-BR')}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-[#161B26] rounded-[2.5rem] border border-white/5 p-8 shadow-xl shadow-black/20">
            <h3 className="font-bold text-lg mb-6 text-white flex items-center gap-2"><Calendar size={18} className="text-[#00A86B]"/> Histórico</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredTransactions.sort((a,b) => b.date - a.date).map((t, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#0B0F19] rounded-2xl border border-white/5 group hover:border-[#00A86B]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${t.type === 'INCOME' ? 'bg-[#32D583]/10 text-[#32D583]' : t.type === 'INVESTMENT' ? 'bg-[#2E90FA]/10 text-[#2E90FA]' : 'bg-[#F04438]/10 text-[#F04438]'}`}>
                      {t.type === 'INCOME' ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">{t.description}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">{CATEGORIES[t.category] || t.category} • {PAYMENT_METHODS[t.paymentMethod] || t.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-[#32D583]' : t.type === 'INVESTMENT' ? 'text-[#2E90FA]' : 'text-[#F04438]'}`}>
                        {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-[9px] text-gray-600 font-bold">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button onClick={() => handleDelete(t.id)} className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#161B26] p-8 rounded-[2.5rem] border border-white/5 shadow-xl shadow-black/20">
            <h3 className="font-bold text-lg mb-6 text-white text-center">Gasto p/ Categoria</h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => {
                      const name = CATEGORIES[t.category] || t.category;
                      const ex = acc.find(i => i.name === name);
                      if (ex) ex.value += t.amount; else acc.push({name, value: t.amount});
                      return acc;
                    }, [])}
                    innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                  >
                    {COLORS.map((c, i) => <Cell key={i} fill={c}/>)}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: '#161B26', border: 'none', borderRadius: '12px', fontSize: '10px'}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Saídas</span>
                <span className="text-sm font-bold text-white">R$ {totals.expense.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <button onClick={() => setShowModal(true)} className="fixed bottom-10 right-10 w-16 h-16 bg-[#00A86B] text-white rounded-[1.5rem] shadow-2xl shadow-[#00A86B]/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30"><Plus size={32}/></button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F19]/90 backdrop-blur-sm">
          <div className="bg-[#161B26] w-full max-w-md rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24}/></button>
            <h2 className="text-xl font-bold mb-8 text-center text-white">Novo Registro Cloud</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex bg-[#0B0F19] p-1 rounded-2xl border border-white/5">
                {Object.entries(TRANSACTION_TYPES).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setFormData({...formData, type: v})} className={`flex-1 py-3 rounded-xl font-bold text-[10px] transition-all ${formData.type === v ? 'bg-[#00A86B] text-white shadow-lg' : 'text-gray-500'}`}>
                    {v === 'INCOME' ? 'ENTRADA' : v === 'EXPENSE' ? 'GASTO' : 'INVEST'}
                  </button>
                ))}
              </div>
              <input className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-white outline-none focus:ring-1 focus:ring-[#00A86B]" placeholder="Descrição" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R$</span>
                <input className="w-full bg-[#0B0F19] border border-white/5 p-4 pl-12 rounded-2xl text-white outline-none focus:ring-1 focus:ring-[#00A86B]" placeholder="0.00" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-white text-xs outline-none cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k} className="bg-[#161B26]">{v}</option>)}
                </select>
                <select className="bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-white text-xs outline-none cursor-pointer" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k} className="bg-[#161B26]">{v}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#00A86B] text-white p-4 rounded-2xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all mt-4">{loading ? 'Salvando...' : 'Salvar no SAGE Cloud'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const SummaryCard = ({icon, label, value, color, bg}) => (
  <div className="bg-[#161B26] p-6 rounded-[2rem] border border-white/5 shadow-xl shadow-black/20">
    <div className={`p-3 ${bg} ${color} w-fit rounded-2xl mb-4`}>{icon}</div>
    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
    <h3 className={`text-xl font-bold text-white`}>R$ {value.toLocaleString('pt-BR')}</h3>
  </div>
);

export default App;
