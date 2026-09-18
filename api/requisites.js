function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();

  const name = esc(process.env.SELLER_NAME);
  const taxId = esc(process.env.SELLER_TAX_ID);
  const email = esc(process.env.SELLER_EMAIL);
  const missing = [
    !name && 'SELLER_NAME',
    !taxId && 'SELLER_TAX_ID',
    !email && 'SELLER_EMAIL'
  ].filter(Boolean);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

  const rows = [
    name && ['Исполнитель', name],
    ['Статус', 'Самозанятый · плательщик НПД'],
    taxId && ['ИНН', taxId],
    email && ['Электронная почта', email]
  ].filter(Boolean)
   .map(([label, value]) => `<div class="row"><span>${label}</span><strong>${value}</strong></div>`)
   .join('');

  const warning = missing.length
    ? `<div class="warning">Страница ещё не готова к публикации: не заполнены ${missing.join(', ')}.</div>`
    : '';

  return res.status(200).send(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Реквизиты исполнителя — Монтерей 1967</title>
  <meta name="robots" content="noindex">
  <style>
    :root{--paper:#f4ead2;--ink:#211c17;--orange:#e7501e;--line:#211c17}
    *{box-sizing:border-box}
    body{margin:0;background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{width:min(720px,calc(100% - 32px));margin:0 auto;padding:56px 0 72px}
    a{color:inherit}
    .back{display:inline-block;margin-bottom:34px;text-decoration:none;font-weight:700}
    h1{font-size:clamp(42px,8vw,72px);line-height:.92;margin:0 0 18px;text-transform:uppercase}
    .lead{font-size:18px;line-height:1.5;margin:0 0 34px;max-width:620px}
    .card{border:2px solid var(--line);background:#fff8e9;box-shadow:7px 7px 0 var(--ink)}
    .row{display:grid;grid-template-columns:190px 1fr;gap:24px;padding:18px 20px;border-bottom:1px solid #a9957b}
    .row:last-child{border-bottom:0}
    .row span{color:#746451}
    .row strong{overflow-wrap:anywhere}
    .warning{margin-top:26px;padding:16px 18px;background:#ffd9c7;border:2px solid var(--orange);font-weight:700}
    .note{margin-top:30px;color:#665847;font-size:14px}
    @media(max-width:600px){main{padding-top:34px}.row{grid-template-columns:1fr;gap:4px}}
  </style>
</head>
<body>
  <main>
    <a class="back" href="/">← МОНТЕРЕЙ 1967</a>
    <h1>Реквизиты исполнителя</h1>
    <p class="lead">Данные исполнителя для оплаты участия в авторском анимационном проекте «Монтерей 1967».</p>
    <section class="card">${rows}</section>
    ${warning}
    <p class="note">Оплата на сайте принимается за услуги по созданию и интеграции персонажа в авторский анимационный проект.</p>
  </main>
</body>
</html>`);
};
