(() => {
  const $ = id => document.getElementById(id);

  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;

  const valid =
    window.supabase &&
    typeof url === 'string' &&
    url.startsWith('https://') &&
    typeof key === 'string' &&
    key.length > 10;

  if (!valid) {
    $('setup-warning').textContent = 'تنظیمات Supabase کامل نیست.';
    $('setup-warning').classList.remove('hidden');
    $('login-box').classList.add('hidden');
    return;
  }

  const db = window.supabase.createClient(url, key);
  const BUCKET = 'news-files';

  const esc = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  let editing = null;
  let editingImageUrl = '';

  async function uploadFile(file, folder) {
    if (!file) return null;

    if (file.size > 8 * 1024 * 1024) {
      throw new Error('حجم عکس نباید بیشتر از ۸ مگابایت باشد.');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('فقط فایل تصویری انتخاب کن.');
    }

    const extension = file.name.split('.').pop().toLowerCase();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data } = db.storage.from(BUCKET).getPublicUrl(path);

    return data.publicUrl;
  }

  async function state() {
    const { data, error } = await db.auth.getSession();

    if (error) {
      $('login-msg').textContent = 'خطا در بررسی ورود: ' + error.message;
      return;
    }

    const session = data.session;

    $('login-box').classList.toggle('hidden', !!session);
    $('dashboard').classList.toggle('hidden', !session);
    $('logout').classList.toggle('hidden', !session);

    if (session) await list();
  }

  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();

    $('login-msg').textContent = 'در حال ورود…';

    const { error } = await db.auth.signInWithPassword({
      email: $('email').value.trim(),
      password: $('password').value
    });

    if (error) {
      $('login-msg').textContent = 'ورود ناموفق بود: ' + error.message;
      return;
    }

    $('login-msg').textContent = 'ورود موفق بود.';
    await state();
  });

  $('logout').onclick = async () => {
    await db.auth.signOut();
    await state();
  };

  async function list() {
    $('admin-list').innerHTML = 'در حال دریافت خبرها…';

    const { data, error } = await db
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      $('admin-list').textContent =
        'خطا در دریافت خبرها: ' + error.message;
      return;
    }

    if (!data || data.length === 0) {
      $('admin-list').innerHTML =
        '<p class="muted">هنوز خبری ثبت نشده است.</p>';
      return;
    }

    $('admin-list').innerHTML = data.map(n => `
      <div class="adminitem">
        <div>
          <strong>${esc(n.title)}</strong>
          <small>${esc(n.category)} · ${new Date(n.created_at).toLocaleDateString('fa-IR')}</small>
        </div>
        <div>
          <button class="secondary" data-edit="${esc(n.id)}">ویرایش</button>
          <button class="secondary danger" data-del="${esc(n.id)}">حذف</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('[data-edit]').forEach(button => {
      button.onclick = () => {
        const news = data.find(
          n => String(n.id) === button.dataset.edit
        );
        if (news) edit(news);
      };
    });

    document.querySelectorAll('[data-del]').forEach(button => {
      button.onclick = () => remove(button.dataset.del);
    });
  }

  function edit(news) {
    editing = news.id;
    editingImageUrl = news.image_url || '';

    $('news-id').value = news.id;
    $('title').value = news.title || '';
    $('category').value = news.category || 'سیاسی';
    $('body').value = news.content || '';
    $('source').value = news.source || '';
    $('image-file').value = '';

    $('form-title').textContent = 'ویرایش خبر';
    $('cancel-edit').classList.remove('hidden');

    $('form-msg').textContent = editingImageUrl
      ? 'عکس قبلی حفظ می‌شود؛ برای تغییر آن عکس جدید انتخاب کن.'
      : '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    $('news-form').reset();
    editing = null;
    editingImageUrl = '';
    $('news-id').value = '';
    $('form-title').textContent = 'افزودن خبر جدید';
    $('cancel-edit').classList.add('hidden');
  }

  $('cancel-edit').onclick = reset;

  $('news-form').onsubmit = async event => {
    event.preventDefault();

    const button = $('news-form').querySelector('[type="submit"]');
    button.disabled = true;

    try {
      $('form-msg').textContent = 'در حال ذخیره خبر…';

      const file = $('image-file').files[0];
      let imageUrl = editingImageUrl;

      if (file) {
        $('form-msg').textContent = 'در حال آپلود عکس…';
        imageUrl = await uploadFile(file, 'news');
      }

      const item = {
        title: $('title').value.trim(),
        category: $('category').value,
        content: $('body').value.trim(),
        image_url: imageUrl || null,
        source: $('source').value.trim() || null
      };

      const result = editing
        ? await db.from('news').update(item).eq('id', editing)
        : await db.from('news').insert(item);

      if (result.error) {
        throw result.error;
      }

      $('form-msg').textContent = 'خبر با موفقیت ذخیره شد.';
      reset();
      await list();

    } catch (error) {
      $('form-msg').textContent =
        'خطا: ' + (error.message || 'ذخیره انجام نشد.');
    } finally {
      button.disabled = false;
    }
  };

  async function remove(id) {
    if (!confirm('این خبر حذف شود؟')) return;

    const { error } = await db
      .from('news')
      .delete()
      .eq('id', id);

    if (error) {
      alert('حذف انجام نشد: ' + error.message);
    } else {
      await list();
    }
  }

  $('reload').onclick = list;

  db.auth.onAuthStateChange(() => {
    setTimeout(state, 0);
  });

  state();
})();
