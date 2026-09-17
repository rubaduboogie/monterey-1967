const tiers = {
  guest: { label: 'ГОСТЬ ФЕСТИВАЛЯ', price: 1967 },
  featured: { label: 'ПЕРВЫЙ РЯД', price: 4990 },
  cameo: { label: 'КАМЕО', price: 9900 },
  headliner: { label: 'ГЛАВНАЯ РОЛЬ', price: 19900 },
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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form).entries());
  const tier = tiers[data.tier || 'guest'];
  payButton.disabled = true;
  payButton.textContent = 'СОЗДАЮ ПЛАТЁЖ…';
  note.textContent = 'Секунду. Открываю защищённую страницу оплаты.';

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
    note.textContent = `${err.message} Данные формы сохранены в браузере.`;
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
