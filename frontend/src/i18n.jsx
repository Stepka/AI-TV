import React, { createContext, useContext, useMemo, useState } from "react";

export const LOCALES = {
  ru: "Русский",
  en: "English",
};

export const defaultLocale = "ru";

export const messages = {
  ru: {
    common: {
      aiTv: "AI-TV",
      loading: "Загрузка...",
      networkError: "Ошибка сети",
      errorPrefix: "Ошибка: {{message}}",
      unknown: "Неизвестно",
      save: "Сохранить",
      saving: "Сохранение...",
      delete: "Удалить",
      deleting: "Удаление...",
      close: "Закрыть",
      cancel: "Отмена",
      play: "▶ Воспроизвести",
      addItem: "➕ Добавить элемент",
    },
    auth: {
      loginTitle: "Вход",
      loginDescription: "Войдите, чтобы управлять каналами, плейлистами и аудиобрендингом.",
      usernamePlaceholder: "Email или имя пользователя",
      passwordPlaceholder: "Пароль",
      loginButton: "Войти",
      loggingIn: "Вход...",
      registerLink: "Зарегистрироваться",
      registrationTitle: "Регистрация",
      registrationDescription: "Создайте бесплатный аккаунт или используйте ссылку-приглашение.",
      emailPlaceholder: "Email",
      registerButton: "Зарегистрироваться",
      registering: "Регистрация...",
      backToLogin: "Назад ко входу",
      inviteApplied: "Приглашение применено для {{email}}",
      inviteAppliedFallback: "этой регистрации",
      loginFailed: "Не удалось войти",
      registrationFailed: "Не удалось зарегистрироваться",
      registrationSuccessLogin: "Регистрация завершена. Пожалуйста, войдите.",
      emailRequired: "Укажите email",
      invalidEmail: "Введите корректный email",
      loggedIn: "Вход выполнен",
    },
    invite: {
      title: "Создать приглашение",
      emailPlaceholder: "Email",
      subscriptionPlaceholder: "Подписка",
      subscriptionRequired: "Укажите подписку",
      create: "Создать приглашение",
      creating: "Создание...",
      code: "Код приглашения: {{code}}",
      link: "Ссылка приглашения: {{link}}",
      failed: "Не удалось создать приглашение",
    },
    userPanel: {
      failedToLoadUser: "Не удалось загрузить пользователя",
      subscription: "Подписка: {{name}}",
      logout: "Выйти",
      createInvite: "Создать приглашение",
    },
    channels: {
      title: "Каналы",
      failedToLoad: "Не удалось загрузить каналы",
      newChannel: "Новый канал",
      loading: "Загрузка каналов...",
      empty: "Каналы недоступны",
      add: "Добавить канал",
      available: "Доступно каналов: {{count}}",
      noDescription: "Описание отсутствует",
    },
    tabs: {
      stage: "Диджей Стрим",
      editChannel: "Редактировать канал",
      brandPhrases: "Бренд-фразы",
      adPhrases: "Рекламные фразы",
      aiAudioLibrary: "AI-аудиотека",
      videoLibrary: "Видеотека",
    },
    channelManager: {
      confirmDelete: "Вы уверены, что хотите удалить этот канал?",
      deleteFailed: "Не удалось удалить канал",
      editChannel: "Редактирование канала",
      name: "Название",
      type: "Тип",
      url: "URL",
      fillWithLlm: "Заполнить через LLM",
      style: "Стиль",
      location: "Локация",
      description: "Описание",
      editVoice: "Голос",
      source: "Источник",
      sex: "Пол",
      editMediaSources: "Источники медиа",
      mediaSources: "Источники медиа",
    },
    stage: {
      untitled: "Без названия",
      enableAiDj: "Включить ИИ-Диджея",
      enableAiDjDescription: "ИИ-диджей будет готовить приветствия и переходы между треками.",
      enableAds: "Включить рекламные фразы",
      enableAdsDescription: "Включает голосовые рекламные и брендовые вставки во время стрима.",
      brandedTracks: "Брендированные треки",
      brandedTracksDescription: "Добавляет в плейлист AI-треки, сгенерированные специально для этого канала.",
      startStreaming: "Запустить Стрим",
      starting: "Привет! Запускаемся...",
      next: "Следующий ⏭",
      failedToLoadPlaylist: "Не удалось загрузить плейлист:",
    },
    playlist: {
      style: "Стиль",
      duration: "Длительность",
      branded: "Брендированный",
      notBranded: "Не брендированный",
      empty: "Треков пока нет.",
    },
    audioLibrary: {
      title: "Аудиотека",
      availableGenerations: "Доступно генераций: {{count}}",
      generatedTracks: "Сгенерированных треков в аудиотеке: {{count}}",
      generateTrack: "Сгенерировать трек",
      generating: "Генерация...",
      generateTitle: "Генерация трека",
      musicStyle: "Музыкальный стиль",
      brandedTrack: "Брендированный трек",
      generate: "Сгенерировать",
      generateFailed: "Не удалось сгенерировать AI-трек",
      generationFailedHint: "Генерация песни не удалась. Попробуйте другой стиль или промпт.",
      confirmDelete: "Вы уверены, что хотите удалить этот трек?",
      deleteFailed: "Не удалось удалить аудио",
    },
    phrases: {
      adTitle: "🎧 Библиотека рекламных фраз",
      brandTitle: "🎧 Библиотека бренд-фраз",
      addAd: "➕ Добавить рекламную фразу",
      addBrand: "➕ Добавить бренд-фразу",
      originalText: "Исходный текст",
      speech: "Озвучка",
      generatePhrase: "Генерация фразы...",
      generateText: "✍️ Сгенерировать текст",
      generateAudio: "🎵 Сгенерировать аудио",
      generatingAudio: "Генерация аудио...",
      audioFetchFailed: "Не удалось загрузить аудио",
      generateAdSpeechFailed: "Не удалось сгенерировать рекламную озвучку",
      generateBrandSpeechFailed: "Не удалось сгенерировать бренд-озвучку",
      generateTextFailed: "Не удалось сгенерировать текст",
      confirmDeleteAd: "Вы уверены, что хотите удалить эту рекламную фразу?",
      confirmDeleteBrand: "Вы уверены, что хотите удалить эту бренд-фразу?",
      deleteFailed: "Не удалось удалить фразу",
    },
    videoLibrary: {
      title: "🎬 Видеотека",
      upload: "🎬 Загрузить видео",
      uploading: "Загрузка...",
      confirmDelete: "Вы уверены, что хотите удалить это видео?",
      deleteFailed: "Не удалось удалить видео",
    },
    fullscreen: {
      enter: "На весь экран",
      exit: "Выйти из полноэкранного режима",
      error: "Ошибка полноэкранного режима:",
    },
    titles: {
      channel: "Канал",
      nowPlaying: "Сейчас играет",
      nextTrack: "Следующий трек",
      next: "Далее: {{track}}",
    },
  },
  en: {
    common: {
      aiTv: "AI-TV",
      loading: "Loading...",
      networkError: "Network error",
      errorPrefix: "Error: {{message}}",
      unknown: "Unknown",
      save: "Save",
      saving: "Saving...",
      delete: "Delete",
      deleting: "Deleting...",
      close: "Close",
      cancel: "Cancel",
      play: "▶ Play",
      addItem: "➕ Add Item",
    },
    auth: {
      loginTitle: "Login",
      loginDescription: "Sign in to manage channels, playlists, and audio branding.",
      usernamePlaceholder: "Email or username",
      passwordPlaceholder: "Password",
      loginButton: "Login",
      loggingIn: "Logging in...",
      registerLink: "Register",
      registrationTitle: "Registration",
      registrationDescription: "Create a free account or use an invitation link.",
      emailPlaceholder: "Email",
      registerButton: "Register",
      registering: "Registering...",
      backToLogin: "Back to login",
      inviteApplied: "Invite applied for {{email}}",
      inviteAppliedFallback: "this registration",
      loginFailed: "Login failed",
      registrationFailed: "Registration failed",
      registrationSuccessLogin: "Registration successful. Please login.",
      emailRequired: "Email is required",
      invalidEmail: "Enter a valid email",
      loggedIn: "Logged in",
    },
    invite: {
      title: "Create Invite",
      emailPlaceholder: "Email",
      subscriptionPlaceholder: "Subscription",
      subscriptionRequired: "Subscription is required",
      create: "Create invite",
      creating: "Creating...",
      code: "Invite code: {{code}}",
      link: "Invite link: {{link}}",
      failed: "Failed to create invite",
    },
    userPanel: {
      failedToLoadUser: "Failed to load user",
      subscription: "Subscription: {{name}}",
      logout: "Logout",
      createInvite: "Create Invite",
    },
    channels: {
      title: "Channels",
      failedToLoad: "Failed to load channels",
      newChannel: "New Channel",
      loading: "Loading channels...",
      empty: "No channels available",
      add: "Add Channel",
      available: "Available channels: {{count}}",
      noDescription: "Description is missing",
    },
    tabs: {
      stage: "DJ Stream",
      editChannel: "Edit Channel",
      brandPhrases: "Brand Phrases",
      adPhrases: "Ad Phrases",
      aiAudioLibrary: "AI Audio Library",
      videoLibrary: "Video Library",
    },
    channelManager: {
      confirmDelete: "Are you sure you want to delete this channel?",
      deleteFailed: "Failed to delete channel",
      editChannel: "Edit Channel",
      name: "Name",
      type: "Type",
      url: "URL",
      fillWithLlm: "Fill with LLM",
      style: "Style",
      location: "Location",
      description: "Description",
      editVoice: "Edit Voice",
      source: "Source",
      sex: "Sex",
      editMediaSources: "Edit Media Sources",
      mediaSources: "Media Sources",
    },
    stage: {
      untitled: "Untitled",
      enableAiDj: "Enable AI-DJ",
      enableAiDjDescription: "AI-DJ prepares intros and transitions between tracks.",
      enableAds: "Enable Ads",
      enableAdsDescription: "Enables spoken ad and brand inserts during the stream.",
      brandedTracks: "Branded tracks",
      brandedTracksDescription: "Adds AI tracks generated specifically for this channel to the playlist.",
      startStreaming: "Start DJ Streaming",
      starting: "Hello! We are starting...",
      next: "Next ⏭",
      failedToLoadPlaylist: "Failed to load playlist:",
    },
    playlist: {
      style: "Style",
      duration: "Duration",
      branded: "Branded",
      notBranded: "Not Branded",
      empty: "No tracks yet.",
    },
    audioLibrary: {
      title: "Audio Library",
      availableGenerations: "Available generations: {{count}}",
      generatedTracks: "Generated tracks in library: {{count}}",
      generateTrack: "Generate track",
      generating: "Generating...",
      generateTitle: "Generate Track",
      musicStyle: "Music style",
      brandedTrack: "Branded track",
      generate: "Generate",
      generateFailed: "Generate ai track failed",
      generationFailedHint: "Song generation failed. Please try another style or prompt.",
      confirmDelete: "Are you sure you want to delete this track?",
      deleteFailed: "Failed to delete audio",
    },
    phrases: {
      adTitle: "🎧 Ad Phrases Library",
      brandTitle: "🎧 Brand Phrases Library",
      addAd: "➕ Add Ad Phrase",
      addBrand: "➕ Add Brand Phrase",
      originalText: "Original text",
      speech: "Speech",
      generatePhrase: "Generating phrase...",
      generateText: "✍️ Generate text",
      generateAudio: "🎵 Generate audio",
      generatingAudio: "Generating audio...",
      audioFetchFailed: "Audio fetch failed",
      generateAdSpeechFailed: "Generate ad speech failed",
      generateBrandSpeechFailed: "Generate brand speech failed",
      generateTextFailed: "Generate text failed",
      confirmDeleteAd: "Are you sure you want to delete this ad phrase?",
      confirmDeleteBrand: "Are you sure you want to delete this brand phrase?",
      deleteFailed: "Failed to delete phrase",
    },
    videoLibrary: {
      title: "🎬 Video Library",
      upload: "🎬 Upload Video",
      uploading: "Uploading...",
      confirmDelete: "Are you sure you want to delete this video?",
      deleteFailed: "Failed to delete video",
    },
    fullscreen: {
      enter: "Fullscreen",
      exit: "Exit Fullscreen",
      error: "Fullscreen error:",
    },
    titles: {
      channel: "Channel",
      nowPlaying: "Now playing",
      nextTrack: "Next track",
      next: "Next: {{track}}",
    },
  },
};

const I18nContext = createContext(null);

function getMessage(locale, key) {
  return key.split(".").reduce((current, part) => current?.[part], messages[locale]);
}

function interpolate(template, params = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] ?? "");
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const savedLocale = localStorage.getItem("locale");
    return savedLocale && messages[savedLocale] ? savedLocale : defaultLocale;
  });

  const setLocale = (nextLocale) => {
    if (!messages[nextLocale]) return;
    localStorage.setItem("locale", nextLocale);
    setLocaleState(nextLocale);
  };

  const value = useMemo(() => {
    const t = (key, params) => {
      const message = getMessage(locale, key) ?? getMessage(defaultLocale, key) ?? key;
      return typeof message === "string" ? interpolate(message, params) : key;
    };

    return { locale, setLocale, t };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
