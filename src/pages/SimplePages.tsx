import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useIsRTL } from '@/lib/useIsRTL';
import { Mail, CheckCircle2, AlertCircle, BookOpen, ShieldCheck, HeartHandshake, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SimplePageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function SimplePage({ title, subtitle, children }: SimplePageProps) {
  return (
    <div className="min-h-dvh bg-app flex flex-col">
      <Header variant="public" />
      <main className="flex-1 mx-auto max-w-4xl px-4 py-12 sm:px-6 w-full">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted mt-2 text-base">{subtitle}</p>}
        </div>
        <div className="prose prose-neutral dark:prose-invert max-w-none text-muted leading-relaxed space-y-6">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function AboutPage() {
  const isRTL = useIsRTL();

  return (
    <SimplePage
      title={isRTL ? 'عن التطبيق والمصادر والشكر' : 'About Farsi Plus & Sources'}
      subtitle={isRTL ? 'منصة تعليمية متخصصة لتعليم اللغة الفارسية للناطقين بالعربية' : 'Dedicated Persian language learning designed specifically for Arabic speakers'}
    >
      <div className="space-y-8">
        <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400 font-bold text-lg">
            <BookOpen size={22} />
            <h2>{isRTL ? 'رؤية التطبيق ومهمته' : 'Our Mission'}</h2>
          </div>
          <p className="leading-relaxed">
            {isRTL
              ? 'تطبيق "فارسي بلس" صُمم خصيصاً للمتعلم العربي بهدف تيسير تعلم اللغة الفارسية الحديثة (المعيار الطهراني الرسمي). يُركز المنهج على الاستفادة من المشتركات اللغوية الغنية بين اللغتين مع توضيح الفروق الدلالية والصوتية الدقيقة، متبعاً التدرج المنهجي للإطار الأوروبي المرجعي العام للغات (CEFR) من المستوى المبتدئ A0 حتى المتقدم.'
              : 'Farsi Plus is purpose-built for Arabic speakers to learn standard modern Iranian Persian (Tehrani standard). Our curriculum bridges the rich lexical and cultural overlaps between Arabic and Persian while highlighting crucial phonetic and semantic distinctions, aligned with CEFR standards from A0 to advanced.'}
          </p>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400 font-bold text-lg">
            <ShieldCheck size={22} />
            <h2>{isRTL ? 'المصادر المعتمدة والترخيص' : 'Sources & Licensing'}</h2>
          </div>
          <ul className="space-y-4 list-none p-0">
            <li className="border-b border-border/60 pb-3">
              <strong className="text-foreground block mb-1">
                1. Foreign Service Institute (FSI) Persian Basic Course
              </strong>
              <p className="text-sm">
                {isRTL
                  ? 'دورة معهد الخدمة الخارجية الأمريكي (FSI) لتعليم الفارسية. هذه المواد مُنتجة من قِبل جهة حكومية أمريكية وتندرج قانوناً تحت الملكية العامة (Public Domain)، مما يتيح استخدام منهجيتها وتمارينها التعليمية بحرية وأمان قانوني.'
                  : 'Produced by the US Foreign Service Institute. As an official work of the United States Government, these materials reside in the public domain and form a foundational pillar of our curriculum grammar and drills.'}
              </p>
            </li>
            <li className="border-b border-border/60 pb-3">
              <strong className="text-foreground block mb-1">
                2. معجم دهخدا (Dehkhoda Lexicon)
              </strong>
              <p className="text-sm">
                {isRTL
                  ? 'يُستخدم معجم دهخدا كمرجع لغوي ومعجمي مرجعي لتدقيق المعاني وأصول الكلمات والمفردات المشتركة. نلتزم بقواعد الاستخدام العادل للأغراض التعليمية غير التجارية (Fair Use for Educational Purposes) مع إفراد المعاني المعاصرة المتداولة.'
                  : 'Referenced as a linguistic authority and lexicon for etymological verification and lexical cross-checking under fair educational use principles.'}
              </p>
            </li>
            <li>
              <strong className="text-foreground block mb-1">
                3. مجمع اللغة والأدب الفارسي (Farhangestan)
              </strong>
              <p className="text-sm">
                {isRTL
                  ? 'نعتمد القواعد الإملائية الرسمية الصادرة عن مجمع اللغة الفارسية (فرهنگستان زبان و ادب فارسی)، وخاصة فيما يتعلق باستخدام الفاصل المجازي (ZWNJ) والحروف الفارسية الخاصة (گ، چ، پ، ژ).'
                  : 'We strictly follow standard orthography set by the Academy of Persian Language and Literature, particularly concerning the Zero-Width Non-Joiner (ZWNJ) and distinct Persian letters.'}
              </p>
            </li>
          </ul>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400 font-bold text-lg">
            <HeartHandshake size={22} />
            <h2>{isRTL ? 'شكر وتقدير' : 'Acknowledgements'}</h2>
          </div>
          <p className="text-sm leading-relaxed">
            {isRTL
              ? 'نتقدم بالشكر لكل المعلمين واللغويين الذين ساهموا في مراجعة وتدقيق المحتوى، وإلى مجتمع البرمجيات مفتوحة المصدر والخطوط الفارسية الرائعة مثل Vazirmatn للمصمم صابر راستگو.'
              : 'Special thanks to all linguists, educators, and the open-source community, with special credit to Saber Rastikerdar for the magnificent Vazirmatn typography.'}
          </p>
        </section>
      </div>
    </SimplePage>
  );
}

export function PrivacyPage() {
  const isRTL = useIsRTL();

  return (
    <SimplePage
      title={isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
      subtitle={isRTL ? 'آخر تحديث: أكتوبر ٢٠٢٦' : 'Last updated: October 2026'}
    >
      <div className="space-y-6 text-foreground/90">
        <p>
          {isRTL
            ? 'نحن في فارسي بلس نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية بما يتوافق مع المعايير العالمية واللائحة العامة لحماية البيانات (GDPR).'
            : 'At Farsi Plus, we respect your privacy and are committed to safeguarding your personal data in accordance with modern data protection standards including the GDPR.'}
        </p>

        <h3 className="text-xl font-bold text-foreground">
          {isRTL ? '١. البيانات التي نجمعها' : '1. Information We Collect'}
        </h3>
        <ul className="list-disc ps-6 space-y-2 text-sm text-muted">
          <li><strong>{isRTL ? 'بيانات الحساب:' : 'Account Details:'}</strong> {isRTL ? 'البريد الإلكتروني، الاسم المعروض، وكلمة المرور (المشفرة لدى مزود المصادقة Supabase Auth).' : 'Email address, display name, and securely hashed passwords.'}</li>
          <li><strong>{isRTL ? 'بيانات التعلّم والتقدّم:' : 'Learning Progress:'}</strong> {isRTL ? 'الدروس المكتملة، عدد النقاط (XP)، أيام الالتزام (الستريك)، الإنجازات والبطاقات التعليمية.' : 'Completed lessons, XP points, streaks, achievements, and spaced-repetition records.'}</li>
          <li><strong>{isRTL ? 'تفضيلات المستخدم:' : 'Preferences:'}</strong> {isRTL ? 'المنطقة الزمنية، أهداف التعلم اليومية، واللغة المفضلة للواجهة.' : 'Timezone, daily study goals, and interface language preferences.'}</li>
        </ul>

        <h3 className="text-xl font-bold text-foreground">
          {isRTL ? '٢. كيف نستخدم بياناتك' : '2. How We Use Your Data'}
        </h3>
        <p className="text-sm text-muted">
          {isRTL
            ? 'تُستخدم بياناتك فقط لتوفير الخدمة التعليمية وحساب تقدمك ومزامنة أدائك عبر الأجهزة. لا نقوم إطلاقاً ببيع أو تأجير بياناتك لأي أطراف ثالثة لأغراض دعائية.'
            : 'Your data is strictly utilized to deliver personalized language learning, sync progress across devices, and enhance course quality. We never sell or rent personal information to third parties.'}
        </p>

        <h3 className="text-xl font-bold text-foreground">
          {isRTL ? '٣. حقوقك وتصدير البيانات وحذف الحساب' : '3. Your Rights & Data Portability'}
        </h3>
        <p className="text-sm text-muted">
          {isRTL
            ? 'يمكنك في أي وقت تصدير كافة بياناتك التعليمية في صيغة JSON أو حذف حسابك بصورة نهائية مباشرة من صفحة الملف الشخصي، أو بمراسلتنا على support@farsiplus.app.'
            : 'You can export all your learning progress as a JSON archive or permanently delete your account directly from your Profile settings or by emailing support@farsiplus.app.'}
        </p>
      </div>
    </SimplePage>
  );
}

export function TermsPage() {
  const isRTL = useIsRTL();

  return (
    <SimplePage
      title={isRTL ? 'شروط الاستخدام' : 'Terms of Service'}
      subtitle={isRTL ? 'آخر تحديث: أكتوبر ٢٠٢٦' : 'Last updated: October 2026'}
    >
      <div className="space-y-6 text-foreground/90">
        <p>
          {isRTL
            ? 'باستخدامك لتطبيق فارسي بلس، فإنك توافق على الالتزام بشروط الخدمة هذه. يرجى قراءتها بعناية.'
            : 'By accessing or using Farsi Plus, you agree to be bound by these Terms of Service. Please read them carefully.'}
        </p>

        <h3 className="text-xl font-bold text-foreground">
          {isRTL ? '١. الاستخدام التعليمي والشخصي' : '1. Educational and Personal Use'}
        </h3>
        <p className="text-sm text-muted">
          {isRTL
            ? 'الخدمة مخصصة للاستخدام الشخصي والتعليمي غير التجاري. لا يجوز استخراج المحتوى البرمجي أو الأكاديمي آلياً (Scraping) أو إعادة نشره بصورة تجارية دون إذن مسبق.'
            : 'Farsi Plus is intended solely for personal, non-commercial educational study. Automated scraping or commercial redistribution without prior written consent is strictly prohibited.'}
        </p>

        <h3 className="text-xl font-bold text-foreground">
          {isRTL ? '٢. السلوك والمسؤولية' : '2. User Conduct'}
        </h3>
        <p className="text-sm text-muted">
          {isRTL
            ? 'يلتزم المستخدم بعدم التلاعب بلوائح المتصدرين أو استغلال الثغرات البرمجية. نحتفظ بالحق في تعليق أي حساب يخالف شروط النزاهة.'
            : 'Users agree not to exploit vulnerabilities or artificially alter leaderboards or progress. We reserve the right to suspend accounts engaging in abusive conduct.'}
        </p>

        <h3 className="text-xl font-bold text-foreground">
          {isRTL ? '٣. حدود المسؤولية' : '3. Limitation of Liability'}
        </h3>
        <p className="text-sm text-muted">
          {isRTL
            ? 'تُقدم الخدمة "كما هي" دون ضمانات من أي نوع، ونسعى دائماً لضمان استمرارية الخوادم ودقة المحتوى اللغوي.'
            : 'The service is provided on an "as is" and "as available" basis without warranties of any kind. We strive for maximum reliability and continuous educational accuracy.'}
        </p>
      </div>
    </SimplePage>
  );
}

export function ContactPage() {
  const isRTL = useIsRTL();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (!email.trim() || !message.trim()) {
      setErrorMsg(isRTL ? 'يرجى إدخال البريد الإلكتروني ونص الرسالة.' : 'Email and message are required.');
      return;
    }

    if (message.length > 2000) {
      setErrorMsg(isRTL ? 'الرسالة طويلة جداً (الحد الأقصى ٢٠٠٠ حرف).' : 'Message is too long (maximum 2000 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id ?? null,
        name: name.trim() || null,
        email: email.trim(),
        subject: subject.trim() || null,
        message: message.trim(),
        status: 'new',
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setErrorMsg(isRTL ? `تعذر إرسال الرسالة: ${msg}` : `Failed to submit message: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SimplePage
      title={isRTL ? 'تواصل معنا' : 'Contact Us'}
      subtitle={isRTL ? 'يسعدنا دائماً تلقي اقتراحاتكم واستفساراتكم' : 'We would love to hear from you. Send us your feedback or questions.'}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {success && (
                <div className="p-4 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 text-success-800 dark:text-success-200 flex items-center gap-3 text-sm">
                  <CheckCircle2 size={20} className="shrink-0 text-success-600" />
                  <p>{isRTL ? 'تم استلام رسالتك بنجاح! سنرد عليك في أقرب وقت.' : 'Your message has been sent successfully! We will get back to you soon.'}</p>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-200 flex items-center gap-3 text-sm">
                  <AlertCircle size={20} className="shrink-0 text-danger-600" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <Input
                label={isRTL ? 'الاسم (اختياري)' : 'Name (Optional)'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isRTL ? 'اسمك الكريم' : 'Your name'}
                disabled={submitting}
              />

              <Input
                label={isRTL ? 'البريد الإلكتروني *' : 'Email Address *'}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={submitting}
              />

              <Input
                label={isRTL ? 'موضوع الرسالة' : 'Subject'}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isRTL ? 'استفسار عن الدروس، مشكلة فنية، إلخ' : 'Lesson inquiry, technical issue, etc.'}
                disabled={submitting}
              />

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">
                  {isRTL ? 'نص الرسالة *' : 'Message *'}
                </label>
                <textarea
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isRTL ? 'اكتب رسالتك أو اقتراحك بالتفصيل هنا...' : 'Write your feedback or message here...'}
                  required
                  maxLength={2000}
                  disabled={submitting}
                />
                <span className="text-xs text-muted block text-end mt-1">
                  {message.length} / 2000
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={submitting}
                disabled={submitting}
              >
                {isRTL ? 'إرسال الرسالة' : 'Send Message'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400 font-bold">
              <Mail size={22} />
              <h3 className="text-base">{isRTL ? 'البريد المباشر' : 'Direct Support'}</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {isRTL
                ? 'يمكنك أيضاً مراسلة فريق الدعم الفني والأكاديمي مباشرة عبر البريد الإلكتروني:'
                : 'You can also reach out directly to our support and academic team at:'}
            </p>
            <a
              href="mailto:support@farsiplus.app"
              className="font-mono text-sm text-primary-600 dark:text-primary-400 font-bold hover:underline block break-all"
            >
              support@farsiplus.app
            </a>
          </Card>

          <Card className="p-6 space-y-3 bg-primary-50/50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800">
            <h4 className="font-bold text-sm text-primary-700 dark:text-primary-300">
              {isRTL ? 'أوقات الاستجابة' : 'Response Times'}
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              {isRTL
                ? 'يتم الرد على جميع البلاغات والاستفسارات اللغوية خلال ٢٤ إلى ٤٨ ساعة عمل.'
                : 'All linguistic feedback and support requests are answered within 24 to 48 business hours.'}
            </p>
          </Card>
        </div>
      </div>
    </SimplePage>
  );
}

export function NotFoundPage() {
  const isRTL = useIsRTL();

  return (
    <div className="min-h-dvh bg-app flex items-center justify-center px-4">
      <div className="text-center max-w-md p-8 rounded-2xl bg-card border border-border shadow-sm">
        <div className="font-persian text-7xl font-extrabold text-primary-500 mb-4 select-none">۴۰۴</div>
        <h1 className="text-2xl font-bold mb-2 text-foreground">
          {isRTL ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h1>
        <p className="text-muted text-sm mb-6">
          {isRTL
            ? 'عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.'
            : "The page you're looking for doesn't exist or has been moved."}
        </p>
        <Link to="/">
          <Button variant="primary" className="inline-flex items-center gap-2">
            {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            {isRTL ? 'العودة للرئيسية' : 'Return Home'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
