import { useState, useEffect } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { motion, useInView } from 'motion/react';
import { Music2, Radio, Palette, Video, Coffee, Dumbbell, ShoppingBag, Check, Rocket } from 'lucide-react';
import { useRef } from 'react';

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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

export default function App() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tg: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/ai-tv/api/lead/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
    <HelmetProvider>
      <Helmet>
        <html lang="ru" />
        <title>Музыка для бизнеса без РАО и ВОИС | AI-TV</title>
        <meta name="description" content="Легальная музыка для бизнеса без РАО и ВОИС. AI генерация треков, реклама и аудио атмосфера для кафе, ресторанов и магазинов." />
        <meta name="keywords" content="музыка для бизнеса, без РАО, без ВОИС, музыка для кафе, фоновая музыка, AI музыка" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content="AI музыка для бизнеса" />
        <meta property="og:description" content="Музыка без авторских прав + AI реклама" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://cyberculturecorp.com/" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "AI-TV",
            "url": "https://cyberculturecorp.com",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+79218514759",
              "contactType": "customer service"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-x-hidden">
        {/* Animated background elements */}
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
              ease: "easeInOut"
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
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          {/* Hero Section */}
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
                    "0 0 20px rgba(239, 68, 68, 0.2)",
                    "0 0 40px rgba(239, 68, 68, 0.4)",
                    "0 0 20px rgba(239, 68, 68, 0.2)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-red-400 font-medium text-sm sm:text-base">AI-TV</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight max-w-5xl mx-auto leading-[1.1]" style={{ fontFamily: 'Syne, sans-serif' }}>
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
                AI-TV - это сервис легальной фоновой музыки для кафе, ресторанов, магазинов и любого бизнеса.
                AI генерирует треки, пишет и озвучивает рекламу и создаёт атмосферу бренда.
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

          {/* Features Grid */}
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

          {/* Use Cases */}
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

          {/* Pricing */}
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
                  gradient: 'from-zinc-900 to-zinc-800'
                },
                {
                  name: 'Плюс',
                  price: '6000₽',
                  features: ['200 треков (~12 часов)', '20 бренд-фраз', '12 рекламных объявлений', '6 уникальных голосов', 'брендированный плейлист'],
                  delay: 0.1,
                  gradient: 'from-zinc-800 to-zinc-900',
                  featured: true
                },
                {
                  name: 'Бренд',
                  price: '12000₽',
                  features: ['500 треков (~30 часов)', '100 бренд-фраз', 'базовый голос', 'live ai-диджей', 'брендированный плейлист'],
                  delay: 0.2,
                  gradient: 'from-red-950/50 to-zinc-900'
                },
                {
                  name: 'Премиум',
                  price: '65000₽',
                  features: ['500 треков', '50 бренд-фраз', '12 уникальных голосов', '30 рекламных объявлений', 'live ai-диджей', 'брендированный плейлист'],
                  delay: 0.3,
                  gradient: 'from-zinc-900 to-zinc-800'
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
                      <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent" style={{ fontFamily: 'Syne, sans-serif' }}>
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

          {/* Why Section */}
          <FadeInSection>
            <section className="mb-20 sm:mb-32 max-w-4xl mx-auto">
              <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-zinc-700/50 backdrop-blur-sm">
                <h2 className="text-3xl sm:text-4xl font-black mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Почему это выгодно?
                </h2>
                <div className="space-y-4 text-lg text-zinc-300" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  <p>
                    Обычная музыка требует оплаты РАО и ВОИС. AI-TV даёт полностью легальную музыку без отчислений.
                  </p>
                  <p className="text-red-400 font-semibold">
                    Вы снижаете расходы и создаёте уникальный аудио-бренд.
                  </p>
                </div>
              </div>
            </section>
          </FadeInSection>

          {/* Contact Form */}
          <FadeInSection>
            <section id="demo-form" className="mb-20 scroll-mt-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-12" style={{ fontFamily: 'Syne, sans-serif' }}>
                Получите демо музыки
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

          {/* Footer */}
          <footer className="text-center py-12 border-t border-zinc-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <div className="space-y-2 text-zinc-500">
              <p>📩 micromillioner@gmail.com</p>
              <p>📞 +7 921 851 47 59</p>
              <p className="mt-6 text-zinc-600">© 2026 AI-TV</p>
            </div>
          </footer>
        </div>

        {/* Floating CTA */}
        <motion.button
          onClick={scrollToDemo}
          className="fixed bottom-6 right-6 p-4 sm:p-5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-2xl shadow-red-600/40 z-50"
          whileHover={{ scale: 1.1, rotate: 12 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              "0 0 30px rgba(239, 68, 68, 0.4)",
              "0 0 50px rgba(239, 68, 68, 0.6)",
              "0 0 30px rgba(239, 68, 68, 0.4)",
            ],
          }}
          transition={{
            boxShadow: { duration: 2, repeat: Infinity },
          }}
        >
          <Rocket className="w-6 h-6" />
        </motion.button>
      </div>
    </HelmetProvider>
  );
}
