import { useEffect, useRef, useState } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { motion, useInView } from 'motion/react';
import {
  Music2,
  Radio,
  Palette,
  Video,
  Coffee,
  Dumbbell,
  ShoppingBag,
  Check,
  Rocket,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import barbershopVideo from '../media/Barbershop_low.mp4';
import coffeeVideo from '../media/Coffee_low.mp4';
import fitnessVideo from '../media/Fitness_low.mp4';
import pizzeriaVideo from '../media/Pizzeria_low.mp4';

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function LegalExplanationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <a
          href="#/"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-red-500/50 hover:text-white"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Назад на главную
        </a>

        <div className="rounded-[2rem] border border-zinc-700/50 bg-gradient-to-br from-zinc-900/90 to-zinc-800/50 p-8 shadow-2xl shadow-black/30 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-600/30 bg-red-600/10 px-4 py-2 text-sm text-red-300">
            <ShieldCheck className="h-4 w-4" />
            Юридическое объяснение
          </div>

          <h1 className="mb-6 text-4xl font-black leading-tight sm:text-5xl" style={{ fontFamily: 'Syne, sans-serif' }}>
            Почему AI-музыка, сгенерированная сервисом, может использоваться без выплат РАО и ВОИС
          </h1>

          <div className="space-y-5 text-base leading-8 text-zinc-300 sm:text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <p><strong>Вопросы:</strong></p>

            <p><strong>1. Правовой статус музыкальных произведений, создаваемых искусственным интеллектом (далее также ИИ)?</strong></p>
            <p><strong>Ответ:</strong> В соответствии со статьей 1257 ГК РФ, автором произведения науки, литературы или искусства признается гражданин, творческим трудом которого оно создано.</p>
            <p>Юридическая позиция Верховного Суда РФ, изложенная в п. 80 Постановления Пленума ВС РФ от 23.04.2019 № 10, уточняет: результаты интеллектуальной деятельности, созданные исключительно техническими средствами без внесения творческого вклада человека, не признаются объектами авторского права.</p>
            <p>Применительно к музыке, созданной ИИ это означает следующее: если пользователь лишь ставит задачу (вводит промпт), а нейросеть (которая является всего лишь программой для ЭВМ) самостоятельно генерирует музыкальную композицию, творческий труд человека в создании конкретной мелодии, аранжировки или текста отсутствует. Следовательно, такой результат (музыка) не соответствует критерию охраноспособности, установленному ст. 1257 ГК РФ, и не является объектом авторского права.</p>

            <p><strong>2. Обязаны ли слушатели платить денежные средства РАО и ВОИС за прослушивание музыки, созданной искусственным интеллектом?</strong></p>
            <p><strong>Ответ:</strong> Российское авторское общество (РАО) осуществляет управление правами на объекты авторского права (музыка с текстом, аранжировки и т.д.) на коллективной основе. Поскольку контент, полностью созданный ИИ, не является объектом авторского права в силу отсутствия творческого вклада автора (человека), РАО не имеет законных оснований для взыскания вознаграждения за использование музыки, созданной ИИ.</p>
            <p>В случае значительного творческого вклада пользователя сервиса в создание музыки, позволяющего отнести пользователя к автору, а создаваемую при таком значительном творческом вкладе музыку к музыкальному произведению, в соответствии с Пользовательским соглашением, все имущественные и личные не имущественные права на созданное музыкальное произведение переходят к пользователю, который с помощью сервиса создал данное музыкальное произведение.</p>
            <p>В отношении такого произведения Российское авторское общество (РАО) и Всероссийская организация интеллектуальной собственности (ВОИС) не имеют законных оснований для взыскания вознаграждения, а их аккредитация в силу пункта 3 статьи 1244 ГК РФ не распространяется на случаи, когда управление правами осуществляется самим правообладателем напрямую без посредничества организаций по коллективному управлению.</p>
            <p>Аналогичный вывод применим и к ВОИС</p>

            <p><strong>Юрисконсульт</strong><br />
            Гущин Д.М.<br />
            18 апреля 2026 года</p>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-700/50 bg-zinc-950/60 p-6">
            <h2 className="mb-4 text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Что важно для легальности модели
            </h2>
            <ul className="space-y-3 text-zinc-300" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <span>контент создаётся сервисом, а не берётся из обычного музыкального каталога;</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <span>право использования оформляется договором и описанием модели использования;</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalDataConsentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <a
          href="#/"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-red-500/50 hover:text-white"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Назад на главную
        </a>

        <div className="rounded-[2rem] border border-zinc-700/50 bg-gradient-to-br from-zinc-900/90 to-zinc-800/50 p-8 shadow-2xl shadow-black/30 sm:p-10">
          <h1 className="mb-6 text-3xl font-black leading-tight sm:text-4xl" style={{ fontFamily: 'Syne, sans-serif' }}>
            Согласие на обработку персональных данных
          </h1>

          <div className="space-y-4 text-base leading-8 text-zinc-300 sm:text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <p>
              Настоящим, проставляя отметку в форме на сайте, я свободно, своей волей и в своем интересе выражаю согласие на обработку
              моих персональных данных в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».
            </p>
            <p>
              Оператор персональных данных: AI-TV (далее — Оператор). Контакт для обращений по вопросам обработки персональных данных:
              micromillioner@gmail.com.
            </p>
            <p>
              Перечень персональных данных, на обработку которых дается согласие: имя, номер телефона, адрес электронной почты,
              Telegram-аккаунт, текст комментария, а также иные данные, которые я добровольно укажу в заявке.
            </p>
            <p>
              Цели обработки персональных данных: обработка и сопровождение заявок, обратная связь со мной, консультирование по услугам,
              подготовка и направление предложений, заключение и исполнение договоров.
            </p>
            <p>
              Перечень действий с персональными данными: сбор, запись, систематизация, накопление, хранение, уточнение (обновление,
              изменение), извлечение, использование, передача (предоставление, доступ) в случаях, предусмотренных законодательством РФ,
              обезличивание, блокирование, удаление, уничтожение.
            </p>
            <p>
              Обработка персональных данных может осуществляться как с использованием средств автоматизации, так и без их использования.
            </p>
            <p>
              Согласие действует с момента его предоставления и до достижения целей обработки либо до момента его отзыва субъектом
              персональных данных.
            </p>
            <p>
              Согласие может быть отозвано мной в любой момент путем направления письменного обращения на электронный адрес Оператора:
              micromillioner@gmail.com. Отзыв согласия не влияет на законность обработки, осуществленной до его получения Оператором.
            </p>
            <p>
              Подтверждаю, что ознакомлен(а) с условиями обработки персональных данных и принимаю их.
            </p>
            <p className="text-sm text-zinc-400 sm:text-base">
              Дата публикации: 23 апреля 2026 года.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const caseVideos = [
    {
      title: 'Фитнес-клуб',
      description: 'Энергичный плейлист для тренировочных зон и групповых занятий.',
      videoSrc: fitnessVideo,
      delay: 0.0,
    },
    {
      title: 'Пиццерия',
      description: 'Теплая семейная атмосфера с акцентом на лояльность к бренду.',
      videoSrc: pizzeriaVideo,
      delay: 0.1,
    },
    {
      title: 'Барбершоп',
      description: 'Стильный фон и фирменные голосовые вставки для мужского салона.',
      videoSrc: barbershopVideo,
      delay: 0.2,
    },
    {
      title: 'Кофейня',
      description: 'Спокойная атмосфера для утреннего и дневного потока гостей.',
      videoSrc: coffeeVideo,
      delay: 0.3,
    },
  ];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tg: '',
    message: '',
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/ai-tv/api/lead/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setStatus(res.ok ? 'Заявка отправлена 🚀' : 'Ошибка отправки');

      if (res.ok) {
        setFormData({ name: '', phone: '', email: '', tg: '', message: '' });
      }
    } catch (error) {
      setStatus('Ошибка соединения');
    }
  };

  const scrollToDemo = () => {
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-red-600/20 to-orange-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-600/20 to-pink-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
        <section className="min-h-[80vh] flex flex-col items-center justify-center text-center mb-20 sm:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 sm:space-y-8"
          >
            <motion.div
              className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-600/30 backdrop-blur-sm"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(239, 68, 68, 0.2)',
                  '0 0 40px rgba(239, 68, 68, 0.4)',
                  '0 0 20px rgba(239, 68, 68, 0.2)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-red-400 font-medium text-sm sm:text-base">AI-TV</span>
            </motion.div>

            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight max-w-5xl mx-auto leading-[1.1]"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Музыка для коммерческого использования{' '}
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
                без выплат РАО и ВОИС
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed px-4"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              AI-TV - это сервис легальной фоновой музыки для кафе, ресторанов, магазинов и любого бизнеса. AI генерирует треки, пишет и
              озвучивает рекламу и создаёт атмосферу бренда.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={scrollToDemo}
              className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 transition-all"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
              Попробовать
            </motion.button>
          </motion.div>
        </section>

        <section className="mb-20 sm:mb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Music2, text: 'Генерация музыки без авторских прав', delay: 0 },
              { icon: Radio, text: 'AI-диджей с рекламными вставками', delay: 0.1 },
              { icon: Palette, text: 'Музыка под бренд', delay: 0.2 },
              { icon: Video, text: 'Поддержка видео', delay: 0.3 },
            ].map((feature, index) => (
              <FadeInSection key={index} delay={feature.delay}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-zinc-700/50 backdrop-blur-sm hover:border-red-600/50 transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-600/0 to-orange-600/0 group-hover:from-red-600/5 group-hover:to-orange-600/5 transition-all" />
                  <div className="relative flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-600/30">
                      <feature.icon className="w-7 h-7 text-red-400" />
                    </div>
                    <p className="text-base sm:text-lg font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {feature.text}
                    </p>
                  </div>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </section>

        <section className="mb-20 sm:mb-32">
          <FadeInSection>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-12 sm:mb-16" style={{ fontFamily: 'Syne, sans-serif' }}>
              Примеры кейсов
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {caseVideos.map((item) => (
              <FadeInSection key={item.title} delay={item.delay}>
                <motion.article
                  whileHover={{ y: -8, scale: 1.01 }}
                  className="rounded-3xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900/90 to-zinc-800/50 p-4 sm:p-5 backdrop-blur-sm overflow-hidden"
                >
                  <video
                    className="w-full aspect-video rounded-2xl bg-zinc-950 border border-zinc-700/40"
                    controls
                    preload="metadata"
                    playsInline
                  >
                    <source src={item.videoSrc} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                  <div className="pt-4 space-y-2">
                    <h3 className="text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {item.title}
                    </h3>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {item.description}
                    </p>
                  </div>
                </motion.article>
              </FadeInSection>
            ))}
          </div>
        </section>

        <section className="mb-20 sm:mb-32">
          <FadeInSection>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-12 sm:mb-16" style={{ fontFamily: 'Syne, sans-serif' }}>
              Для вашего бизнеса
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: Coffee, title: 'Ресторан / Бар / Кафе', desc: 'Музыка + меню и акции', delay: 0 },
              { icon: Dumbbell, title: 'Фитнес Клуб', desc: 'Атмосфера + промо', delay: 0.15 },
              { icon: ShoppingBag, title: 'Магазин', desc: 'Музыка + скидки', delay: 0.3 },
            ].map((useCase, index) => (
              <FadeInSection key={index} delay={useCase.delay}>
                <motion.div
                  whileHover={{ y: -12, scale: 1.03 }}
                  className="group relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-zinc-900/90 to-zinc-800/50 border border-zinc-700/50 backdrop-blur-sm hover:border-orange-600/50 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-600/0 to-red-600/0 group-hover:from-orange-600/10 group-hover:to-red-600/10 transition-all" />
                  <div className="relative space-y-4">
                    <div className="p-4 w-fit rounded-2xl bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-600/30">
                      <useCase.icon className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {useCase.title}
                    </h3>
                    <p className="text-zinc-400 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {useCase.desc}
                    </p>
                  </div>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </section>

        <section className="mb-20 sm:mb-32">
          <FadeInSection>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-12 sm:mb-16" style={{ fontFamily: 'Syne, sans-serif' }}>
              Тарифы
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                name: 'Базовый',
                price: '1500₽',
                features: ['50 треков (~3 часа)', '5 бренд-фраз', '3 уникальных голоса', 'брендированный плейлист'],
                delay: 0,
                gradient: 'from-zinc-900 to-zinc-800',
              },
              {
                name: 'Плюс',
                price: '6000₽',
                features: ['200 треков (~12 часов)', '20 бренд-фраз', '12 рекламных объявлений', '6 уникальных голосов', 'брендированный плейлист'],
                delay: 0.1,
                gradient: 'from-zinc-800 to-zinc-900',
                featured: true,
              },
              {
                name: 'Бренд',
                price: '12000₽',
                features: ['500 треков (~30 часов)', '100 бренд-фраз', 'базовый голос', 'live ai-диджей', 'брендированный плейлист'],
                delay: 0.2,
                gradient: 'from-red-950/50 to-zinc-900',
              },
              {
                name: 'Премиум',
                price: '65000₽',
                features: ['500 треков', '50 бренд-фраз', '12 уникальных голосов', '30 рекламных объявлений', 'live ai-диджей', 'брендированный плейлист'],
                delay: 0.3,
                gradient: 'from-zinc-900 to-zinc-800',
              },
            ].map((plan, index) => (
              <FadeInSection key={index} delay={plan.delay}>
                <motion.div
                  whileHover={{ y: -12, scale: 1.03 }}
                  className={`group relative p-8 rounded-3xl bg-gradient-to-br ${plan.gradient} border ${
                    plan.featured ? 'border-red-600/70' : 'border-zinc-700/50'
                  } backdrop-blur-sm hover:border-red-600/70 transition-all cursor-pointer`}
                >
                  {plan.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-xs font-bold">
                      ПОПУЛЯРНЫЙ
                    </div>
                  )}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {plan.name}
                    </h3>
                    <div
                      className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {plan.price}
                    </div>
                    <ul className="space-y-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </section>

        <FadeInSection>
          <section className="mb-8 max-w-4xl mx-auto">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/70 to-zinc-900/80 border border-emerald-500/30 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/20">
                  <ShieldCheck className="h-6 w-6 text-emerald-300" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                    Юридическое обоснование
                  </h2>
<p className="text-base sm:text-lg text-zinc-300 leading-relaxed" style={{ fontFamily: 'Manrope, sans-serif' }}>
  Музыкальные произведения, созданные исключительно искусственным интеллектом без творческого вклада человека, 
  не признаются объектами авторского права по ст. 1257 ГК РФ и позиции Верховного суда, поскольку отсутствует автор — физическое лицо; 
  следовательно, такие произведения{" "}
  
  <span className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent font-bold">
    не подпадают под управление Российского авторского общества (РАО) и 
    Всероссийской организации интеллектуальной собственности (ВОИС)
  </span>
  
  , и обязанность по уплате вознаграждений за их использование 
  не возникает. Если же пользователь вносит существенный творческий вклад, он признаётся автором, 
  и права на произведение переходят к нему, при этом он{" "}
  
  <span className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent font-bold">
    вправе распоряжаться ими напрямую {" "}
  </span>
  
   без участия организаций по коллективному управлению.
</p>
                  <a
                    href="#/legal"
                    className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 font-semibold transition"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    Почему такая AI-музыка может использоваться без выплат РАО и ВОИС
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section className="mb-20 sm:mb-32 max-w-4xl mx-auto">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-zinc-700/50 backdrop-blur-sm">
              <h2 className="text-3xl sm:text-4xl font-black mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
                Почему это выгодно?
              </h2>
              <div className="space-y-4 text-lg text-zinc-300" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <p>Обычная музыка требует оплаты РАО и ВОИС. AI-TV даёт полностью легальную музыку без отчислений.</p>
                <p className="text-red-400 font-semibold">Вы снижаете расходы и создаёте уникальный аудио-бренд.</p>
              </div>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section id="demo-form" className="mb-20 scroll-mt-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-12" style={{ fontFamily: 'Syne, sans-serif' }}>
              Оставьте заявку на подключение или бесплатную консультацию
            </h2>

            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
              <input
                type="text"
                placeholder="Имя"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-700/50 focus:border-red-600/50 outline-none transition-colors text-white placeholder-zinc-500"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
              <input
                type="tel"
                placeholder="Телефон"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-700/50 focus:border-red-600/50 outline-none transition-colors text-white placeholder-zinc-500"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-700/50 focus:border-red-600/50 outline-none transition-colors text-white placeholder-zinc-500"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
              <input
                type="text"
                placeholder="Telegram"
                value={formData.tg}
                onChange={(e) => setFormData({ ...formData, tg: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-700/50 focus:border-red-600/50 outline-none transition-colors text-white placeholder-zinc-500"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
              <textarea
                placeholder="Комментарий"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-700/50 focus:border-red-600/50 outline-none transition-colors text-white placeholder-zinc-500 resize-none"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
              <label
                className="flex items-start gap-3 rounded-2xl border border-zinc-700/50 bg-zinc-900/60 px-4 py-3 text-zinc-300"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                <input
                  type="checkbox"
                  name="personalDataConsent"
                  required
                  className="mt-1 h-4 w-4 accent-red-500"
                />
                <span className="text-sm sm:text-base leading-relaxed">
                  Я даю{' '}
                  <a href="#/consent" className="text-red-400 underline decoration-red-400/60 underline-offset-2 hover:text-red-300">
                    согласие на обработку персональных данных
                  </a>
                  .
                </span>
              </label>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-8 py-5 text-lg font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 transition-all"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Отправить
              </motion.button>
              {status && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-lg font-semibold text-red-400"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {status}
                </motion.p>
              )}
            </form>
          </section>
        </FadeInSection>

        <footer className="text-center py-12 border-t border-zinc-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
          <div className="space-y-2 text-zinc-500">
            <p>📩 micromillioner@gmail.com</p>
            <p>📞 +7 921 851 47 59</p>
            <p className="mt-6 text-zinc-600">© 2026 AI-TV</p>
          </div>
        </footer>
      </div>

      <motion.button
        onClick={scrollToDemo}
        className="fixed bottom-6 right-6 p-4 sm:p-5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-2xl shadow-red-600/40 z-50"
        whileHover={{ scale: 1.1, rotate: 12 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 0 30px rgba(239, 68, 68, 0.4)',
            '0 0 50px rgba(239, 68, 68, 0.6)',
            '0 0 30px rgba(239, 68, 68, 0.4)',
          ],
        }}
        transition={{
          boxShadow: { duration: 2, repeat: Infinity },
        }}
      >
        <Rocket className="w-6 h-6" />
      </motion.button>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isLegalPage = route === '#/legal';
  const isConsentPage = route === '#/consent';

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="ru" />
        <title>
          {isLegalPage
            ? 'Почему AI-музыка от AI-TV легальна без выплат РАО и ВОИС'
            : isConsentPage
            ? 'Согласие на обработку персональных данных | AI-TV'
            : 'Музыка для бизнеса без РАО и ВОИС | AI-TV'}
        </title>
        <meta
          name="description"
          content={
            isLegalPage
              ? 'Объяснение правовой модели AI-TV: почему AI-музыка, сгенерированная сервисом, может использоваться без выплат РАО и ВОИС.'
              : isConsentPage
              ? 'Текст согласия на обработку персональных данных для пользователей сайта AI-TV.'
              : 'Легальная музыка для бизнеса без РАО и ВОИС. AI генерация треков, реклама и аудио атмосфера для кафе, ресторанов и магазинов.'
          }
        />
        <meta
          name="keywords"
          content={
            isLegalPage
              ? 'AI музыка, РАО, ВОИС, юридическое обоснование, музыка для бизнеса'
              : isConsentPage
              ? 'согласие на обработку персональных данных, 152-ФЗ, AI-TV'
              : 'музыка для бизнеса, без РАО, без ВОИС, музыка для кафе, фоновая музыка, AI музыка'
          }
        />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content={isLegalPage ? 'Юридическое объяснение AI-TV' : isConsentPage ? 'Согласие на обработку ПДн | AI-TV' : 'AI музыка для бизнеса'}
        />
        <meta
          property="og:description"
          content={
            isLegalPage
              ? 'Почему AI-музыка, сгенерированная сервисом, может использоваться без выплат РАО и ВОИС.'
              : isConsentPage
              ? 'Официальный текст согласия на обработку персональных данных.'
              : 'Музыка без авторских прав + AI реклама'
          }
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://cyberculturecorp.com/" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'AI-TV',
            url: 'https://cyberculturecorp.com',
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+79218514759',
              contactType: 'customer service',
            },
          })}
        </script>
      </Helmet>

      {isLegalPage ? <LegalExplanationPage /> : isConsentPage ? <PersonalDataConsentPage /> : <LandingPage />}
    </HelmetProvider>
  );
}
