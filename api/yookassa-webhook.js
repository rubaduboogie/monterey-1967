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
      console.log('PAID_ORDER', JSON.stringify({
        paymentId: payment.id,
        amount: payment.amount,
        metadata: payment.metadata || {},
        paidAt: new Date().toISOString(),
      }));
      // Следующий шаг при необходимости: отправлять подтверждённый заказ в Telegram/CRM.
    }

    return res.status(200).end();
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
};
