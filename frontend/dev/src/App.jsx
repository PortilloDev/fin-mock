import { useEffect, useState } from 'react';

function App() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({ description: '', amount: '', type: 'income' });
    const [submitting, setSubmitting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const fetchTransactions = () => {
        setLoading(true);
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching data:", err);
                setError("No se pudo conectar con el servidor.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.description || !form.amount || !form.type) return;

        setSubmitting(true);
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: form.description,
                amount: parseFloat(form.amount),
                type: form.type,
            }),
        })
            .then(res => res.json())
            .then(() => {
                setForm({ description: '', amount: '', type: 'income' });
                setSubmitting(false);
                fetchTransactions();
            })
            .catch(err => {
                console.error("Error posting data:", err);
                setSubmitting(false);
            });
    };

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = totalIncome - totalExpense;

    return (
        <div className="app">
            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <span className="logo-icon">◈</span>
                        <h1>FinMock</h1>
                    </div>
                    <p className="subtitle">Dashboard Financiero</p>
                </div>
            </header>

            <main className="main">
                {/* Summary Cards */}
                <section className="summary-cards">
                    <div className="card card-income">
                        <div className="card-icon">↑</div>
                        <div className="card-body">
                            <span className="card-label">Ingresos</span>
                            <span className="card-value">${totalIncome.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="card card-expense">
                        <div className="card-icon">↓</div>
                        <div className="card-body">
                            <span className="card-label">Gastos</span>
                            <span className="card-value">${totalExpense.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="card card-balance">
                        <div className="card-icon">≡</div>
                        <div className="card-body">
                            <span className="card-label">Balance</span>
                            <span className="card-value">${balance.toFixed(2)}</span>
                        </div>
                    </div>
                </section>

                {/* Add Transaction Form */}
                <section className="form-section">
                    <h2>Nueva Transacción</h2>
                    <form onSubmit={handleSubmit} className="transaction-form">
                        <div className="form-group">
                            <label htmlFor="description">Descripción</label>
                            <input
                                id="description"
                                type="text"
                                placeholder="Ej: Nómina mensual"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="amount">Monto ($)</label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="type">Tipo</label>
                            <select
                                id="type"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="income">Ingreso</option>
                                <option value="expense">Gasto</option>
                            </select>
                        </div>
                        <button type="submit" disabled={submitting} className="btn-submit">
                            {submitting ? 'Guardando...' : 'Añadir'}
                        </button>
                    </form>
                </section>

                {/* Transactions Table */}
                <section className="table-section">
                    <h2>Transacciones</h2>
                    {loading ? (
                        <div className="loader">
                            <div className="spinner"></div>
                            <p>Cargando transacciones...</p>
                        </div>
                    ) : error ? (
                        <div className="error-msg">{error}</div>
                    ) : transactions.length === 0 ? (
                        <p className="empty-msg">No hay transacciones registradas.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Descripción</th>
                                        <th>Monto</th>
                                        <th>Tipo</th>
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(t => (
                                        <tr key={t.id} className={t.type === 'expense' ? 'row-expense' : 'row-income'}>
                                            <td>{t.id}</td>
                                            <td>{t.description}</td>
                                            <td className="amount">${parseFloat(t.amount).toFixed(2)}</td>
                                            <td>
                                                <span className={`badge badge-${t.type}`}>
                                                    {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                </span>
                                            </td>
                                            <td>{new Date(t.created_at).toLocaleDateString('es-ES')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            <footer className="footer">
                <p>FinMock v1.0 — Proyecto de formación DevOps</p>
            </footer>
        </div>
    );
}

export default App;
