'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface PaymentCard {
  id: string;
  cardNumber: string;
  cardHolderName: string;
  bankName: string;
  cardType: string;
  isActive: boolean;
  createdAt: string;
}

export default function PaymentCardManager() {
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentCard | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolderName: '',
    bankName: '',
    cardType: 'Uzcard',
    isActive: false,
  });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const { data } = await api.get('/api/admin/settings/payment-cards');
      setCards(data);
    } catch (error) {
      toast.error('Kartalarni yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCard) {
        await api.patch(`/api/admin/settings/payment-cards/${editingCard.id}`, formData);
        toast.success('Karta yangilandi');
      } else {
        await api.post('/api/admin/settings/payment-cards', formData);
        toast.success('Karta qo\'shildi');
      }
      setShowForm(false);
      setEditingCard(null);
      setFormData({ cardNumber: '', cardHolderName: '', bankName: '', cardType: 'Uzcard', isActive: false });
      fetchCards();
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Rostdan ham bu kartani o\'chirmoqchimisiz?')) return;
    try {
      await api.delete(`/api/admin/settings/payment-cards/${id}`);
      toast.success('Karta o\'chirildi');
      fetchCards();
    } catch (error) {
      toast.error('Karta o\'chirilmadi');
    }
  };

  const handleEdit = (card: PaymentCard) => {
    setEditingCard(card);
    setFormData({
      cardNumber: card.cardNumber,
      cardHolderName: card.cardHolderName,
      bankName: card.bankName,
      cardType: card.cardType,
      isActive: card.isActive,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (card: PaymentCard) => {
    try {
      await api.patch(`/api/admin/settings/payment-cards/${card.id}`, { isActive: !card.isActive });
      toast.success('Karta holati yangilandi');
      fetchCards();
    } catch (error) {
      toast.error('Karta holatini o\'zgartirib bo\'lmadi');
    }
  };

  const formatCardNumber = (number: string) => {
    if (number.length <= 4) return number;
    return number.slice(0, 4) + ' **** **** ' + number.slice(-4);
  };

  if (loading) {
    return <div className="text-gray-400">Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">To'lov Kartalari</h3>
        <button
          onClick={() => {
            setEditingCard(null);
            setFormData({ cardNumber: '', cardHolderName: '', bankName: '', cardType: 'Uzcard', isActive: false });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-lg text-sm"
        >
          <Plus size={16} />
          Karta qo'shish
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 rounded-xl p-6">
          <h4 className="text-white font-medium mb-4">
            {editingCard ? 'Kartani tahrirlash' : 'Yangi karta'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Karta raqami</label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                placeholder="8600 1234 5678 9012"
                className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Karta egasi</label>
              <input
                type="text"
                value={formData.cardHolderName}
                onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
                placeholder="JOHN DOE"
                className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Bank nomi</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="Kapitalbank"
                className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Karta turi</label>
              <select
                value={formData.cardType}
                onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
                className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              >
                <option value="Uzcard">Uzcard</option>
                <option value="Humo">Humo</option>
                <option value="Visa">Visa</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <label className="text-gray-300">Aktiv karta</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`w-14 h-8 rounded-full transition ${formData.isActive ? 'bg-primary-600' : 'bg-gray-700'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCard(null);
                  setFormData({ cardNumber: '', cardHolderName: '', bankName: '', cardType: 'Uzcard', isActive: false });
                }}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 gradient-bg text-white rounded-lg"
              >
                {editingCard ? 'Yangilash' : 'Qo\'shish'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {cards.map((card) => (
          <div key={card.id} className="bg-white/5 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <CreditCard className="w-10 h-10 text-primary-400" />
                <div>
                  <p className="text-white font-medium">{formatCardNumber(card.cardNumber)}</p>
                  <p className="text-gray-400 text-sm">{card.cardHolderName}</p>
                  <p className="text-gray-500 text-sm">{card.bankName} • {card.cardType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleActive(card)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  {card.isActive ? (
                    <ToggleRight size={20} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={20} className="text-yellow-500" />
                  )}
                  <span className={card.isActive ? 'text-green-400' : 'text-yellow-400'}>
                    {card.isActive ? 'Aktiv' : 'Nofaol'}
                  </span>
                </button>
                <button
                  onClick={() => handleEdit(card)}
                  className="p-2 text-gray-400 hover:text-white transition"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
