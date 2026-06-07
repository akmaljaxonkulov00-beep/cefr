'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Copy, Check } from 'lucide-react';
import api from '@/lib/api';

interface PaymentCard {
  id: string;
  cardNumber: string;
  cardHolderName: string;
  bankName: string;
  cardType: string;
  isActive: boolean;
}

export default function ActivePaymentCard() {
  const [card, setCard] = useState<PaymentCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchActiveCard();
  }, []);

  const fetchActiveCard = async () => {
    try {
      const { data } = await api.get('/api/settings/payment-cards/active');
      setCard(data);
    } catch (error) {
      console.error('Failed to fetch active card');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (card?.cardNumber) {
      navigator.clipboard.writeText(card.cardNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCardNumber = (number: string) => {
    if (number.length <= 4) return number;
    return number.slice(0, 4) + ' **** **** ' + number.slice(-4);
  };

  if (loading) {
    return <div className="text-gray-400 text-sm">Yuklanmoqda...</div>;
  }

  if (!card) {
    return <div className="text-gray-400 text-sm">Aktiv karta topilmadi</div>;
  }

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <CreditCard className="w-8 h-8 opacity-80" />
        <span className="text-xs font-medium opacity-80">{card.cardType}</span>
      </div>
      
      <div className="mb-4">
        <p className="text-2xl font-mono tracking-wider mb-2">{formatCardNumber(card.cardNumber)}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 transition"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Nusxa olindi' : 'Nusxa olish'}
          </button>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <p className="font-medium">{card.cardHolderName}</p>
        <p className="opacity-80">{card.bankName}</p>
      </div>
    </div>
  );
}
