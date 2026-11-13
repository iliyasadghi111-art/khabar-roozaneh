
(() => {
  const $ = id => document.getElementById(id);

  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;

  const show = (id, message) => {
    const el = $(id);
    if (el) el.textContent = message;
  };

  const valid =
    window.supabase &&
    typeof url === 'string' &&
    url.startsWith('https://') &&
    typeof key === 'string' &&
    key.length > 10;

  if (!valid) {
    show('setup-warning', 'تنظیمات Supabase کامل نیست.');
    $('setup-warning')?.classList.remove('hidden');
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

    if (file.size > 8 * 1024 * 1024)
      throw new Error('حجم عکس نباید بیشتر از ۸ مگابایت باشد.');

    if (!file.type.startsWith('image/'))
      throw new Error('فقط فایل تصویری انتخاب کن.');

    const ext = file.name.split('.').pop().toLowerCase();
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function state() {
    const { data, error } = await db.auth.getSession();

    if (error) {
      show('login-msg', error.message);
      return;
    }

    const session = data.session;

    $('login-box')?.classList.toggle('hidden', !!session);
    $('dashboard')?.classList.toggle('hidden', !session);
    $('logout')?.classList.toggle('hidden', !session);

    if (session) await list();
  }

  async function login(event) {
    event.preventDefault();

    const button = $('login-form')?.querySelector('[type="submit"]');
    if (button) button.disabled = true;

    show('login-msg', 'در حال ورود...');

    try {
      const email = $('email')?.value.trim();
      const password = $('password')?.value;

      if (!email || !password)
        throw new Error('ایمیل و رمز عبور را وارد کن.');

      const { error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      show('login-msg', 'ورود موفق بود.');
      await state();

    } catch (error) {
      show('login-msg', 'خطا: ' + error.message);
      console.error(error);
    } finally {
      if (button) button.disabled = false;
    }
  }

  $('login-form')?.addEventListener('submit', login);

  $('logout')?.addEventListener('click', async () => {
    const { error } = await db.auth.signOut();
    if (error) alert(error.message);
    await state();
  });

  async function list() {
    show('admin-list', 'در حال دریافت خبرها...');

    const { data, error } = await db
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      show('admin-list', 'خطا: ' + error.message);
      return;
    }

    if (!data?.length) {
      show('admin-list', 'هنوز خبری ثبت نشده است.');
      return;
    }

    $('admin-list').innerHTML = data.map(n => `
      <div class="adminitem">
        <div>
          <strong>${esc(n.title)}</strong>
          <small>${esc(n.category)}</small>
        </div>
        <div>
          <button type="button" class="secondary" data-edit="${esc(n.id)}">ویرایش</button>
          <button type="button" class="secondary danger" data-del="${esc(n.id)}">حذف</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('[data-edit]').forEach(button => {
      button.onclick = () => {
        const news = data.find(n => String(n.id) === button.dataset.edit);
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

    show('form-title', 'ویرایش خبر');
    $('cancel-edit')?.classList.remove('hidden');
    show('form-msg', 'عکس قبلی حفظ می‌شود مگر اینکه عکس جدید انتخاب کنی.');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    $('news-form')?.reset();
    editing = null;
    editingImageUrl = '';

    if ($('news-id')) $('news-id').value = '';

    show('form-title', 'افزودن خبر جدید');
    $('cancel-edit')?.classList.add('hidden');
  }

  $('cancel-edit')?.addEventListener('click', reset);

  $('news-form')?.addEventListener('submit', async event => {
    event.preventDefault();

    const button = $('news-form').querySelector('[type="submit"]');
    if (button) button.disabled = true;

    try {
      show('form-msg', 'در حال ذخیره خبر...');

      const file = $('image-file')?.files[0];
      let imageUrl = editingImageUrl;

      if (file) {
        show('form-msg', 'در حال آپلود عکس...');
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

      if (result.error) throw result.error;

      show('form-msg', 'خبر با موفقیت ذخیره شد.');
      reset();
      await list();

    } catch (error) {
      console.error('News save error:', error);
      show('form-msg', 'خطا: ' + error.message);
    } finally {
      if (button) button.disabled = false;
    }
  });

  async function remove(id) {
    if (!confirm('این خبر حذف شود؟')) return;

    const { error } = await db.from('news').delete().eq('id', id);

    if (error) alert('حذف انجام نشد: ' + error.message);
    else await list();
  }

  $('reload')?.addEventListener('click', list);

  db.auth.onAuthStateChange(() => {
    setTimeout(state, 0);
  });

  console.log('ADMIN JS LOADED', {
    loginForm: !!$('login-form'),
    supabase: !!window.supabase
  });

  state();
})();
