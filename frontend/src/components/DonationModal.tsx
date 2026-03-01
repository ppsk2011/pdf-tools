import { X, Coffee, Heart } from 'lucide-react';

interface DonationModalProps {
  onClose: () => void;
}

const TIERS = [
  { amount: '$3', label: 'Buy us a coffee ☕', link: 'https://donate.stripe.com/placeholder-3', popular: false },
  { amount: '$5', label: 'Support development 🚀', link: 'https://donate.stripe.com/placeholder-5', popular: true },
  { amount: '$10', label: 'Power user support 💪', link: 'https://donate.stripe.com/placeholder-10', popular: false },
];

export function DonationModal({ onClose }: DonationModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h2 id="donation-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Support PDFTools
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
            aria-label="Close donation modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="text-slate-600 dark:text-slate-400 mb-6">
          PDFTools is free and always will be. If it saved you time, consider buying us a coffee! ☕
        </p>

        <div className="space-y-3 mb-6">
          {TIERS.map((tier) => (
            <a
              key={tier.amount}
              href={tier.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                tier.popular
                  ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                  : 'border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="font-medium">{tier.label}</span>
              <span className={`text-lg font-bold ${tier.popular ? 'text-red-600 dark:text-red-400' : ''}`}>
                {tier.amount}
              </span>
              {tier.popular && (
                <span className="absolute -mt-10 ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Popular</span>
              )}
            </a>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Coffee className="w-4 h-4 text-slate-400" />
          <a
            href="https://ko-fi.com/placeholder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-red-500 transition-colors underline"
          >
            Or support on Ko-fi
          </a>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 justify-center mb-4">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
          Secure payment via Stripe · No account required
        </div>

        <button
          onClick={onClose}
          className="w-full text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-2"
        >
          No thanks, continue without supporting
        </button>
      </div>
    </div>
  );
}
