const tiers = {
  guest: { label: 'МАССОВКА', price: 1967 },
  featured: { label: 'ПЕРВЫЙ РЯД', price: 4990 },
  cameo: { label: 'VIP-КАМЕО', price: 9900 },
  headliner: { label: 'ХЕДЛАЙНЕР', price: 19900 },
};

const money = new Intl.NumberFormat('ru-RU');
const form = document.getElementById('orderForm');
const orderPrice = document.getElementById('orderPrice');
const note = document.getElementById('paymentNote');
const payButton = document.getElementById('payButton');
const paymentHeading = document.getElementById('paymentHeading');
const paymentIntro = document.getElementById('paymentIntro');
const paymentStepTwoTitle = document.getElementById('paymentStepTwoTitle');
const paymentStepTwoCopy = document.getElementById('paymentStepTwoCopy');
const paymentStepThreeTitle = document.getElementById('paymentStepThreeTitle');
const paymentStepThreeCopy = document.getElementById('paymentStepThreeCopy');
const orderIntro = document.getElementById('orderIntro');
const orderSummaryLabel = document.getElementById('orderSummaryLabel');
let paymentsLive = false;

function setCheckoutMode(isLive) {
  paymentsLive = Boolean(isLive);
  note.classList.remove('is-success');

  if (paymentsLive) {
    paymentHeading.textContent = 'СНАЧАЛА МЕСТО. ПОТОМ — ПЕРСОНАЖ И СЦЕНА.';
    paymentIntro.textContent = 'Оплата проходит на защищённой странице ЮКасса. После подтверждения платежа я связываюсь с тобой и собираю материалы для персонажа.';
    paymentStepTwoTitle.textContent = 'ОПЛАЧИВАЕШЬ';
    paymentStepTwoCopy.textContent = 'Сайт переводит на страницу ЮКасса. Карточные данные на этом сайте не хранятся и не обрабатываются.';
    paymentStepThreeTitle.textContent = 'СОБИРАЕМ ГЕРОЯ';
    paymentStepThreeCopy.textContent = 'После подтверждения оплаты ты получаешь анкету: фотографии, животное, одежда, характер, действие и всё, что хочется спрятать в персонаже.';
    orderIntro.textContent = 'Выбери уровень, оставь контакт и коротко напиши идею. Подробную анкету с пожеланиями отправлю после оплаты.';
    orderSummaryLabel.textContent = 'К оплате';
    note.textContent = 'Оплата откроется на защищённой странице ЮКасса. Данные карты на этом сайте не вводятся.';
  } else {
    paymentHeading.textContent = 'СНАЧАЛА БРОНИРУЕМ МЕСТО. БЕЗ ОПЛАТЫ.';
    paymentIntro.textContent = 'Пока ЮКасса завершает подключение, заявка бесплатно фиксирует твой интерес. Я свяжусь с тобой, уточню роль и предложу доступный способ оплаты.';
    paymentStepTwoTitle.textContent = 'ОСТАВЛЯЕШЬ ЗАЯВКУ';
    paymentStepTwoCopy.textContent = 'Это бесплатно и ни к чему не обязывает. Заявка помогает проверить роль, уровень участия и наличие места.';
    paymentStepThreeTitle.textContent = 'СВЯЗЫВАЕМСЯ';
    paymentStepThreeCopy.textContent = 'Я отвечу по указанному контакту, уточню детали и пришлю способ оплаты. После оплаты начинаем собирать героя.';
    orderIntro.textContent = 'Выбери уровень, оставь контакт и коротко напиши идею или вопрос. Сейчас заявка бронирует место без оплаты.';
    orderSummaryLabel.textContent = 'Выбранный уровень';
    note.textContent = 'Заявка бесплатная и не обязывает к оплате. Я свяжусь по электронной почте или в Telegram.';
  }
  updatePrice();
}

function selectTier(id) {
  const input = form.querySelector(`input[name="tier"][value="${id}"]`);
  if (!input) return;
  input.checked = true;
  updatePrice();
  document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
}

