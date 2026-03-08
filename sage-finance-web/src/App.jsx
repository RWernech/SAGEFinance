import React, { useState, useMemo, useEffect } from 'react';
import { transactionApi } from './api';
import {
  TrendingUp, TrendingDown, Wallet, Plus, LogOut, X, Trash2,
  ArrowUpRight, ArrowDownRight, Loader2, PiggyBank, Filter, Calendar,
  CreditCard, Tag, Edit3
} from 'lucide-react';
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// --- ENUMS REPLICADOS DO ANDROID ---
const TRANSACTION_TYPES = {
  INCOME: { id: "INCOME", label: "Entrada" },
  EXPENSE: { id: "EXPENSE", label: "Gasto/Saída" },
  INVESTMENT: { id: "INVESTMENT", label: "Investimento (Aporte)" },
  INVESTMENT_RESCUE: { id: "INVESTMENT_RESCUE", label: "Investimento (Resgate)" }
};

const CATEGORIES = {
  FOOD: "Alimentação",
  RENT: "Aluguel",
  BILL: "Conta",
  PHARMACY: "Farmácia",
  FINANCING: "Financiamento",
  TAX: "Imposto",
  LEISURE: "Lazer",
  TRANSPORT: "Locomoção",
  MAINTENANCE: "Manutenção",
  MARKET: "Mercado",
  OTHERS: "Outros",
  CLOTHES: "Roupa",
  STREAMING: "Streaming",
  VETERINARY: "Veterinário"
};

