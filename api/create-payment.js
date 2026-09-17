const crypto = require('crypto');

const TIERS = {
  guest: { label: 'Гость фестиваля', price: '1967.00' },
  featured: { label: 'Первый ряд', price: '4990.00' },
  cameo: { label: 'Камео', price: '9900.00' },
  headliner: { label: 'Главная роль', price: '19900.00' },
};

function clean(value, max = 160) {
  return String(value || '').trim().slice(0, max);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

function getOrigin(req) {
  const configured = clean(process.env.SITE_URL, 240).replace(/\/$/, '');
  if (configured) return configured;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Метод не поддерживается' });

  if (String(process.env.PAYMENTS_ENABLED || '').toLowerCase() !== 'true') {
    return res.status(503).json({ error: 'Оплата ещё не включена. Место можно выбрать, но платёжный модуль пока готовится.' });
  }

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    return res.status(503).json({ error: 'Оплата ещё не подключена: не заданы реквизиты ЮKassa.' });
  }

  const body = parseBody(req);
  const tierId = clean(body.tier, 30);
  const tier = TIERS[tierId];
  if (!tier) return res.status(400).json({ error: 'Неизвестный уровень участия' });

  const name = clean(body.name, 80);
  const email = clean(body.email, 120);
  const telegram = clean(body.telegram, 80);
  const role = clean(body.role, 160);
  const comment = clean(body.comment, 500);
  const consent = clean(body.consent, 20);

  if (!name || !email) return res.status(400).json({ error: 'Укажите имя и электронную почту' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Проверьте адрес электронной почты' });
  if (consent !== 'yes') return res.status(400).json({ error: 'Нужно подтвердить согласие на обработку данных' });

  const origin = getOrigin(req);
  const orderId = crypto.randomUUID();

  const paymentBody = {
    amount: { value: tier.price, currency: 'RUB' },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: `${origin}/?payment=return`,
    },
    description: `Монтерей 1967 — ${tier.label}`.slice(0, 128),
    metadata: {
      order_id: orderId,
      tier: tierId,
      name,
      email,
      telegram,
      role,
      comment,
    },
  };

  const receiptsEnabled = String(process.env.YOOKASSA_RECEIPTS_ENABLED || '').toLowerCase() === 'true';
  if (receiptsEnabled) {
    const vatCode = Number(process.env.YOOKASSA_VAT_CODE);
    if (!Number.isInteger(vatCode) || vatCode < 1 || vatCode > 12) {
      return res.status(503).json({ error: 'Оплата настроена не полностью: проверьте код НДС для чека.' });
    }

    paymentBody.receipt = {
      customer: { email },
      items: [{
        description: `Участие в проекте «Монтерей 1967» — ${tier.label}`.slice(0, 128),
        quantity: 1,
        amount: { value: tier.price, currency: 'RUB' },
        vat_code: vatCode,
        payment_mode: process.env.YOOKASSA_PAYMENT_MODE || 'full_prepayment',
        payment_subject: process.env.YOOKASSA_PAYMENT_SUBJECT || 'service',
        measure: 'piece',
      }],
      internet: true,
    };
  }

  try {
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': crypto.randomUUID(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentBody),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('YooKassa error', response.status, json);
      return res.status(502).json({ error: 'Платёжный сервис не принял запрос. Проверьте настройки магазина.' });
    }

    const confirmationUrl = json.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      console.error('YooKassa response without confirmation_url', json);
      return res.status(502).json({ error: 'Платёж создан, но ссылка на оплату не получена.' });
    }

    return res.status(200).json({ confirmationUrl, paymentId: json.id, orderId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Не удалось создать платёж' });
  }
};
