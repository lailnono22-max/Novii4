# إعداد Supabase Storage لرفع الصور الشخصية

## خطوات الإعداد

### 1. إنشاء Storage Bucket

1. افتح مشروع Supabase الخاص بك
2. من القائمة الجانبية، اختر **Storage**
3. اضغط على **"New bucket"** أو **"Create a new bucket"**
4. قم بإدخال التفاصيل التالية:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **نعم** (حتى تكون الصور متاحة للجميع)
   - **File size limit**: 5 MB (اختياري)
   - **Allowed MIME types**: `image/*` (اختياري)

5. اضغط **"Create bucket"**

### 2. إعداد Storage Policies (السياسات الأمنية)

بعد إنشاء الـ bucket، تحتاج إلى إضافة سياسات أمنية للسماح للمستخدمين برفع وحذف صورهم فقط.

#### الطريقة الأولى: عبر واجهة Supabase (UI)

1. اذهب إلى **Storage** > **Policies** في قائمة الـ bucket
2. اضغط **"New Policy"**
3. أضف السياسات التالية:

**Policy 1: السماح برؤية جميع الصور (Public Read)**
```
Policy Name: Public Access
Operation: SELECT
Policy Definition: true
```

**Policy 2: السماح بالرفع للمستخدمين المصادقين فقط**
```
Policy Name: Authenticated users can upload
Operation: INSERT
Policy Definition: 
(bucket_id = 'avatars' AND auth.role() = 'authenticated')
```

**Policy 3: السماح بتحديث الصور الخاصة بالمستخدم فقط**
```
Policy Name: Users can update own avatars
Operation: UPDATE
Policy Definition:
(bucket_id = 'avatars' AND auth.role() = 'authenticated')
```

**Policy 4: السماح بحذف الصور الخاصة بالمستخدم فقط**
```
Policy Name: Users can delete own avatars
Operation: DELETE
Policy Definition:
(bucket_id = 'avatars' AND auth.role() = 'authenticated')
```

#### الطريقة الثانية: عبر SQL Editor (أسرع)

افتح **SQL Editor** في Supabase والصق هذا الكود:

```sql
-- Enable public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Enable authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Enable users to update their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Enable users to delete their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

### 3. التحقق من الإعداد

بعد تطبيق السياسات، يجب أن تكون قادراً على:
- ✅ رفع الصور من خلال زر "Upload Photo" في صفحة تعديل البروفايل
- ✅ معاينة الصورة قبل الحفظ
- ✅ رؤية الصورة الشخصية في البروفايل بعد الحفظ

### 4. ملاحظات مهمة

- **حجم الملف**: الحد الأقصى 5 ميجابايت
- **أنواع الملفات المسموحة**: JPG, PNG, GIF, WebP
- **التخزين**: الصور تُخزن في مسار `avatars/<user-id>-<timestamp>.ext`
- **الأمان**: كل مستخدم يمكنه فقط رفع وحذف صوره الخاصة

### 5. استكشاف الأخطاء

إذا واجهت مشاكل:

**خطأ: "Row Level Security policy violation"**
- تأكد من إنشاء جميع السياسات الأمنية المذكورة أعلاه
- تأكد من تفعيل RLS على الـ bucket

**خطأ: "Bucket not found"**
- تأكد من أن اسم الـ bucket هو `avatars` بالضبط
- تأكد من أن الـ bucket تم إنشاؤه بنجاح

**الصورة لا تظهر بعد الرفع**
- تأكد من أن الـ bucket عام (Public)
- تحقق من Console في المتصفح لمعرفة الأخطاء

## كيفية الاستخدام

1. اذهب إلى صفحة البروفايل
2. اضغط على **"Edit Profile"**
3. اضغط على **"Upload Photo"**
4. اختر صورة من جهازك (JPG, PNG, GIF)
5. ستظهر معاينة للصورة
6. اضغط **"Save Changes"** لحفظ البروفايل مع الصورة الجديدة

أو من خلال الإعدادات:
1. اذهب إلى **Settings** (⚙️)
2. اختر **"Edit Profile"** من القائمة
3. اضغط على **"Change Photo"**
4. اتبع نفس الخطوات السابقة

---
**تم التحديث**: نوفمبر 20, 2025
