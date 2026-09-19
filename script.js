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
  if (!payButton.disabled) payButton.textContent = `ПЕРЕЙТИ К ОПЛАТЕ · ${money.format(tiers[id].price)} ₽`;
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
  const tier = tiers[data.tier || 'guest'];
  payButton.disabled = true;
  payButton.textContent = 'ОТПРАВЛЯЮ ЗАЯВКУ…';
  note.style.fontWeight = '500';
  note.textContent = 'Сохраняю заявку и готовлю переход к оплате.';

  let leadAccepted = false;
  try {
    const leadResponse = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const leadResult = await leadResponse.json().catch(() => ({}));
    leadAccepted = leadResponse.ok && leadResult.ok;
  } catch (_) {
    leadAccepted = false;
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
    localStorage.setItem('montereyOrderDraft', JSON.stringify({ ...data, createdAt: new Date().toISOString() }));
    window.location.href = result.confirmationUrl;
  } catch (err) {
    const prefix = leadAccepted ? 'Заявка принята. ' : '';
    note.textContent = `${prefix}${err.message}`;
    note.style.fontWeight = '800';
    payButton.disabled = false;
    payButton.textContent = `ПЕРЕЙТИ К ОПЛАТЕ · ${money.format(tier.price)} ₽`;
  }
});

const params = new URLSearchParams(location.search);
if (params.get('payment') === 'return') {
  const banner = document.getElementById('successBanner');
  banner.hidden = false;
  banner.querySelector('button').addEventListener('click', () => banner.hidden = true);
  history.replaceState({}, '', location.pathname + location.hash);
}

updatePrice();
