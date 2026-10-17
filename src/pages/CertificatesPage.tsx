import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Award, Download } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useIsRTL } from '@/lib/useIsRTL';
import { ShareButton } from '@/components/ShareButton';

interface Certificate {
  id: string;
  certificate_type: string;
  reference_id: string;
  title_ar: string;
  title_en: string;
  issue_date: string;
}

export function CertificatesPage() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { profile } = useAuthStore();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('certificates')
      .select('*')
      .order('issue_date', { ascending: false });
    setCerts((data || []) as Certificate[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCerts();
  }, [fetchCerts]);

  const handleDownload = (cert: Certificate) => {
    setGeneratingId(cert.id);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#fffdf0'; // ivory
      ctx.fillRect(0, 0, 1200, 800);

      // Ornate Border
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#0d7377'; // turquoise
      ctx.strokeRect(30, 30, 1140, 740);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f5a623'; // saffron gold
      ctx.strokeRect(48, 48, 1104, 704);

      // Corner Accents
      ctx.fillStyle = '#0d7377';
      const corners = [
        [52, 52],
        [1148, 52],
        [52, 748],
        [1148, 748],
      ];
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
      });

      // Header: App name & badge
      ctx.font = 'bold 36px Cairo, sans-serif';
      ctx.fillStyle = '#0d7377';
      ctx.textAlign = 'center';
      ctx.fillText('فارسي بلس — Farsi Plus', 600, 120);

      ctx.font = '22px Cairo, sans-serif';
      ctx.fillStyle = '#f5a623';
      ctx.fillText(
        isRTL ? 'شهادة إتمام معتمدة' : 'Certificate of Completion',
        600,
        170,
      );

      // Recipient statement
      ctx.font = '24px Cairo, sans-serif';
      ctx.fillStyle = '#7a7064';
      ctx.fillText(
        isRTL ? 'تُمنح هذه الشهادة بكل فخر إلى:' : 'This certificate is proudly presented to:',
        600,
        270,
      );

      // Recipient name
      ctx.font = 'bold 52px Cairo, sans-serif';
      ctx.fillStyle = '#0d7377';
      const recipientName = profile?.display_name || profile?.email || 'طالب متميز';
      ctx.fillText(recipientName, 600, 350);

      // Underline recipient
      ctx.beginPath();
      ctx.moveTo(350, 375);
      ctx.lineTo(850, 375);
      ctx.strokeStyle = '#f5a623';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Certificate Title
      ctx.font = '30px Cairo, sans-serif';
      ctx.fillStyle = '#1a1714';
      const certTitle = isRTL ? cert.title_ar : cert.title_en;
      ctx.fillText(
        isRTL
          ? `لإتمامه بنجاح متطلبات ${certTitle}`
          : `For successfully completing the requirements of ${certTitle}`,
        600,
        450,
      );

      // Date & ID
      ctx.font = '20px Cairo, sans-serif';
      ctx.fillStyle = '#7a7064';
      const dateText = `${isRTL ? 'تاريخ الإصدار:' : 'Issued on:'} ${new Date(cert.issue_date).toLocaleDateString()}`;
      ctx.fillText(dateText, 600, 530);

      ctx.font = '16px monospace';
      ctx.fillStyle = '#a89e8f';
      ctx.fillText(`ID: ${cert.id}`, 600, 570);

      // Signature line
      ctx.beginPath();
      ctx.moveTo(480, 680);
      ctx.lineTo(720, 680);
      ctx.strokeStyle = '#0d7377';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '18px Cairo, sans-serif';
      ctx.fillStyle = '#0d7377';
      ctx.fillText('فارسي بلس التعليمية', 600, 715);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `certificate_${cert.certificate_type}_${cert.id.slice(0, 8)}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to generate certificate:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Award size={28} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {t('certificates.title')}
        </h1>
      </div>

      {certs.length === 0 ? (
        <div className="text-center py-20">
          <Award size={48} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
          <p className="text-neutral-500">{t('certificates.empty')}</p>
          <p className="text-sm text-neutral-400 mt-1">{t('certificates.hint')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certs.map((cert) => {
            const certTitle = isRTL ? cert.title_ar : cert.title_en;
            const isGenerating = generatingId === cert.id;

            return (
              <div
                key={cert.id}
                className="relative overflow-hidden rounded-2xl border-2 border-primary-200 dark:border-primary-800 bg-gradient-to-br from-white to-primary-50 dark:from-neutral-900 dark:to-primary-900/10 p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-100 dark:bg-primary-900/20 rounded-bl-full opacity-50" />
                <div className="relative">
                  <Award size={32} className="text-primary-600 mb-3" />
                  <p className="text-xs uppercase tracking-wider text-primary-500 font-semibold mb-1">
                    {cert.certificate_type === 'stage'
                      ? t('certificates.stage')
                      : t('certificates.unit')}
                  </p>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    {certTitle}
                  </h2>
                  <p className="text-sm text-neutral-500 mb-4">
                    {t('certificates.issuedOn')}: {new Date(cert.issue_date).toLocaleDateString()}
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleDownload(cert)}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <Download size={16} />
                      {isGenerating
                        ? isRTL
                          ? 'جارٍ التحميل...'
                          : 'Generating...'
                        : t('certificates.download')}
                    </button>
                    <ShareButton
                      title={certTitle}
                      text={
                        isRTL
                          ? `حصلت على شهادة ${certTitle} من تطبيق فارسي بلس!`
                          : `I earned the ${certTitle} certificate on Farsi Plus!`
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CertificatesPage;
