import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Default to public root URL rather than protected internal paths
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.origin : 'https://farsiplus.app');

  const shareData = { title, text, url: shareUrl };

  const handleNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      setOpen(!open);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  const socialLinks = [
    {
      icon: Twitter,
      label: 'Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      icon: Facebook,
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`,
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  return (
    <div className="relative inline-block">
      <button
        onClick={handleNative}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Share2 size={16} />
        {t('share.button')}
      </button>

      {open && !navigator.share && (
        <div className="absolute z-30 mt-2 right-0 rtl:right-auto rtl:left-0 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg p-2 min-w-[180px]">
          {socialLinks.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Icon size={16} />
                {s.label}
              </a>
            );
          })}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full"
          >
            {copied ? <Check size={16} className="text-success-500" /> : <Link2 size={16} />}
            {copied ? t('share.copied') : t('share.copyLink')}
          </button>
        </div>
      )}
    </div>
  );
}

export default ShareButton;
