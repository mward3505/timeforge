import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded text-sm transition ${
          i18n.language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => changeLanguage('es')}
        className={`px-3 py-1 rounded text-sm transition ${
          i18n.language === 'es'
            ? 'bg-blue-600 text-white'
            : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
        }`}
      >
        ES
      </button>
    </div>
  );
}