const PAYMENT_METHODS = {
  BOLETO: "Boleto",
  CREDIT: "Crédito",
  DEBIT: "Débito",
  PIX: "Pix",
  RECEIVED: "Recebido",
  TRANSFER: "Transferência",
  VR: "VR"
};

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const CHART_COLORS = ['#00A86B', '#32D583', '#2E90FA', '#FDB022', '#F04438', '#9C27B0', '#E91E63', '#673AB7', '#00BCD4', '#009688'];

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('sage_user')));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const initialForm = { description: '', amount: '', type: 'EXPENSE', category: 'MARKET', paymentMethod: 'DEBIT', date: new Date().toISOString().split('T')[0] };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { if (user) fetchTransactions(); }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionApi.getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) { if (e.response?.status === 401) handleLogout(); console.error(e); } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const mail = email.toLowerCase().trim();
      const res = await transactionApi.loginUser(mail, password);
      if (res && res.status === 'success' && res.token) {
        localStorage.setItem('sage_token', res.token);
        const u = { email: mail, name: res.name || 'Usuário' };
        setUser(u);
        localStorage.setItem('sage_user', JSON.stringify(u));
      } else alert('E-mail ou senha incorretos');
    } catch (e) { alert('Erro na AWS'); } finally { setLoading(false); }
  };

  const handleLogout = () => { setUser(null); localStorage.clear(); };

  const openEdit = (t) => {
    setEditingId(t.id);
    setFormData({
      description: t.description,
      amount: t.amount.toString(),
      type: t.type,
      category: t.category,
      paymentMethod: t.paymentMethod,
      date: new Date(t.date).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const transaction = {
        ...formData,
        id: editingId || crypto.randomUUID(),
        amount: parseFloat(formData.amount.replace(',', '.')),
        date: new Date(formData.date + "T12:00:00").getTime(),
        isSynced: true
      };
      await transactionApi.saveTransaction(transaction);
      setShowModal(false);
      setFormData(initialForm);
      setEditingId(null);
      fetchTransactions();
    } catch (e) { alert('Erro ao salvar'); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir transação?')) return;
    try {
      await transactionApi.deleteTransaction(id);
      fetchTransactions();
    } catch (e) { alert('Erro ao deletar'); }
  };

  const availableYears = useMemo(() => {
    const years = transactions.map(t => new Date(t.date).getFullYear());
    years.push(new Date().getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  }, [transactions]);

  const filtered = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return (selectedMonth === -1 || d.getMonth() === selectedMonth) && d.getFullYear() === selectedYear;
  }), [transactions, selectedMonth, selectedYear]);

  const totals = useMemo(() => filtered.reduce((acc, t) => {
    const type = t.type?.toUpperCase();
    if (type === 'INCOME' || type === 'RECEITA') acc.in += t.amount;
    else if (type === 'EXPENSE' || type === 'GASTO') acc.out += t.amount;
    else if (type === 'INVESTMENT' || type === 'INVESTIMENTO') acc.inv += t.amount;
    else if (type === 'INVESTMENT_RESCUE') acc.res += t.amount;
    return acc;
  }, { in: 0, out: 0, inv: 0, res: 0 }), [filtered]);

  const prevPeriodTotals = useMemo(() => {
    let pMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    let pYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    if (selectedMonth === -1) { pMonth = -1; pYear = selectedYear - 1; }

    return transactions.filter(t => {
      const d = new Date(t.date);
      return (pMonth === -1 || d.getMonth() === pMonth) && d.getFullYear() === pYear;
    }).reduce((acc, t) => {
      const type = t.type?.toUpperCase();
      if (type === 'INCOME' || type === 'RECEITA') acc.in += t.amount;
      else if (type === 'EXPENSE' || type === 'GASTO') acc.out += t.amount;
      else if (type === 'INVESTMENT' || type === 'INVESTIMENTO') acc.inv += t.amount;
      else if (type === 'INVESTMENT_RESCUE') acc.res += t.amount;
      return acc;
    }, { in: 0, out: 0, inv: 0, res: 0 });
  }, [transactions, selectedMonth, selectedYear]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4 font-sans text-white text-center">
      <div className="bg-[#161B26] p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/5 text-white">
        <div className="flex flex-col items-center mb-10 text-white">
          <div className="w-20 h-20 bg-[#00A86B] rounded-[2rem] flex items-center justify-center shadow-lg shadow-[#00A86B]/20 mb-6 font-bold text-4xl text-white">🦉</div>
          <h1 className="text-3xl font-bold text-white text-white">SAGE Finance</h1>
          <p className="text-[#00A86B] font-bold mt-1 uppercase tracking-widest text-[10px] text-white">Cloud Sync Enabled</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <input className="w-full p-4 bg-[#0B0F19] border border-white/5 rounded-2xl focus:ring-2 focus:ring-[#00A86B] outline-none transition-all text-white" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full p-4 bg-[#0B0F19] border border-white/5 rounded-2xl focus:ring-2 focus:ring-[#00A86B] outline-none transition-all text-white" placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-[#00A86B] text-white p-4 rounded-2xl font-bold hover:bg-[#007744] transition-all flex justify-center text-white">{loading ? <Loader2 className="animate-spin text-white"/> : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] pb-24 font-sans selection:bg-[#00A86B]/30 text-white">
      <nav className="bg-[#161B26]/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/5 px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-3 text-white text-white"><span className="text-2xl text-white">🦉</span><h2 className="font-bold text-lg text-white">SAGE <span className="text-[#00A86B] text-white text-white">Finance</span></h2></div>
        <div className="flex items-center gap-2 bg-[#0B0F19] px-3 py-1.5 rounded-xl border border-white/5">
          <Filter size={14} className="text-[#00A86B]"/>
          <select className="bg-transparent text-xs font-bold outline-none cursor-pointer text-white" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
            <option value={-1} className="bg-[#161B26] text-white">Todos os Meses</option>
            {MONTHS.map((m, i) => <option key={i} value={i} className="bg-[#161B26] text-white">{m}</option>)}
          </select>
          <select className="bg-transparent text-xs font-bold outline-none cursor-pointer text-white" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {availableYears.map(y => <option key={y} value={y} className="bg-[#161B26] text-white">{y}</option>)}
          </select>
        </div>
        <button onClick={handleLogout} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-red-500 transition-all text-white text-white"><LogOut size={22} /></button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-white">
          <Card icon={<TrendingUp size={20}/>} label="Entradas" value={totals.in + totals.res} prevValue={prevPeriodTotals.in + prevPeriodTotals.res} color="text-[#32D583]" bg="bg-[#32D583]/10" />
          <Card icon={<TrendingDown size={20}/>} label="Saídas" value={totals.out} prevValue={prevPeriodTotals.out} color="text-[#F04438]" bg="bg-[#F04438]/10" isExpense />
          <Card icon={<PiggyBank size={20}/>} label="Investido" value={totals.inv - totals.res} prevValue={prevPeriodTotals.inv - prevPeriodTotals.res} color="text-[#2E90FA]" bg="bg-[#2E90FA]/10" />
          <div className="bg-[#00A86B] p-4 rounded-[1.5rem] shadow-xl shadow-[#00A86B]/10 flex items-center gap-4 group hover:scale-[1.02] transition-transform h-[100px] text-white">
            <div className="p-3 bg-white/20 text-white rounded-2xl shrink-0"><Wallet size={20} /></div>
            <div className="min-w-0 text-white text-left text-white text-white">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider truncate text-white text-white">Saldo Real</p>
              <h3 className="text-lg font-bold font-mono leading-none my-1 truncate text-white text-white">R$ {(totals.in + totals.res - totals.out - totals.inv).toLocaleString('pt-BR')}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch text-white">
          <div className="lg:col-span-8 bg-[#161B26] rounded-[2.5rem] border border-white/5 p-8 shadow-xl shadow-black/20 flex flex-col h-[750px] text-white">
            <div className="flex justify-between items-center mb-8 shrink-0 text-white text-white">
              <h3 className="font-bold text-lg flex items-center gap-2 text-white"><Calendar size={18} className="text-[#00A86B] text-white"/> Histórico</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-white text-white">{selectedMonth === -1 ? 'Visão Anual' : MONTHS[selectedMonth]}</p>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow text-white">
              {filtered.sort((a,b) => b.date - a.date).map((t, i) => (
                <div key={i} onClick={() => openEdit(t)} className="flex items-center justify-between p-4 bg-[#0B0F19]/50 rounded-2xl border border-white/5 group hover:border-[#00A86B]/30 hover:bg-[#0B0F19] cursor-pointer transition-all text-white">
                  <div className="flex items-center gap-4 text-white text-white text-white">
                    <div className={`p-3 rounded-xl ${t.type?.toUpperCase().includes('INCOME') || t.type === 'Receita' || t.type === 'INVESTMENT_RESCUE' ? 'bg-[#32D583]/10 text-[#32D583]' : t.type?.toUpperCase().includes('INVEST') ? 'bg-[#2E90FA]/10 text-[#2E90FA]' : 'bg-[#F04438]/10 text-[#F04438]'}`}>
                      {(t.type?.toUpperCase().includes('INCOME') || t.type === 'Receita' || t.type === 'INVESTMENT_RESCUE') ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}
                    </div>
                    <div className="text-left text-white text-white"><p className="font-bold text-sm text-white text-white text-white">{t.description}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-white text-white text-white text-white">{CATEGORIES[t.category] || t.category} • {PAYMENT_METHODS[t.paymentMethod] || t.paymentMethod}</p></div>
                  </div>
                  <div className="flex items-center gap-6 text-white text-white text-white">
                    <div className="text-right text-white text-white"><p className={`font-bold text-sm ${(t.type?.toUpperCase().includes('INCOME') || t.type === 'Receita' || t.type === 'INVESTMENT_RESCUE') ? 'text-[#32D583]' : (t.type === 'INVESTMENT' ? 'text-[#2E90FA]' : 'text-[#F04438]')}`}>{(t.type === 'INCOME' || t.type === 'Receita' || t.type === 'INVESTMENT_RESCUE') ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}</p><p className="text-[9px] text-gray-600 font-bold text-white text-white text-white">{new Date(t.date).toLocaleDateString('pt-BR')}</p></div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-white text-white"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="h-full flex items-center justify-center text-gray-600 italic border-2 border-dashed border-white/5 rounded-3xl text-white">Nenhum registro encontrado no período.</div>}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8 h-[750px] text-white text-white">
            <ChartCard title="Saídas por Categoria" total={totals.out} data={filtered.filter(t => t.type?.toUpperCase().includes('EXPENSE')).reduce((acc, t) => {
              const n = CATEGORIES[t.category] || t.category;
              const ex = acc.find(i => i.name === n);
              if (ex) ex.value += t.amount; else acc.push({name: n, value: t.amount});
              return acc;
            }, [])} className="flex-1 text-white text-white" />

            <ChartCard title="Saídas por Pagamento" total={totals.out} data={filtered.filter(t => t.type?.toUpperCase().includes('EXPENSE')).reduce((acc, t) => {
              const n = PAYMENT_METHODS[t.paymentMethod] || t.paymentMethod;
              const ex = acc.find(i => i.name === n);
              if (ex) ex.value += t.amount; else acc.push({name: n, value: t.amount});
              return acc;
            }, [])} isAlternative className="flex-1 text-white text-white" />
          </div>
        </div>
      </main>

      <button onClick={() => { setFormData(initialForm); setEditingId(null); setShowModal(true); }} className="fixed bottom-10 right-10 w-16 h-16 bg-[#00A86B] text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30 shadow-[#00A86B]/30 text-white text-white"><Plus size={32}/></button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F19]/95 backdrop-blur-sm animate-in fade-in duration-300 text-white text-white text-white text-white">
          <div className="bg-[#161B26] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar text-white border-t-[#00A86B] text-white">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors text-white text-white text-white"><X size={24}/></button>
            <h2 className="text-xl font-bold mb-8 text-center flex items-center justify-center gap-2 text-white text-white text-white">{editingId ? <Edit3 size={20} className="text-[#00A86B] text-white"/> : <Plus size={20} className="text-[#00A86B] text-white"/>} {editingId ? 'Editar Registro' : 'Nova Operação'}</h2>
            <form onSubmit={handleSave} className="space-y-5 text-white text-white text-white text-white">
              <div className="flex bg-[#0B0F19] p-1 rounded-2xl border border-white/5 text-white text-white text-white">
                {Object.entries(TRANSACTION_TYPES).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setFormData({...formData, type: v.id})} className={`flex-1 py-3 rounded-xl font-bold text-[10px] tracking-widest transition-all ${formData.type === v.id ? 'bg-[#00A86B] text-white shadow-lg shadow-[#00A86B]/20 text-white' : 'text-gray-500 hover:text-gray-300 text-white text-white'}`}>{v.label.toUpperCase()}</button>
                ))}
              </div>
              <div className="space-y-1 text-white text-left text-white text-white text-white text-white">
                <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase tracking-widest text-white text-white text-white">Descrição</label>
                <input className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-[#F9FAFB] text-sm outline-none focus:ring-1 focus:ring-[#00A86B] transition-all text-white text-white text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4 text-white text-white text-white text-white text-white text-white">
                <div className="space-y-1 text-white text-left text-white text-white text-white text-white">
                  <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase tracking-widest text-white text-white text-white text-white">Valor (R$)</label>
                  <input className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-[#F9FAFB] text-sm outline-none focus:ring-1 focus:ring-[#00A86B] transition-all text-white text-white text-white text-white" type="text" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required placeholder="0,00" />
                </div>
                <div className="space-y-1 text-white text-left text-white text-white text-white text-white">
                  <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase tracking-widest text-white text-white text-white text-white">Data</label>
                  <input className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-[#F9FAFB] text-sm outline-none focus:ring-1 focus:ring-[#00A86B] transition-all text-xs text-white text-white text-white text-white" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-white text-white text-white text-white text-white text-white">
                <div className="space-y-1 text-white text-left text-white text-white text-white text-white">
                  <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase tracking-widest text-white text-white text-white text-white">Categoria</label>
                  <select className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-[#F9FAFB] text-xs outline-none cursor-pointer focus:ring-1 focus:ring-[#00A86B] transition-all text-white text-white text-white text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {Object.entries(CATEGORIES).sort((a,b) => a[1].localeCompare(b[1])).map(([k, v]) => <option key={k} value={k} className="text-white text-white text-white text-white">{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1 text-white text-left text-white text-white text-white text-white">
                  <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase tracking-widest text-white text-white text-white text-white">Pagamento</label>
                  <select className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-[#F9FAFB] text-xs outline-none cursor-pointer focus:ring-1 focus:ring-[#00A86B] transition-all text-white text-white text-white text-white" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                    {Object.entries(PAYMENT_METHODS).sort((a,b) => a[1].localeCompare(b[1])).map(([k, v]) => <option key={k} value={k} className="text-white text-white text-white text-white">{v}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#00A86B] text-white p-4 rounded-2xl font-bold shadow-lg shadow-[#00A86B]/20 hover:brightness-110 active:scale-95 transition-all mt-4 text-white font-sans text-white text-white text-white">{loading ? 'Salvando Sincronia...' : editingId ? 'Atualizar no Cloud' : 'Salvar no SAGE Cloud'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Card = ({icon, label, value, prevValue, color, bg, isExpense}) => {
  const percent = useMemo(() => {
    if (!prevValue || prevValue === 0) return value > 0 ? 100 : 0;
    return ((value - prevValue) / prevValue) * 100;
  }, [value, prevValue]);

  const isGood = isExpense ? percent <= 0 : percent >= 0;

  return (
    <div className="bg-[#161B26] p-4 rounded-[1.5rem] border border-white/5 shadow-xl shadow-black/20 group hover:border-[#00A86B]/20 transition-all flex items-center gap-4 group hover:scale-[1.02] transition-transform h-[100px] text-white text-white text-white">
      <div className={`p-3 ${bg} ${color} rounded-2xl shrink-0 text-white text-white text-white`}>{icon}</div>
      <div className="min-w-0 text-white text-white">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest truncate text-white text-white text-white">{label}</p>
        <h3 className={`text-lg font-bold font-mono leading-none my-1 truncate text-white text-white text-white`}>R$ {value.toLocaleString('pt-BR')}</h3>
        {prevValue > 0 && (
          <p className={`text-[9px] font-bold ${isGood ? 'text-[#32D583]' : 'text-[#F04438]'} text-white text-white`}>
            {percent >= 0 ? '+' : ''}{percent.toFixed(1)}% <span className="text-gray-600 font-normal text-white text-white text-white">vs anterior</span>
          </p>
        )}
      </div>
    </div>
  );
};

const ChartCard = ({title, total, data, isAlternative, className}) => (
  <div className={`bg-[#161B26] p-6 rounded-[2.5rem] border border-white/5 shadow-xl shadow-black/20 flex flex-col ${className} text-white text-white text-white`}>
    <h3 className="font-bold text-[10px] mb-4 text-gray-400 text-center uppercase tracking-[0.2em] shrink-0 uppercase text-white text-white text-white text-white">{title}</h3>
    <div className="relative flex-grow min-h-0 text-white text-white text-white">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data.length > 0 ? data : [{name: 'Sem dados', value: 1}]} innerRadius="65%" outerRadius="85%" paddingAngle={5} dataKey="value">
            {data.length > 0 ? data.map((_, i) => <Cell key={i} fill={CHART_COLORS[isAlternative ? (CHART_COLORS.length - 1 - i) : i]} />) : <Cell fill="#1f2937" />}
          </Pie>
          <Tooltip
            contentStyle={{backgroundColor: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff'}}
            itemStyle={{color: '#F9FAFB'}}
            cursor={{fill: 'transparent'}}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-white text-white text-white">
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-white text-white text-white">Saídas</p>
        <p className="text-sm font-bold text-white font-mono text-white text-white text-white">R$ {total.toLocaleString('pt-BR')}</p>
      </div>
    </div>
  </div>
);

export default App;
