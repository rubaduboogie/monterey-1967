async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && result.ok;
  } catch (error) {
    console.error('Telegram payment notification error', error);
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return res.status(503).end();

  try {
    const event = typeof req.body === 'object' ? (req.body || {}) : JSON.parse(req.body || '{}');
    const paymentId = event?.object?.id;
    if (!paymentId) return res.status(400).end();

    // Не доверяем одному уведомлению: повторно запрашиваем платёж у ЮKassa.
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    const check = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    const payment = await check.json().catch(() => ({}));
    if (!check.ok) return res.status(502).end();

    if (payment.status === 'succeeded') {
      const metadata = payment.metadata || {};
      const record = {
        paymentId: payment.id,
        amount: payment.amount,
        metadata,
        paidAt: new Date().toISOString(),
      };
      console.log('PAID_ORDER', JSON.stringify(record));

      const text = [
        '✅ ОПЛАЧЕНО · МОНТЕРЕЙ 1967',
        '',
        `Сумма: ${payment.amount?.value || '—'} ${payment.amount?.currency || 'RUB'}`,
        `Уровень: ${metadata.tier || '—'}`,
        `Имя: ${metadata.name || '—'}`,
        `Email: ${metadata.email || '—'}`,
        `Telegram: ${metadata.telegram || '—'}`,
        `Роль: ${metadata.role || '—'}`,
        `Идея: ${metadata.comment || '—'}`,
        `Payment ID: ${payment.id}`,
      ].join('\n');

      await sendTelegram(text);
    }

    return res.status(200).end();
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
};
