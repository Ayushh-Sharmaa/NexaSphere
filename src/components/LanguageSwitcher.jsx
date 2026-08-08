'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const switchLanguage = (newLocale) => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => switchLanguage('en')}
        className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
      >
        🇺🇸 EN
      </button>
      <button
        onClick={() => switchLanguage('hi')}
        className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
      >
        🇮🇳 HI
      </button>
    </div>
  );
};

export default LanguageSwitcher;
