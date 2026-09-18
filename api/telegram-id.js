module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  // Как только TELEGRAM_CHAT_ID будет задан, временный setup-endpoint отключается.
  if (process.env.TELEGRAM_CHAT_ID) {
    return res.status(404).json({ error: 'Setup завершён' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'TELEGRAM_BOT_TOKEN ещё не применён в текущем deployment' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20&timeout=0`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      return res.status(502).json({ error: 'Telegram API не ответил корректно' });
    }

    const updates = Array.isArray(data.result) ? data.result : [];
    const hit = [...updates].reverse().find((u) =>
      u?.message?.chat?.id || u?.edited_message?.chat?.id || u?.channel_post?.chat?.id
    );

    const chat = hit?.message?.chat || hit?.edited_message?.chat || hit?.channel_post?.chat;

    if (!chat?.id) {
      return res.status(200).json({
        ready: false,
        instruction: 'Открой своего бота в Telegram, нажми Start или отправь любое сообщение, затем обнови эту страницу.'
      });
    }

    return res.status(200).json({
      ready: true,
      chatId: String(chat.id),
      chatType: chat.type || null,
      chatName: [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.title || chat.username || null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Не удалось получить chat id' });
  }
};
