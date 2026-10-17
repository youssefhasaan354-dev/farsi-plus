import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Heart, Snowflake, Zap, Gem } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';

interface ShopItem {
  code: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price_gems: number;
  icon: string;
}

const ICONS: Record<string, typeof Heart> = {
  Snowflake,
  Heart,
  Zap,
};

export function ShopPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useUIStore();
  const isRTL = language === 'ar';
  const { profile, fetchProfile } = useAuthStore();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('shop_items')
        .select('code, name_en, name_ar, description_en, description_ar, price_gems, icon')
        .order('sort_order');

      if (data) setItems(data as ShopItem[]);
      setLoading(false);
    })();
  }, []);

  const handlePurchase = async (code: string) => {
    if (purchasing) return;
    setPurchasing(code);
    setErrorMessage(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('purchase_shop_item', { p_item_code: code });

      if (rpcError) {
        setErrorMessage(rpcError.message || t('shop.purchaseError'));
        setPurchasing(null);
        return;
      }

      const res = data as { success?: boolean; reason?: string } | null;
      if (res && res.success === false) {
        if (res.reason === 'not_enough_gems') {
          setErrorMessage(isRTL ? 'لا تملك عدداً كافياً من الجواهر' : 'Not enough gems');
        } else if (res.reason === 'hearts_already_full') {
          setErrorMessage(isRTL ? 'القلوب ممتلئة بالفعل' : 'Hearts are already full');
        } else if (res.reason === 'max_freeze_reached') {
          setErrorMessage(isRTL ? 'لديك بالفعل الحد الأقصى من التجميد (٣)' : 'Max streak freeze limit (3) reached');
        } else {
          setErrorMessage(t('shop.purchaseError'));
        }
        setPurchasing(null);
        return;
      }

      await fetchProfile();
      setPurchasing(null);
      setPurchaseResult({ success: true, message: t('shop.purchaseSuccess') });
    } catch {
      setErrorMessage(t('shop.purchaseError'));
      setPurchasing(null);
    }
  };

  const gems = profile?.gems ?? 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent" />
        <p className="text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/learn')}
          className="rounded-lg p-2 text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {isRTL ? <ArrowLeft size={22} className="rotate-180" /> : <ArrowLeft size={22} />}
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t('shop.title')}</h1>
          <p className="text-sm text-muted">{t('shop.subtitle')}</p>
        </div>
        {/* Gem balance */}
        <div className="flex items-center gap-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 px-4 py-2">
          <Gem size={18} className="text-primary-500 fill-current" />
          <span className="font-bold text-primary-600 dark:text-primary-400">{formatNumber(gems, language)}</span>
        </div>
      </div>

      {/* Shop items */}
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item, idx) => {
          const Icon = ICONS[item.icon] ?? Gem;
          const canAfford = gems >= item.price_gems;
          const isPurchasing = purchasing === item.code;
          const name = isRTL ? item.name_ar : item.name_en;
          const desc = isRTL ? item.description_ar : item.description_en;

          return (
            <motion.div
              key={item.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-surface p-5 flex flex-col items-center text-center"
            >
              {/* Icon */}
              <div className={[
                'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-md',
                item.code === 'streak_freeze'
                  ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
                  : item.code === 'heart_refill'
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
              ].join(' ')}>
                <Icon size={32} />
              </div>

              <h3 className="font-bold mb-1">{name}</h3>
              <p className="text-xs text-muted mb-4 flex-1">{desc}</p>

              {/* Price + buy */}
              <button
                onClick={() => handlePurchase(item.code)}
                disabled={!canAfford || isPurchasing}
                className={[
                  'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition-colors',
                  canAfford && !isPurchasing
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed',
                ].join(' ')}
              >
                {isPurchasing ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Gem size={18} className="fill-current" />
                    {formatNumber(item.price_gems, language)}
                    <span className="text-xs font-medium opacity-80">{t('shop.gems')}</span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 px-4 py-3 text-center text-sm text-error-500 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Success toast */}
      <AnimatePresence>
        {purchaseResult && (
          <motion.div
            className="fixed bottom-24 lg:bottom-8 inset-x-0 flex justify-center z-50 px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <div className="flex items-center gap-3 rounded-2xl bg-success-500 px-6 py-4 shadow-xl text-white">
              <Check size={24} />
              <span className="font-bold">{purchaseResult.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-dismiss success toast */}
      {purchaseResult && (
        <AutoDismissTimer onDismiss={() => setPurchaseResult(null)} />
      )}
    </div>
  );
}

function AutoDismissTimer({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  return null;
}

export default ShopPage;
