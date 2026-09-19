module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Метод не поддерживается' });

  const enabled = String(process.env.PAYMENTS_ENABLED || '').toLowerCase() === 'true';
  const live = String(process.env.PAYMENTS_LIVE || '').toLowerCase() === 'true';

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json({ live: enabled && live });
};
