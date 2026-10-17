# فارسي بلس | Farsi Plus

منصة تفاعلية متكاملة لتعلّم اللغة الفارسية، مصممة خصيصاً للمتحدثين بالعربية وفق معايير الإطار الأوروبي المرجعي العام للغات (CEFR).

An interactive Persian (Farsi) language-learning web app designed for Arabic speakers, featuring gamified lessons, spaced repetition flashcards, weekly leagues, streaks, and comprehensive admin controls.

---

## 🛠 التقنيات المستخدمة | Tech Stack

- **React 18 + Vite 5 + TypeScript** — تطبيق ويب سريع وخفيف (SPA)
- **Tailwind CSS** — نظام تصميم متناسق ومستوحى من الفن الفارسي
- **Framer Motion** — مؤثرات حركية تفاعلية دقيقة مع دعم تقليل الحركة (`prefers-reduced-motion`)
- **Zustand** — إدارة الحالة المحلية (Auth, UI, Lessons)
- **React Router 7** — التوجيه مع تقسيم الحزم والتحميل الكسول (`React.lazy`)
- **i18next** — دعم كامل للغتين العربية والإنجليزية مع اتجاه RTL الصحيح
- **Supabase** — قاعدة بيانات PostgreSQL، مصادقة آمنة، سياسات أمان صارمة (RLS)، دوال خادم `SECURITY DEFINER`
- **Vitest** — اختبارات وحدة شاملة للتحقق من تطبيع النصوص ومنطق الدروس
- **Vazirmatn & Cairo** — خطوط محسنة ومحملة بالأوزان والمجموعات الضرورية فقط

---

## 🚀 خطوات التثبيت والتشغيل المحلي | Local Setup

### ١. تثبيت التبعيات

```bash
npm install
```

### ٢. إعداد متغيرات البيئة

أنشئ ملف `.env` بناءً على `.env.example`:

```bash
cp .env.example .env
```

املأ القيم الخاصة بمشروع Supabase الخاص بك:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

> **ملاحظة أمنية هامة:** لا تضع إطلاقاً مفاتيح `service_role` أو `STRIPE_SECRET_KEY` في ملفات الواجهة الأمامية (`VITE_*`).

### ٣. تشغيل الاختبارات

```bash
npm run test
```

### ٤. فحص الأخطاء والأنواع

```bash
npm run lint
npm run typecheck
```

### ٥. تشغيل خادم التطوير

```bash
npm run dev
```

### ٦. بناء حزمة الإنتاج

```bash
npm run build
```

---

## 🗄️ إعداد قاعدة بيانات Supabase | Supabase Database Setup

قم بتشغيل ملفات الـ migrations التالية بالترتيب الزمني الدقيق إما عبر `supabase db push` أو بنسخ محتواها بالترتيب إلى **Supabase SQL Editor**:

1. `20261016182928_create_profiles_and_content_tables.sql` — جداول المحتوى والمستخدمين الأساسية
2. `20261016183550_seed_stage1_stage_units_lessons.sql` — بذر المرحلة الأولى والوحدات والدروس
3. `20261016183732_seed_stage1_vocabulary.sql` — بذر مفردات الحروف الأبجدية
4. `20261016183822_seed_stage1_exercises.sql` — بذر تمارين الدروس 1 إلى 6
5. `20261016185209_harden_award_xp_and_lock_profile_fields.sql` — تحصين دوال XP
6. `20261016191846_phase4b_streaks_shop_achievements_quests.sql` — نظام المتجر والستريك والمهام اليومية
7. `20261016193606_add_purchase_quest_achievements.sql` — إنجازات المتجر
8. `20261016193627_update_check_achievements_for_new_codes.sql` — تحديث فحص الإنجازات
9. `20261016194044_phase7a_admin_leagues_certificates.sql` — لوحات المتصدرين والشهادات وسجل الإدارة
10. `20261016194425_add_ad_placements_table.sql` — مواضع الإعلانات
11. `20261017090536_revoke_anon_sensitive_profile_columns.sql` — حجب أعمدة الحساب الحساسة عن الزوار
12. `20261017090552_revoke_anon_table_update_profiles.sql` — سحب صلاحيات التعديل من anon
13. `20261017090623_fix_persian_normalization.sql` — تصحيح أولي لتهجئة المفردات
14. `20261017090713_seed_exercises_lessons_7_to_33.sql` — بذر تمارين دروس الحروف من 7 إلى 33
15. `20261017090729_clear_needs_review_seeded_content.sql` — تسوية أولية لأعلام المراجعة
16. `20261017090744_clear_needs_review_all_seeded.sql` — تسوية أولية للمحتوى المبذور
17. `20261017100000_stage1_user_trigger_and_hearts.sql` — مُشغّل إنشاء الحسابات التلقائي وتجديد القلوب
18. `20261017110000_stage2_secure_profiles_and_game_tables_rls.sql` — قفل ثغرات RLS ومنع التلاعب بنقاط اللعبة والصلاحيات
19. `20261017111000_stage2_secure_lesson_attempts_and_complete_lesson.sql` — نظام محاولات الدروس والتحقق الزمني ومكافحة استغلال XP والجواهر
20. `20261017112000_stage2_fix_rpcs_and_leagues.sql` — قفل التزامن الذري لشراء المتجر وحساب دوريات XP الأسبوعية
21. `20261017113000_stage2_secure_exercises_and_review_filter.sql` — إخفاء المحتوى غير المراجع عن المتعلمين
22. `20261017114000_stage3_flashcard_review_and_practice.sql` — مراجعة البطاقات الذكية بخوارزمية SM-2 وتجديد القلوب بالتمرين
23. `20261017120000_stage4_reset_needs_review_and_fix_persian_trans.sql` — تطبيع الحروف الفارسية وإلزام المراجعة للمحتوى المولد
24. `20261017130000_stage5_add_missing_indexes.sql` — فهارس الأداء العالي للجداول الحيوية

---

## 👑 تعيين أول مدير للنظام (Admin Setup)

بعد إنشاء أول حساب عبر واجهة التطبيق، قم بترقية هذا الحساب إلى مدير بتنفيذ الأمر التالي في **Supabase SQL Editor**:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

بمجرد ترقية الحساب، ستظهر لك لوحة التحكم الإدارية عبر المسار `/admin`.

---

## 🌐 النشر على خوادم الإنتاج (Deployment)

التطبيق مهيأ بالكامل للنشر الفوري على أي منصة استضافة تدعم تطبيقات الصفحة الواحدة (SPA):

- **Vercel**: تم تضمين ملف `vercel.json` لإعادة توجيه المسارات إلى `/index.html`.
- **Netlify / Cloudflare Pages**: تم تضمين ملف `public/_redirects` (`/* /index.html 200`).

---

## 📜 المصادر وحقوق الملكية

- **FSI Persian Course**: مواد لغوية رسمية من معهد الخدمة الخارجية الأمريكي (ملك عام - Public Domain).
- **معجم دهخدا**: مرجع معجمي وتاريخي تحت مبادئ الاستخدام العادل للأغراض التعليمية.
- **فرهنگستان**: الالتزام بالقواعد الإملائية والخطية المعتمدة للغة الفارسية المعاصرة.
- للتواصل والاستفسارات: `support@farsiplus.app`.
