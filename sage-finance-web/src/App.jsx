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
  INVESTMENT: { id: "INVESTMENT", label: "Investimento" }
};

const CATEGORIES = {
  BILL: "Conta", PHARMACY: "Farmácia", FINANCING: "Financiamento",
  LEISURE: "Lazer", TRANSPORT: "Locomoção", MAINTENANCE: "Manutenção",
  MARKET: "Mercado", OTHERS: "Outros", STREAMING: "Streaming", VETERINARY: "Veterinário"
};

const PAYMENT_METHODS = {
  CREDIT: "Crédito", DEBIT: "Débito", PIX: "Pix",
  RECEIVED: "Recebido", TRANSFER: "Transferência", VR: "VR"
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

  // Carrega transações ao iniciar se estiver logado
  useEffect(() => { if (user) fetchTransactions(); }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Agora não passamos e-mail, a Lambda lê o Token
      const data = await transactionApi.getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.response?.status === 401) handleLogout();
      console.error(e);
    } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const mail = email.toLowerCase().trim();
      const res = await transactionApi.loginUser(mail, password);

      if (res && res.status === 'success' && res.token) {
        // SALVA O TOKEN JWT
        localStorage.setItem('sage_token', res.token);

        const u = { email: mail, name: res.name || 'Usuário' };
        setUser(u);
        localStorage.setItem('sage_user', JSON.stringify(u));
      } else alert('E-mail ou senha incorretos');
    } catch (e) { alert('Erro na AWS'); } finally { setLoading(false); }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sage_user');
    localStorage.removeItem('sage_token');
  };

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

  const filtered = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return (selectedMonth === -1 || d.getMonth() === selectedMonth) && d.getFullYear() === selectedYear;
  }), [transactions, selectedMonth, selectedYear]);

  const prevPeriodTotals = useMemo(() => {
    let pMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    let pYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    if (selectedMonth === -1) { pMonth = -1; pYear = selectedYear - 1; }

    return transactions.filter(t => {
      const d = new Date(t.date);
      return (pMonth === -1 || d.getMonth() === pMonth) && d.getFullYear() === pYear;
    }).reduce((acc, t) => {
      if (t.type === 'INCOME') acc.in += t.amount;
      else if (t.type === 'EXPENSE') acc.out += t.amount;
      else if (t.type === 'INVESTMENT') acc.inv += t.amount;
      return acc;
    }, { in: 0, out: 0, inv: 0 });
  }, [transactions, selectedMonth, selectedYear]);

  const totals = useMemo(() => filtered.reduce((acc, t) => {
    if (t.type === 'INCOME') acc.in += t.amount;
    else if (t.type === 'EXPENSE') acc.out += t.amount;
    else if (t.type === 'INVESTMENT') acc.inv += t.amount;
    return acc;
  }, { in: 0, out: 0, inv: 0 }), [filtered]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4 font-sans text-white">
      <div className="bg-[#161B26] p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/5">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#00A86B] rounded-[2rem] flex items-center justify-center shadow-lg shadow-[#00A86B]/20 mb-6 font-bold text-4xl">🦉</div>
          <h1 className="text-3xl font-bold">SAGE Finance</h1>
          <p className="text-[#00A86B] font-bold mt-1 uppercase tracking-widest text-[10px]">Cloud Account Secure</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <input className="w-full p-4 bg-[#0B0F19] border border-white/5 rounded-2xl focus:ring-2 focus:ring-[#00A86B] outline-none transition-all" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full p-4 bg-[#0B0F19] border border-white/5 rounded-2xl focus:ring-2 focus:ring-[#00A86B] outline-none transition-all" placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-[#00A86B] text-white p-4 rounded-2xl font-bold hover:bg-[#007744] transition-all flex justify-center">{loading ? <Loader2 className="animate-spin"/> : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] pb-24 font-sans selection:bg-[#00A86B]/30">
      <nav className="bg-[#161B26]/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3"><span className="text-2xl">🦉</span><h2 className="font-bold text-lg">SAGE <span className="text-[#00A86B]">Finance</span></h2></div>
        <div className="flex items-center gap-2 bg-[#0B0F19] px-3 py-1.5 rounded-xl border border-white/5">
          <Filter size={14} className="text-[#00A86B]"/>
          <select className="bg-transparent text-xs font-bold outline-none cursor-pointer text-white" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
            <option value={-1}>Todo o Ano</option>
            {MONTHS.map((m, i) => <option key={i} value={i} className="bg-[#161B26]">{m}</option>)}
          </select>
          <select className="bg-transparent text-xs font-bold outline-none cursor-pointer text-white" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {[2024, 2025].map(y => <option key={y} value={y} className="bg-[#161B26]">{y}</option>)}
          </select>
        </div>
        <button onClick={handleLogout} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-red-500 transition-all"><LogOut size={22} /></button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card icon={<TrendingUp size={20}/>} label="Entradas" value={totals.in} prevValue={prevPeriodTotals.in} color="text-[#32D583]" bg="bg-[#32D583]/10" />
          <Card icon={<TrendingDown size={20}/>} label="Saídas" value={totals.out} prevValue={prevPeriodTotals.out} color="text-[#F04438]" bg="bg-[#F04438]/10" isExpense />
          <Card icon={<PiggyBank size={20}/>} label="Investido" value={totals.inv} prevValue={prevPeriodTotals.inv} color="text-[#2E90FA]" bg="bg-[#2E90FA]/10" />
          <div className="bg-[#00A86B] p-4 rounded-[1.5rem] shadow-xl shadow-[#00A86B]/10 flex items-center gap-4 group hover:scale-[1.02] transition-transform h-[100px]">
            <div className="p-3 bg-white/20 text-white rounded-2xl shrink-0"><Wallet size={20} /></div>
            <div className="min-w-0 text-white">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider truncate">Saldo Real</p>
              <h3 className="text-lg font-bold font-mono leading-none my-1 truncate">R$ {(totals.in - totals.out - totals.inv).toLocaleString('pt-BR')}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 bg-[#161B26] rounded-[2.5rem] border border-white/5 p-8 shadow-xl shadow-black/20 flex flex-col h-[750px]">
            <div className="flex justify-between items-center mb-8 shrink-0 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={18} className="text-[#00A86B]"/> Histórico</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{selectedMonth === -1 ? 'Visão Anual' : MONTHS[selectedMonth]}</p>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {filtered.sort((a,b) => b.date - a.date).map((t, i) => (
                <div key={i} onClick={() => openEdit(t)} className="flex items-center justify-between p-4 bg-[#0B0F19]/50 rounded-2xl border border-white/5 group hover:border-[#00A86B]/30 hover:bg-[#0B0F19] cursor-pointer transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${t.type === 'INCOME' ? 'bg-[#32D583]/10 text-[#32D583]' : t.type === 'INVESTMENT' ? 'bg-[#2E90FA]/10 text-[#2E90FA]' : 'bg-[#F04438]/10 text-[#F04438]'}`}>
                      {t.type === 'INCOME' ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}
                    </div>
                    <div><p className="font-bold text-sm text-[#F9FAFB]">{t.description}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{CATEGORIES[t.category] || t.category} • {PAYMENT_METHODS[t.paymentMethod] || t.paymentMethod}</p></div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right"><p className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-[#32D583]' : t.type === 'INVESTMENT' ? 'text-[#2E90FA]' : 'text-[#F04438]'}`}>{t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}</p><p className="text-[9px] text-gray-600 font-bold">{new Date(t.date).toLocaleDateString('pt-BR')}</p></div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="h-full flex items-center justify-center text-gray-600 italic border-2 border-dashed border-white/5 rounded-3xl">Nenhum registro encontrado no período.</div>}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8 h-[750px]">
            <ChartCard title="Saídas por Categoria" total={totals.out} data={filtered.filter(t => t.type === 'EXPENSE').reduce((acc, t) => {
              const n = CATEGORIES[t.category] || t.category;
              const ex = acc.find(i => i.name === n);
              if (ex) ex.value += t.amount; else acc.push({name: n, value: t.amount});
              return acc;
            }, [])} className="flex-1" />

            <ChartCard title="Saídas por Pagamento" total={totals.out} data={filtered.filter(t => t.type === 'EXPENSE').reduce((acc, t) => {
              const n = PAYMENT_METHODS[t.paymentMethod] || t.paymentMethod;
              const ex = acc.find(i => i.name === n);
              if (ex) ex.value += t.amount; else acc.push({name: n, value: t.amount});
              return acc;
            }, [])} isAlternative className="flex-1" />
          </div>
        </div>
      </main>

      <button onClick={() => { setFormData(initialForm); setEditingId(null); setShowModal(true); }} className="fixed bottom-10 right-10 w-16 h-16 bg-[#00A86B] text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30 shadow-[#00A86B]/30"><Plus size={32}/></button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F19]/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#161B26] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar text-white border-t-[#00A86B]">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
            <h2 className="text-xl font-bold mb-8 text-center flex items-center justify-center gap-2">{editingId ? <Edit3 size={20} className="text-[#00A86B]"/> : <Plus size={20} className="text-[#00A86B]"/>} {editingId ? 'Editar Registro' : 'Nova Operação'}</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex bg-[#0B0F19] p-1 rounded-2xl border border-white/5">
                {Object.entries(TRANSACTION_TYPES).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setFormData({...formData, type: v.id})} className={`flex-1 py-3 rounded-xl font-bold text-[10px] tracking-widest transition-all ${formData.type === v.id ? 'bg-[#00A86B] text-white shadow-lg shadow-[#00A86B]/20' : 'text-gray-500 hover:text-gray-300'}`}>{v.label.toUpperCase()}</button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase tracking-widest">Descrição</label>
                <input className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-[#F9FAFB] text-sm outline-none focus:ring-1 focus:ring-[#00A86B] transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase tracking-widest">Valor (R$)</label>
                  <input className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-[#F9FAFB] text-sm outline-none focus:ring-1 focus:ring-[#00A86B] transition-all" type="text" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required placeholder="0,00" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase tracking-widest">Data</label>
                  <input className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-[#F9FAFB] text-sm outline-none focus:ring-1 focus:ring-[#00A86B] transition-all text-xs" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase tracking-widest">Categoria</label>
                  <select className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-[#F9FAFB] text-xs outline-none cursor-pointer focus:ring-1 focus:ring-[#00A86B] transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase tracking-widest">Pagamento</label>
                  <select className="w-full bg-[#0B0F19] border border-white/5 p-4 rounded-2xl text-[#F9FAFB] text-xs outline-none cursor-pointer focus:ring-1 focus:ring-[#00A86B] transition-all" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                    {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#00A86B] text-white p-4 rounded-2xl font-bold shadow-lg shadow-[#00A86B]/20 hover:brightness-110 active:scale-95 transition-all mt-4">{loading ? 'Salvando Sincronia...' : editingId ? 'Atualizar Cloud' : 'Salvar no SAGE Cloud'}</button>
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
    <div className="bg-[#161B26] p-4 rounded-[1.5rem] border border-white/5 shadow-xl shadow-black/20 group hover:border-[#00A86B]/20 transition-all flex items-center gap-4 group hover:scale-[1.02] transition-transform h-[100px]">
      <div className={`p-3 ${bg} ${color} rounded-2xl shrink-0`}>{icon}</div>
      <div className="min-w-0 text-white">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest truncate">{label}</p>
        <h3 className={`text-lg font-bold font-mono leading-none my-1 truncate`}>R$ {value.toLocaleString('pt-BR')}</h3>
        {prevValue > 0 && (
          <p className={`text-[9px] font-bold ${isGood ? 'text-[#32D583]' : 'text-[#F04438]'}`}>
            {percent >= 0 ? '+' : ''}{percent.toFixed(1)}% <span className="text-gray-600 font-normal">vs anterior</span>
          </p>
        )}
      </div>
    </div>
  );
};

const ChartCard = ({title, total, data, isAlternative, className}) => (
  <div className={`bg-[#161B26] p-6 rounded-[2.5rem] border border-white/5 shadow-xl shadow-black/20 flex flex-col ${className}`}>
    <h3 className="font-bold text-[10px] mb-4 text-gray-400 text-center uppercase tracking-[0.2em] shrink-0 uppercase">{title}</h3>
    <div className="relative flex-grow min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data.length > 0 ? data : [{name: 'Sem dados', value: 1}]} innerRadius="65%" outerRadius="85%" paddingAngle={5} dataKey="value">
            {data.length > 0 ? data.map((_, i) => <Cell key={i} fill={CHART_COLORS[isAlternative ? (CHART_COLORS.length - 1 - i) : i]} />) : <Cell fill="#1f2937" />}
          </Pie>
          <Tooltip
            contentStyle={{backgroundColor: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px'}}
            itemStyle={{color: '#F9FAFB'}}
            cursor={{fill: 'transparent'}}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Saídas</p>
        <p className="text-sm font-bold text-white font-mono">R$ {total.toLocaleString('pt-BR')}</p>
      </div>
    </div>
  </div>
);

export default App;
