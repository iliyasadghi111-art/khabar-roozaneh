
(() => {
  const $ = id => document.getElementById(id);

  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;

  if (!window.supabase || !url || !key) {
    console.error('Supabase configuration is missing.');
    return;
  }

  const db = window.supabase.createClient(url, key);
  const BUCKET = 'news-files';

  async function upload(file, folder) {
    if (!file) return null;

    if (file.size > 8 * 1024 * 1024) {
      throw new Error('حجم فایل نباید بیشتر از ۸ مگابایت باشد.');
    }

    const ext = file.name.split('.').pop().toLowerCase();

    if (!/^[a-z0-9]+$/.test(ext)) {
      throw new Error('پسوند فایل معتبر نیست.');
    }

    const path =
      `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (error) throw error;

    return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function loadTheme() {
    const { data, error } = await db
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('Theme loading error:', error);
      return;
    }

    if (!data) return;

    const fields = {
      'theme-primary': data.primary_color,
      'theme-background': data.background_color,
      'theme-text': data.text_color,
      'theme-font': data.font_family,
      'theme-size': data.font_size
    };

    Object.entries(fields).forEach(([id, value]) => {
      const el = $(id);
      if (el && value !== null && value !== undefined) {
        el.value = value;
      }
    });
  }

  const form = $('theme-form');

  if (!form) {
    console.error('Theme form not found.');
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const msg = $('theme-msg');
    const button = form.querySelector('[type="submit"]');

    if (button) button.disabled = true;
    if (msg) msg.textContent = 'در حال ذخیره تنظیمات...';

    try {
      const logo = await upload($('theme-logo-file')?.files[0], 'logo');
      const banner = await upload($('theme-banner-file')?.files[0], 'banner');
      const font = await upload($('theme-font-file')?.files[0], 'fonts');

      const settings = {
        id: 1,
        primary_color: $('theme-primary')?.value || '#142b4a',
        background_color: $('theme-background')?.value || '#ffffff',
        text_color: $('theme-text')?.value || '#222222',
        font_family: $('theme-font')?.value || 'Tahoma',
        font_size: Number($('theme-size')?.value || 16)
      };

      if (logo) settings.logo_url = logo;
      if (banner) settings.banner_url = banner;
      if (font) settings.font_url = font;

      const { error } = await db
        .from('site_settings')
        .upsert(settings, { onConflict: 'id' });

      if (error) throw error;

      if (msg) msg.textContent = 'تنظیمات با موفقیت ذخیره شد.';

    } catch (error) {
      console.error('Theme save error:', error);
      if (msg) msg.textContent = 'خطا: ' + error.message;
    } finally {
      if (button) button.disabled = false;
    }
  });

  loadTheme();
  console.log('THEME ADMIN JS LOADED');
})();
