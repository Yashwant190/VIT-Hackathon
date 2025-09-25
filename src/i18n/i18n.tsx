import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type LangCode =
  | 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ko' | 'ja' | 'ar' | 'ru' | 'hi'
  | 'pt' | 'it' | 'nl' | 'tr' | 'vi' | 'id' | 'th';

const STORAGE_KEY = 'documind-language';

// Minimal, extensible translation dictionary
// Keys are namespaced (e.g., 'tab.upload', 'upload.header.title') for clarity
const translations: Record<LangCode, Record<string, string>> = {
  en: {
    'tab.upload': 'Upload',
    'tab.summaries': 'Summaries',
    'tab.analytics': 'Analytics',
    'tab.settings': 'Settings',

    'brand.name': 'DocuMind',
    'brand.tagline': 'AI Analysis',

    'upload.header.title': 'Upload Documents',
    'upload.header.subtitle': 'Upload your documents to get AI-powered summaries and insights in seconds',
    'upload.autoProcessing': 'Auto Processing',
    'upload.manualProcessing': 'Manual Processing',
    'upload.processingDocuments': 'Processing Documents...',
    'upload.dropHere': 'Drop your files here',
    'upload.orClickBrowse': 'or click to browse your computer',
    'upload.chooseFiles': 'Choose Files',
    'upload.supportedFormats': 'Supported formats: PDF, DOC, DOCX, TXT, RTF',
    'upload.maxFileSize': 'Maximum file size: 50MB per file',
    'upload.autoHint': 'AI processing typically takes 30-60 seconds (Auto mode)',
    'upload.manualHint': 'Upload files and manually trigger processing (Manual mode)',
    'upload.stats.totalUploads': 'Total Uploads',
    'upload.stats.processed': 'Processed',
    'upload.stats.processing': 'Processing',
    'upload.stats.status': 'Status',
    'upload.recentUploads': 'Recent Uploads',
    'upload.noUploads': 'No uploads yet. Start by uploading your first document!',
    'upload.processAll': 'Process All',
    'upload.pendingSummaries': 'Pending Summaries',
    'upload.noPending': 'No pending items',
    'upload.process': 'Process',
    'upload.viewSummary': 'View Summary',

    'summaries.header.title': 'Document Summaries',
    'summaries.header.subtitle': 'AI-generated summaries and insights from your uploaded documents',
    'summaries.search.placeholder': 'Search documents, summaries, or key points...',
    'summaries.filter.all': 'All Sentiment',
    'summaries.filter.positive': 'Positive',
    'summaries.filter.neutral': 'Neutral',
    'summaries.filter.negative': 'Negative',
    'summaries.sort.date': 'Sort by Date',
    'summaries.sort.name': 'Sort by Name',
    'summaries.sort.size': 'Sort by Size',
    'summaries.stats.totalWords': 'Total Words',
    'summaries.stats.readingTime': 'Reading Time',
    'summaries.stats.positive': 'Positive',
    'summaries.stats.keyPoints': 'Key Points',
    'summaries.empty.title': 'No summaries yet',
    'summaries.empty.subtitle': 'Upload and process documents to see AI-generated summaries here',
    'summaries.empty.upload': 'Upload Documents',
    'summaries.card.words': 'words',
    'summaries.card.read': 'read',
    'summaries.card.keyPoints': 'Key Points:',
    'summaries.card.morePoints': 'more points',
    'summaries.dialog.aiSearch': 'AI Search',
    'summaries.dialog.new': 'NEW',
    'summaries.dialog.description': 'View detailed AI-generated summary and analysis for',
    'summaries.dialog.fullSummary': 'Full Summary',
    'summaries.dialog.categories': 'Categories',
    'summaries.dialog.export': 'Export Summary',
    'summaries.dialog.exporting': 'Exporting...',
    'summaries.dialog.share': 'Share',

    'settings.title': 'Settings',
    'settings.subtitle': 'Customize your DocuMind experience and preferences',
    'settings.appearance': 'Appearance',
    'settings.darkMode': 'Dark Mode',
    'settings.darkMode.hint': 'Switch to dark theme',
    'settings.language': 'Language',
    'settings.selectLanguage': 'Select language',
    'settings.procNotif': 'Processing & Notifications',
    'settings.autoProcessing': 'Auto Processing',
    'settings.autoProcessing.hint': 'Automatically process uploaded documents with AI',
    'settings.pushNotifications': 'Push Notifications',
    'settings.pushNotifications.hint': 'Get notified when processing completes',
    'settings.aiStatus.title': 'AI Processing Status',
    'settings.aiStatus.auto': 'Documents will be automatically processed when uploaded',
    'settings.aiStatus.manual': 'Documents will require manual processing after upload',
    'settings.api.title': 'API Configuration',
    'settings.api.key': 'OpenAI API Key',
    'settings.api.keyHint': 'Your API key is encrypted and stored securely',
    'settings.api.security.title': 'Security Notice',
    'settings.api.security.desc': 'Your documents are processed securely and are not stored permanently. API keys are encrypted and never shared with third parties.',
    'settings.data.title': 'Data Management',
    'settings.data.exportAll': 'Export All Data',
    'settings.data.exportHint': 'Download a backup of all documents and analytics',
    'settings.data.export': 'Export',
    'settings.data.clearAll': 'Clear All Data',
    'settings.data.clearHint': 'Permanently delete all documents and reset analytics',
    'settings.actions.save': 'Save Changes',
    'settings.actions.reset': 'Reset to Defaults',
    'settings.actions.exportData': 'Export Data',
    'settings.actions.clearAll': 'Clear All Data',
  },
  ko: {
    'tab.upload': '업로드',
    'tab.summaries': '요약',
    'tab.analytics': '분석',
    'tab.settings': '설정',

    'brand.name': '도큐마인드',
    'brand.tagline': 'AI 분석',

    'upload.header.title': '문서 업로드',
    'upload.header.subtitle': '문서를 업로드하여 AI 기반 요약과 인사이트를 빠르게 받아보세요',
    'upload.autoProcessing': '자동 처리',
    'upload.manualProcessing': '수동 처리',
    'upload.processingDocuments': '문서 처리 중...',
    'upload.dropHere': '여기에 파일을 놓으세요',
    'upload.orClickBrowse': '또는 컴퓨터에서 파일을 선택하세요',
    'upload.chooseFiles': '파일 선택',
    'upload.supportedFormats': '지원 형식: PDF, DOC, DOCX, TXT, RTF',
    'upload.maxFileSize': '최대 파일 크기: 파일당 50MB',
    'upload.autoHint': 'AI 처리는 일반적으로 30-60초 소요됩니다 (자동 모드)',
    'upload.manualHint': '파일을 업로드한 후 수동으로 처리를 시작하세요 (수동 모드)',
    'upload.stats.totalUploads': '총 업로드',
    'upload.stats.processed': '처리 완료',
    'upload.stats.processing': '처리 중',
    'upload.stats.status': '상태',
    'upload.recentUploads': '최근 업로드',
    'upload.noUploads': '아직 업로드가 없습니다. 첫 문서를 업로드해 보세요!',
    'upload.processAll': '모두 처리',
    'upload.pendingSummaries': '대기 중 요약',
    'upload.noPending': '대기 항목이 없습니다',
    'upload.process': '처리',
    'upload.viewSummary': '요약 보기',

    'summaries.header.title': '문서 요약',
    'summaries.header.subtitle': '업로드한 문서에서 생성된 AI 요약과 인사이트',
    'summaries.search.placeholder': '문서, 요약 또는 핵심 포인트 검색...',
    'summaries.filter.all': '모든 감성',
    'summaries.filter.positive': '긍정',
    'summaries.filter.neutral': '중립',
    'summaries.filter.negative': '부정',
    'summaries.sort.date': '날짜순 정렬',
    'summaries.sort.name': '이름순 정렬',
    'summaries.sort.size': '크기순 정렬',
    'summaries.stats.totalWords': '총 단어 수',
    'summaries.stats.readingTime': '읽기 시간',
    'summaries.stats.positive': '긍정',
    'summaries.stats.keyPoints': '핵심 포인트',
    'summaries.empty.title': '아직 요약이 없습니다',
    'summaries.empty.subtitle': '문서를 업로드하고 처리하여 여기에서 AI 요약을 확인하세요',
    'summaries.empty.upload': '문서 업로드',
    'summaries.card.words': '단어',
    'summaries.card.read': '읽기',
    'summaries.card.keyPoints': '핵심 포인트:',
    'summaries.card.morePoints': '개 더보기',
    'summaries.dialog.aiSearch': 'AI 검색',
    'summaries.dialog.new': '새로움',
    'summaries.dialog.description': '다음 파일에 대한 AI 생성 요약 및 분석 보기',
    'summaries.dialog.fullSummary': '전체 요약',
    'summaries.dialog.categories': '카테고리',
    'summaries.dialog.export': '요약 내보내기',
    'summaries.dialog.exporting': '내보내는 중...',
    'summaries.dialog.share': '공유',

    'settings.title': '설정',
    'settings.subtitle': 'DocuMind 환경과 기본 설정을 사용자 지정하세요',
    'settings.appearance': '모양',
    'settings.darkMode': '다크 모드',
    'settings.darkMode.hint': '다크 테마로 전환',
    'settings.language': '언어',
    'settings.selectLanguage': '언어 선택',
    'settings.procNotif': '처리 및 알림',
    'settings.autoProcessing': '자동 처리',
    'settings.autoProcessing.hint': '업로드된 문서를 자동으로 AI로 처리',
    'settings.pushNotifications': '푸시 알림',
    'settings.pushNotifications.hint': '처리가 완료되면 알림 받기',
    'settings.aiStatus.title': 'AI 처리 상태',
    'settings.aiStatus.auto': '문서는 업로드 시 자동으로 처리됩니다',
    'settings.aiStatus.manual': '문서는 업로드 후 수동으로 처리해야 합니다',
    'settings.api.title': 'API 구성',
    'settings.api.key': 'OpenAI API 키',
    'settings.api.keyHint': 'API 키는 암호화되어 안전하게 저장됩니다',
    'settings.api.security.title': '보안 알림',
    'settings.api.security.desc': '문서는 안전하게 처리되며 영구적으로 저장되지 않습니다. API 키는 암호화되며 제3자와 공유되지 않습니다.',
    'settings.data.title': '데이터 관리',
    'settings.data.exportAll': '모든 데이터 내보내기',
    'settings.data.exportHint': '모든 문서와 분석의 백업 다운로드',
    'settings.data.export': '내보내기',
    'settings.data.clearAll': '모든 데이터 삭제',
    'settings.data.clearHint': '모든 문서를 영구 삭제하고 분석을 재설정',
    'settings.actions.save': '변경 사항 저장',
    'settings.actions.reset': '기본값으로 재설정',
    'settings.actions.exportData': '데이터 내보내기',
    'settings.actions.clearAll': '모든 데이터 삭제',
  },
  es: {
    'tab.upload': 'Subir',
    'tab.summaries': 'Resúmenes',
    'tab.analytics': 'Analítica',
    'tab.settings': 'Ajustes',
    'upload.header.title': 'Subir documentos',
    'upload.header.subtitle': 'Sube documentos para obtener resúmenes e insights impulsados por IA',
    'upload.autoProcessing': 'Procesamiento automático',
    'upload.manualProcessing': 'Procesamiento manual',
    'upload.processingDocuments': 'Procesando documentos...',
    'upload.dropHere': 'Suelta tus archivos aquí',
    'upload.orClickBrowse': 'o haz clic para explorar tu computadora',
    'upload.chooseFiles': 'Elegir archivos',
    'upload.supportedFormats': 'Formatos soportados: PDF, DOC, DOCX, TXT, RTF',
    'upload.maxFileSize': 'Tamaño máximo: 50MB por archivo',
    'upload.autoHint': 'El procesamiento IA tarda normalmente 30-60 segundos (Auto)',
    'upload.manualHint': 'Sube archivos y procesa manualmente (Manual)',
    'upload.stats.totalUploads': 'Subidas totales',
    'upload.stats.processed': 'Procesados',
    'upload.stats.processing': 'Procesando',
    'upload.stats.status': 'Estado',
    'upload.recentUploads': 'Subidas recientes',
    'upload.noUploads': 'Aún no hay subidas. ¡Empieza subiendo tu primer documento!',
    'upload.processAll': 'Procesar todo',
    'upload.pendingSummaries': 'Resúmenes pendientes',
    'upload.noPending': 'No hay elementos pendientes',
    'upload.process': 'Procesar',
    'upload.viewSummary': 'Ver resumen',

    'summaries.header.title': 'Resúmenes de documentos',
    'summaries.header.subtitle': 'Resúmenes e insights generados por IA de tus documentos',
    'summaries.search.placeholder': 'Buscar documentos, resúmenes o puntos clave...',
    'summaries.filter.all': 'Todos los sentimientos',
    'summaries.filter.positive': 'Positivo',
    'summaries.filter.neutral': 'Neutral',
    'summaries.filter.negative': 'Negativo',
    'summaries.sort.date': 'Ordenar por fecha',
    'summaries.sort.name': 'Ordenar por nombre',
    'summaries.sort.size': 'Ordenar por tamaño',
    'summaries.stats.totalWords': 'Palabras totales',
    'summaries.stats.readingTime': 'Tiempo de lectura',
    'summaries.stats.positive': 'Positivo',
    'summaries.stats.keyPoints': 'Puntos clave',
    'summaries.empty.title': 'Aún no hay resúmenes',
    'summaries.empty.subtitle': 'Sube y procesa documentos para ver resúmenes aquí',
    'summaries.empty.upload': 'Subir documentos',
    'summaries.card.words': 'palabras',
    'summaries.card.read': 'lectura',
    'summaries.card.keyPoints': 'Puntos clave:',
    'summaries.card.morePoints': 'más puntos',
    'summaries.dialog.aiSearch': 'Búsqueda IA',
    'summaries.dialog.new': 'NUEVO',
    'summaries.dialog.description': 'Ver resumen y análisis generado por IA para',
    'summaries.dialog.fullSummary': 'Resumen completo',
    'summaries.dialog.categories': 'Categorías',
    'summaries.dialog.export': 'Exportar resumen',
    'summaries.dialog.exporting': 'Exportando...',
    'summaries.dialog.share': 'Compartir',

    'settings.title': 'Ajustes',
    'settings.subtitle': 'Personaliza tu experiencia y preferencias de DocuMind',
    'settings.appearance': 'Apariencia',
    'settings.darkMode': 'Modo oscuro',
    'settings.darkMode.hint': 'Cambiar al tema oscuro',
    'settings.language': 'Idioma',
    'settings.selectLanguage': 'Seleccionar idioma',
    'settings.procNotif': 'Procesamiento y notificaciones',
    'settings.autoProcessing': 'Procesamiento automático',
    'settings.autoProcessing.hint': 'Procesar documentos automáticamente con IA',
    'settings.pushNotifications': 'Notificaciones push',
    'settings.pushNotifications.hint': 'Recibe avisos cuando termine el procesamiento',
    'settings.aiStatus.title': 'Estado del procesamiento IA',
    'settings.aiStatus.auto': 'Los documentos se procesarán automáticamente al subir',
    'settings.aiStatus.manual': 'Los documentos requerirán procesamiento manual',
    'settings.api.title': 'Configuración API',
    'settings.api.key': 'Clave de API de OpenAI',
    'settings.api.keyHint': 'Tu clave se cifra y se almacena de forma segura',
    'settings.api.security.title': 'Aviso de seguridad',
    'settings.api.security.desc': 'Tus documentos se procesan de forma segura y no se almacenan permanentemente. Las claves de API se cifran y nunca se comparten con terceros.',
    'settings.data.title': 'Gestión de datos',
    'settings.data.exportAll': 'Exportar todos los datos',
    'settings.data.exportHint': 'Descargar copia de seguridad de documentos y analíticas',
    'settings.data.export': 'Exportar',
    'settings.data.clearAll': 'Borrar todos los datos',
    'settings.data.clearHint': 'Eliminar permanentemente todos los documentos y restablecer analíticas',
    'settings.actions.save': 'Guardar cambios',
    'settings.actions.reset': 'Restablecer',
    'settings.actions.exportData': 'Exportar datos',
    'settings.actions.clearAll': 'Borrar todos los datos',
  },
  fr: {}, de: {}, zh: {}, ja: {}, ar: {}, ru: {}, hi: {}, pt: {}, it: {}, nl: {}, tr: {}, vi: {}, id: {}, th: {},
};

const fallbackLang: LangCode = 'en';

function getInitialLang(): LangCode {
  if (typeof window === 'undefined') return fallbackLang;
  const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
  if (stored && translations[stored]) return stored;
  // Try browser language
  const navLang = (navigator.language || '').slice(0, 2) as LangCode;
  if (navLang && translations[navLang]) return navLang;
  return fallbackLang;
}

export type I18nContextType = {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string) => string;
  languages: Array<{ code: LangCode; label: string }>;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(getInitialLang());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.setAttribute('lang', lang);
    }
  }, [lang]);

  const setLang = (l: LangCode) => setLangState(l);

  const t = useMemo(() => {
    return (key: string) => {
      const dict = translations[lang] || translations[fallbackLang];
      const fbDict = translations[fallbackLang];
      return dict[key] ?? fbDict[key] ?? key;
    };
  }, [lang]);

  const languages: Array<{ code: LangCode; label: string }> = useMemo(() => ([
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'zh', label: '中文' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' },
    { code: 'ar', label: 'العربية' },
    { code: 'ru', label: 'Русский' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'pt', label: 'Português' },
    { code: 'it', label: 'Italiano' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'th', label: 'ไทย' },
  ]), []);

  const value: I18nContextType = { lang, setLang, t, languages };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
