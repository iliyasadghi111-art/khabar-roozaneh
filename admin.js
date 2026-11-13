async function uploadFile(file, folder) {
  if (!file) return null;

  if (file.size > 8 * 1024 * 1024) {
    throw new Error('حجم عکس نباید بیشتر از ۸ مگابایت باشد.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('فقط فایل تصویری انتخاب کن.');
  }

  const extension = file.name.split('.').pop().toLowerCase();
  const safeExtension = /^[a-z0-9]+$/.test(extension)
    ? extension
    : 'jpg';

  const path =
    `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExtension}`;

  const cleanFile = new File(
    [file],
    `image.${safeExtension}`,
    { type: file.type }
  );

  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, cleanFile, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);

  return data.publicUrl;
}
