# Database Schema for Novii Platform

هذا المجلد يحتوي على ملف SQL شامل لإعداد قاعدة بيانات Supabase لمنصة Novii.

## الملف الرئيسي

**schema.sql** - ملف واحد يحتوي على كل شيء:
- جميع الجداول (Profiles, Posts, Follows, Likes, Comments, Saved Posts)
- جميع السياسات الأمنية (Row Level Security)
- Storage Bucket للصور الشخصية
- جميع الـ Functions والـ Triggers
- Indexes لتحسين الأداء

## كيفية التطبيق

### الطريقة الأولى: من خلال Supabase Dashboard (الأسهل)

1. افتح مشروع Supabase الخاص بك
2. اذهب إلى **SQL Editor**
3. اضغط على **"New Query"**
4. انسخ محتوى ملف `schema.sql` بالكامل
5. الصق المحتوى في SQL Editor
6. اضغط على **"Run"** أو **Ctrl+Enter**
7. انتظر حتى يتم تنفيذ جميع الاستعلامات (قد يستغرق بضع ثوانٍ)

### الطريقة الثانية: باستخدام Supabase CLI

```bash
# تأكد من تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref your-project-ref

# تطبيق الـ schema
supabase db execute --file database/schema.sql
```

### الطريقة الثالثة: تنفيذ يدوي عبر psql

```bash
psql -h your-db-host -U postgres -d postgres -f database/schema.sql
```

## الميزات الأمنية

جميع الجداول محمية بـ Row Level Security (RLS) مع السياسات التالية:

- **Profiles**: يمكن للجميع مشاهدة الملفات العامة، ولكن التحديث للمالك فقط
- **Posts**: يمكن مشاهدة منشورات الحسابات العامة، التحديث والحذف للمالك فقط
- **Storage**: رفع وحذف الصور للمستخدم المصادق فقط
- **Follows**: يمكن للجميع المشاهدة، المتابعة وإلغاء المتابعة للمستخدم المصادق فقط
- **Likes**: يمكن للجميع المشاهدة، الإعجاب وإلغاء الإعجاب للمستخدم المصادق فقط
- **Comments**: يمكن للجميع المشاهدة، التعليق والتحديث والحذف للمالك فقط
- **Saved Posts**: الوصول للمالك فقط

## العدادات التلقائية

الجداول تحتوي على triggers تلقائية لتحديث العدادات:

- `posts_count` في جدول profiles
- `followers_count` و `following_count` في جدول profiles
- `likes_count` في جدول posts
- `comments_count` في جدول posts

## التحقق من التطبيق

بعد تطبيق الـ migrations، تحقق من:

```sql
-- التحقق من الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- التحقق من السياسات
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- التحقق من Storage bucket
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

## ملاحظات مهمة

1. **تنفيذ مرة واحدة فقط**: لا تقم بتنفيذ الملف أكثر من مرة على نفس قاعدة البيانات
2. **قاعدة بيانات فارغة**: من الأفضل تنفيذ هذا الملف على قاعدة بيانات جديدة/فارغة
3. **IF NOT EXISTS**: الملف يستخدم `IF NOT EXISTS` لتجنب الأخطاء إذا كانت الجداول موجودة بالفعل
4. **حذف وإعادة البناء**: إذا كنت تريد البدء من جديد، احذف كل شيء أولاً:

```sql
-- حذف جميع الجداول (احذر: سيتم فقدان جميع البيانات!)
DROP TABLE IF EXISTS saved_posts CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- حذف Storage bucket
DELETE FROM storage.buckets WHERE id = 'avatars';
```

## الدعم والمساعدة

إذا واجهت أي مشاكل:
1. تحقق من سجلات Supabase
2. راجع رسائل الأخطاء في SQL Editor
3. تأكد من أن المستخدم لديه الصلاحيات الكافية
4. راجع [Supabase Documentation](https://supabase.com/docs)
