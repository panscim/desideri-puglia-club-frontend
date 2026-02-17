// src/pages/admin/AdminPartners.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";
import {
  Crown,
  Search,
  MapPin,
  Edit3,
  CheckCircle2,
  XCircle,
  Coins,
  KeyRound,
  Save,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

export default function AdminPartners() {
  const { t } = useTranslation();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [editForm, setEditForm] = useState({
    saldo_punti: 0,
    pin_code: "",
    is_verified: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("partners")
        .select(
          "id, name, logo_url, city, category, is_active, visits_month, saldo_punti, is_verified, pin_code"
        )
        .order("name", { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (e) {
      console.error(e);
      toast.error(t('admin.partners.messages.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (partner) => {
    setSelectedPartner(partner);
    setEditForm({
      saldo_punti: partner.saldo_punti || 0,
      pin_code: partner.pin_code || "",
      is_verified: partner.is_verified || false,
      whatsapp_number: partner.whatsapp_number || "",
    });
  };

  const handleSave = async () => {
    if (!selectedPartner) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("partners")
        .update({
          saldo_punti: parseInt(editForm.saldo_punti) || 0,
          pin_code: editForm.pin_code,
          is_verified: editForm.is_verified,
          whatsapp_number: editForm.whatsapp_number,
        })
        .eq("id", selectedPartner.id);

      if (error) throw error;

      toast.success(t('admin.partners.messages.updated'));
      setPartners((prev) =>
        prev.map((p) =>
          p.id === selectedPartner.id ? { ...p, ...editForm } : p
        )
      );
      setSelectedPartner(null);
    } catch (e) {
      console.error(e);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const filtered = partners.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-olive-dark">{t('admin.partners.title')}</h1>
          <p className="text-olive-light">
            {t('admin.partners.subtitle')}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-light" />
          <input
            type="text"
            placeholder={t('admin.partners.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl border border-sand bg-white focus:ring-2 focus:ring-olive-dark/20 outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`card group relative border-l-4 ${p.is_verified ? "border-l-blue-500" : "border-l-transparent"
              }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 min-w-0">
                <img
                  src={p.logo_url || "/logo.png"}
                  onError={(e) => (e.currentTarget.src = "/logo.png")}
                  alt={p.name}
                  className="w-12 h-12 rounded-lg object-cover border border-sand bg-white"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-olive-dark truncate flex items-center gap-1">
                    {p.name}
                    {p.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    )}
                  </h3>
                  <p className="text-xs text-olive-light truncate">
                    {p.city} · {p.category}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-1">
                      <Coins className="w-3 h-3" /> {p.saldo_punti ?? 0}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-mono flex items-center gap-1">
                      <KeyRound className="w-3 h-3" />{" "}
                      {p.pin_code || "NO PIN"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleEdit(p)}
                className="p-2 rounded-lg bg-olive-dark/5 hover:bg-olive-dark/10 text-olive-dark transition"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-sand flex items-center justify-between bg-warm-white">
              <h3 className="font-bold text-olive-dark">
                {t('admin.partners.edit_modal', { name: selectedPartner.name })}
              </h3>
              <button
                onClick={() => setSelectedPartner(null)}
                className="p-1 hover:bg-black/5 rounded-full"
              >
                <XCircle className="w-5 h-5 text-olive-light" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Saldo */}
              <div>
                <label className="block text-xs font-bold text-olive-dark uppercase mb-1">
                  {t('admin.partners.balance')}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditForm((f) => ({
                        ...f,
                        saldo_punti: Math.max(0, f.saldo_punti - 100),
                      }))
                    }
                    className="w-10 h-10 rounded-lg bg-red-100 text-red-600 font-bold hover:bg-red-200"
                  >
                    -100
                  </button>
                  <input
                    type="number"
                    value={editForm.saldo_punti}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        saldo_punti: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="flex-1 text-center py-2 rounded-lg border border-sand font-mono text-lg font-bold"
                  />
                  <button
                    onClick={() =>
                      setEditForm((f) => ({
                        ...f,
                        saldo_punti: f.saldo_punti + 100,
                      }))
                    }
                    className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 font-bold hover:bg-emerald-200"
                  >
                    +100
                  </button>
                </div>
              </div>

              {/* PIN */}
              <div>
                <label className="block text-xs font-bold text-olive-dark uppercase mb-1">
                  {t('admin.partners.pin')}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={editForm.pin_code}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, pin_code: e.target.value }))
                  }
                  className="w-full p-3 rounded-lg border border-sand font-mono text-lg tracking-widest text-center focus:ring-2 focus:ring-olive-dark/20 outline-none"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-olive-dark uppercase mb-1">
                  {t('admin.partners.whatsapp')}
                </label>
                <input
                  type="text"
                  value={editForm.whatsapp_number || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      whatsapp_number: e.target.value,
                    }))
                  }
                  className="w-full p-2 rounded-lg border border-sand focus:ring-2 focus:ring-olive-dark/20 outline-none"
                />
              </div>

              {/* Verified Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-800">
                    {t('admin.partners.verified_badge')}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={editForm.is_verified}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        is_verified: e.target.checked,
                      }))
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedPartner(null)}
                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium"
              >
                {t('admin.missions.form.close')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-olive-dark text-white font-semibold hover:bg-olive-dark/90 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t('admin.partners.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}