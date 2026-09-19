function clean(value, max = 160) {
  return String(value || '').trim().slice(0, max);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Метод не поддерживается' });

  const body = parseBody(req);
  const visit = {
    createdAt: new Date().toISOString(),
    source: clean(body.source, 80) || 'прямой переход',
    medium: clean(body.medium, 80) || '—',
    campaign: clean(body.campaign, 120) || '—',
    referrer: clean(body.referrer, 160) || '—',
    landing: clean(body.landing, 160) || '/',
    device: clean(body.device, 30) || 'не определено',
  };

  console.log('PAGE_VISIT', JSON.stringify(visit));

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(200).json({ ok: true, delivered: false, channel: 'vercel-log' });
  }

  const text = [
    '👀 НОВЫЙ ВИЗИТ · МОНТЕРЕЙ 1967',
    '',
    `Источник: ${visit.source}`,
    `Канал: ${visit.medium}`,
    `Кампания: ${visit.campaign}`,
    `Откуда: ${visit.referrer}`,
    `Вход: ${visit.landing}`,
    `Устройство: ${visit.device}`,
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      console.error('Telegram visit delivery error', response.status, result);
      return res.status(200).json({ ok: true, delivered: false, channel: 'vercel-log' });
    }
    return res.status(200).json({ ok: true, delivered: true, channel: 'telegram' });
  } catch (error) {
    console.error('Telegram visit delivery exception', error);
    return res.status(200).json({ ok: true, delivered: false, channel: 'vercel-log' });
  }
};
