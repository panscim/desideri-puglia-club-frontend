// src/pages/admin/AdminTransazioni.jsx — Log Transazioni
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { Search, RotateCcw, ArrowRight, Zap, Coins } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

export default function AdminTransazioni() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(50);

    useEffect(() => {
        loadLogs();
    }, [limit]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("logs_transazioni")
                .select(`
          *,
          utenti (nickname, email),
          partners (name)
        `)
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) throw error;
            setLogs(data || []);
        } catch (e) {
            console.error(e);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-olive-dark">
                        {t('admin.transactions.title')}
                    </h1>
                    <p className="text-olive-light">
                        {t('admin.transactions.subtitle')}
                    </p>
                </div>
                <button
                    onClick={loadLogs}
                    className="p-2 rounded-lg bg-olive-dark/10 hover:bg-olive-dark/20 text-olive-dark transition"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-sand overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-sand/30 text-olive-light uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">{t('admin.transactions.table.date')}</th>
                                <th className="px-6 py-4">{t('admin.transactions.table.user')}</th>
                                <th className="px-6 py-4">{t('admin.transactions.table.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sand/50">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-8 text-center text-olive-light">
                                        {t('common.loading')}
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-8 text-center text-olive-light">
                                        {t('admin.transactions.empty')}
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-warm-white/50 transition">
                                        <td className="px-6 py-4 font-mono text-xs text-olive-light whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString("it-IT")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-olive-dark">
                                                {log.utenti?.nickname || t('leaderboard.user_not_found')}
                                            </div>
                                            <div className="text-xs text-olive-light">
                                                {log.utenti?.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.partners ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
                                                        {t('admin.transactions.visit_partner')}
                                                    </span>
                                                    <span className="font-medium">
                                                        {log.partners.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                                                    {log.tipo}
                                                </span>
                                            )}
                                            {log.note && (
                                                <p className="text-xs text-olive-light mt-0.5">
                                                    {log.note}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {logs.length >= limit && (
                    <div className="p-4 border-t border-sand text-center">
                        <button
                            onClick={() => setLimit((l) => l + 50)}
                            className="text-sm text-olive-dark font-semibold hover:underline"
                        >
                            {t('admin.transactions.load_more')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