function updatePrice() {
  const id = form.querySelector('input[name="tier"]:checked')?.value || 'guest';
  orderPrice.textContent = `${money.format(tiers[id].price)} ₽`;
  if (!payButton.disabled) {
    payButton.textContent = paymentsLive
      ? `ПЕРЕЙТИ К ОПЛАТЕ · ${money.format(tiers[id].price)} ₽`
      : 'ОСТАВИТЬ ЗАЯВКУ';
  }
}

document.querySelectorAll('.choose-tier').forEach(btn => {
  btn.addEventListener('click', () => selectTier(btn.dataset.tier));
});
form.querySelectorAll('input[name="tier"]').forEach(el => el.addEventListener('change', updatePrice));

const roleIdeaButtons = [...document.querySelectorAll('[data-role-idea]')];
const roleIdeaDetail = document.getElementById('roleIdeaDetail');
const roleInput = form.querySelector('input[name="role"]');

roleIdeaButtons.forEach(button => {
  button.addEventListener('click', () => {
    roleIdeaButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    roleIdeaDetail.innerHTML = `<b>${button.dataset.roleIdea}.</b> ${button.dataset.roleCopy}`;
    roleInput.value = button.dataset.roleIdea;
  });
});

document.getElementById('surpriseRole')?.addEventListener('click', () => {
  roleInput.value = 'Реши за меня';
  roleInput.focus({ preventScroll: true });
  document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form).entries());
  data.flow = paymentsLive ? 'online-payment' : 'reservation';
  payButton.disabled = true;
  payButton.textContent = 'ОТПРАВЛЯЮ ЗАЯВКУ…';
  note.classList.remove('is-success');
  note.style.fontWeight = '500';
  note.textContent = paymentsLive
    ? 'Сохраняю заявку и готовлю переход к оплате.'
    : 'Сохраняю заявку и бронирую место.';

  try {
    const leadResponse = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const leadResult = await leadResponse.json().catch(() => ({}));
    if (!leadResponse.ok || !leadResult.ok) {
      throw new Error(leadResult.error || 'Не удалось отправить заявку. Попробуй ещё раз.');
    }
  } catch (err) {
    note.textContent = err.message || 'Не удалось отправить заявку. Попробуй ещё раз.';
    note.style.fontWeight = '800';
    payButton.disabled = false;
    updatePrice();
    return;
  }

  localStorage.setItem('montereyOrderDraft', JSON.stringify({ ...data, createdAt: new Date().toISOString() }));

  if (!paymentsLive) {
    note.textContent = 'Заявка принята, место предварительно забронировано. Я свяжусь по указанному контакту, чтобы обсудить роль и оплату.';
    note.classList.add('is-success');
    note.style.fontWeight = '800';
    payButton.textContent = 'ЗАЯВКА ПРИНЯТА';
    return;
  }

  payButton.textContent = 'СОЗДАЮ ПЛАТЁЖ…';
  try {
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.confirmationUrl) {
      throw new Error(result.error || 'Платёж пока не подключён.');
    }
    window.location.href = result.confirmationUrl;
  } catch (err) {
    note.textContent = 'Заявка принята, но платёжная страница сейчас недоступна. Я свяжусь по указанному контакту и предложу способ оплаты.';
    note.classList.add('is-success');
    note.style.fontWeight = '800';
    payButton.textContent = 'ЗАЯВКА ПРИНЯТА';
  }
});

const params = new URLSearchParams(location.search);
if (params.get('payment') === 'return') {
  const banner = document.getElementById('successBanner');
  banner.hidden = false;
  banner.querySelector('button').addEventListener('click', () => banner.hidden = true);
  history.replaceState({}, '', location.pathname + location.hash);
}

setCheckoutMode(false);
fetch('/api/payment-status', { headers: { 'Accept': 'application/json' } })
  .then(response => response.ok ? response.json() : { live: false })
  .then(status => setCheckoutMode(status.live === true))
  .catch(() => setCheckoutMode(false));
