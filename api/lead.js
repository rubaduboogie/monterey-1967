function clean(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

const LABELS = {
  guest: 'Массовка — 1 967 ₽',
  featured: 'Первый ряд — 4 990 ₽',
  cameo: 'VIP-камео — 9 900 ₽',
  headliner: 'Хедлайнер — 19 900 ₽',
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Метод не поддерживается' });

  const body = parseBody(req);
  const tier = clean(body.tier, 30);
  const name = clean(body.name, 80);
  const email = clean(body.email, 120);
  const telegram = clean(body.telegram, 80);
  const role = clean(body.role, 160);
  const comment = clean(body.comment, 900);

  if (!name || !email) return res.status(400).json({ error: 'Укажите имя и электронную почту' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Проверьте адрес электронной почты' });

  const lead = {
    createdAt: new Date().toISOString(),
    tier: LABELS[tier] || tier || 'не выбран',
    name,
    email,
    telegram,
    role,
    comment,
  };

  console.log('NEW_LEAD', JSON.stringify(lead));

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(200).json({ ok: true, delivered: false, channel: 'vercel-log' });
  }

  const text = [
    '🎟 НОВАЯ ЗАЯВКА · МОНТЕРЕЙ 1967',
    '',
    `Уровень: ${lead.tier}`,
    `Имя: ${name}`,
    `Email: ${email}`,
    `Telegram: ${telegram || '—'}`,
    `Роль: ${role || '—'}`,
    `Идея: ${comment || '—'}`,
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      console.error('Telegram lead delivery error', response.status, result);
      return res.status(200).json({ ok: true, delivered: false, channel: 'vercel-log' });
    }
    return res.status(200).json({ ok: true, delivered: true, channel: 'telegram' });
  } catch (error) {
    console.error('Telegram lead delivery exception', error);
    return res.status(200).json({ ok: true, delivered: false, channel: 'vercel-log' });
  }
};
