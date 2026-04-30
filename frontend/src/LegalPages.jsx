import React from "react";
import { useI18n } from "./i18n";

const content = {
  ru: {
    back: "Назад к регистрации",
    consentTitle: "Согласие на обработку персональных данных",
    consentParagraphs: [
      "Настоящим, проставляя отметку в форме на сайте, я свободно, своей волей и в своем интересе выражаю согласие на обработку моих персональных данных в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».",
      "Оператор персональных данных: AI-TV (далее — Оператор). Контакт для обращений по вопросам обработки персональных данных: micromillioner@gmail.com.",
      "Перечень персональных данных, на обработку которых дается согласие: имя, номер телефона, адрес электронной почты, Telegram-аккаунт, текст комментария, а также иные данные, которые я добровольно укажу в заявке или при использовании сервиса.",
      "Цели обработки персональных данных: регистрация и сопровождение аккаунта, обработка и сопровождение заявок, обратная связь со мной, консультирование по услугам, подготовка и направление предложений, заключение и исполнение договоров.",
      "Перечень действий с персональными данными: сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача (предоставление, доступ) в случаях, предусмотренных законодательством РФ, обезличивание, блокирование, удаление, уничтожение.",
      "Обработка персональных данных может осуществляться как с использованием средств автоматизации, так и без их использования.",
      "Согласие действует с момента его предоставления и до достижения целей обработки либо до момента его отзыва субъектом персональных данных.",
      "Согласие может быть отозвано мной в любой момент путем направления письменного обращения на электронный адрес Оператора: micromillioner@gmail.com. Отзыв согласия не влияет на законность обработки, осуществленной до его получения Оператором.",
      "Подтверждаю, что ознакомлен(а) с условиями обработки персональных данных и принимаю их.",
      "Дата публикации: 23 апреля 2026 года.",
    ],
    termsTitle: "Условия сервиса",
    termsParagraphs: [
      "Настоящие условия регулируют использование сервиса AI-TV, предназначенного для генерации и воспроизведения фоновой музыки, аудиобрендинга, голосовых вставок, плейлистов и сопутствующих материалов.",
      "Регистрируясь в сервисе, пользователь подтверждает, что предоставил достоверные данные, имеет право использовать указанный email и принимает настоящие условия.",
      "Пользователь самостоятельно отвечает за материалы, описания бренда, промпты, тексты, медиафайлы и иные данные, которые он загружает или передает в сервис.",
      "Сервис может создавать музыкальные произведения, голосовые вставки, рекламные и брендовые фразы с использованием технологий искусственного интеллекта. Результаты генерации предоставляются пользователю для использования в рамках выбранного тарифа и функциональности сервиса.",
      "Пользователь обязуется не использовать сервис для создания, загрузки или распространения незаконных материалов, материалов, нарушающих права третьих лиц, а также материалов, содержащих запрещенную информацию.",
      "AI-TV вправе изменять функциональность сервиса, лимиты, тарифы и технические условия работы, уведомляя пользователей доступными способами, если такие изменения существенно влияют на использование сервиса.",
      "Сервис предоставляется в текущем виде. AI-TV стремится поддерживать стабильную работу, но не гарантирует отсутствие перерывов, ошибок, внешних ограничений API, сетевых сбоев или иных технических проблем.",
      "Пользователь обязан самостоятельно оценивать применимость созданных материалов для своих коммерческих, юридических и репутационных задач.",
      "Продолжая регистрацию или использование сервиса, пользователь подтверждает, что ознакомлен с настоящими условиями и принимает их.",
      "Дата публикации: 30 апреля 2026 года.",
    ],
  },
  en: {
    back: "Back to registration",
    consentTitle: "Consent to Personal Data Processing",
    consentParagraphs: [
      "By checking the box in the website form, I freely and willingly consent to the processing of my personal data in accordance with applicable personal data laws.",
      "Personal data operator: AI-TV. Contact for personal data processing requests: micromillioner@gmail.com.",
      "Personal data covered by this consent may include name, phone number, email address, Telegram account, comment text, and other data I voluntarily provide in requests or while using the service.",
      "Purposes of processing include account registration and support, request processing, feedback, service consultation, offer preparation, and contract conclusion and performance.",
      "Processing actions may include collection, recording, systematization, accumulation, storage, clarification, retrieval, use, transfer where permitted by law, anonymization, blocking, deletion, and destruction.",
      "Personal data may be processed with or without automated tools.",
      "This consent is valid from the moment it is given until the processing purposes are achieved or until it is withdrawn by the data subject.",
      "I may withdraw this consent at any time by sending a written request to micromillioner@gmail.com. Withdrawal does not affect the lawfulness of processing performed before receipt of the withdrawal.",
      "I confirm that I have read and accept the personal data processing terms.",
      "Publication date: April 23, 2026.",
    ],
    termsTitle: "Service Terms",
    termsParagraphs: [
      "These terms govern the use of AI-TV, a service for generating and playing background music, audio branding, voice inserts, playlists, and related materials.",
      "By registering for the service, the user confirms that the provided data is accurate, that they are entitled to use the specified email address, and that they accept these terms.",
      "The user is responsible for brand descriptions, prompts, texts, media files, and other materials uploaded or submitted to the service.",
      "The service may create music, voice inserts, advertising phrases, and brand phrases using artificial intelligence technologies. Generated results are provided for use within the selected plan and available service functionality.",
      "The user agrees not to use the service to create, upload, or distribute unlawful materials, materials infringing third-party rights, or materials containing prohibited information.",
      "AI-TV may change service functionality, limits, plans, and technical operating terms, notifying users through available means when such changes materially affect service use.",
      "The service is provided as is. AI-TV aims to keep it stable but does not guarantee uninterrupted operation, absence of errors, external API limitations, network failures, or other technical issues.",
      "The user must independently assess whether generated materials are suitable for their commercial, legal, and reputational needs.",
      "By continuing registration or using the service, the user confirms that they have read and accepted these terms.",
      "Publication date: April 30, 2026.",
    ],
  },
};

function LegalPage({ back, title, paragraphs }) {
  return (
    <div className="legal-page">
      <main className="legal-card">
        <a className="legal-back" href="#/register">
          {back}
        </a>
        <h1>{title}</h1>
        <div className="legal-copy">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </main>
    </div>
  );
}

export function PersonalDataConsentPage() {
  const { locale } = useI18n();
  const page = content[locale] ?? content.ru;
  return <LegalPage back={page.back} title={page.consentTitle} paragraphs={page.consentParagraphs} />;
}

export function ServiceTermsPage() {
  const { locale } = useI18n();
  const page = content[locale] ?? content.ru;
  return <LegalPage back={page.back} title={page.termsTitle} paragraphs={page.termsParagraphs} />;
}
