(() => {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;

  if (!window.supabase || !url || !key) return;

  const db = window.supabase.createClient(url, key);

  async function loadTheme() {
    const { data, error } = await db
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) return;

    const fields = {
      'theme-primary': data.primary_color,
      'theme-background': data.background_color,
      'theme-text': data.text_color,
      'theme-font': data.font_family,
      'theme-size': data.font_size
    };

    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && value !== null && value !== undefined) {
        el.value = value;
      }
    });
  }

  const form = document.getElementById('theme-form');

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();

      const msg = document.getElementById('theme-msg');
      msg.textContent = 'تنظیمات ظاهری فعلاً در حال آماده‌سازی است.';
    });
  }

  loadTheme();
})();
