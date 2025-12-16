const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwb5Vg9wWZkpuKbslSez4Qx_1z-wmelVbty8FtphRu-3ZIcTlfqJsuwVTbbxNyUJMY/exec"; // Endpoint do Apps Script para registrar as reservas.

const state = {
  currentItem: null,
  modal: null,
  form: null,
  pageKey: document.body.dataset.page || 'default'
};

function markReserved(card) {
  if (!card) return;
  const btn = card.querySelector('.reserve-btn');
  card.classList.add('reserved');
  if (btn) {
    btn.textContent = 'Reservado';
    btn.disabled = true;
  }
}

function isReserved(card) {
  const id = card?.dataset.id;
  if (!id) return false;
  return localStorage.getItem(`reservation:${state.pageKey}:${id}`) === '1';
}

function saveReserved(card) {
  const id = card?.dataset.id;
  if (!id) return;
  localStorage.setItem(`reservation:${state.pageKey}:${id}`, '1');
}

async function sendReservation(payload) {
  if (!WEBHOOK_URL) return { ok: true, skipped: true };
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error('Erro ao enviar reserva', err);
    return { ok: false, error: err };
  }
}

function openModal(item) {
  state.currentItem = item;
  const modalTitle = document.querySelector('#modalTitle');
  const itemIdInput = document.querySelector('#itemId');
  if (modalTitle) modalTitle.textContent = `Reservar: ${item.name}`;
  if (itemIdInput) itemIdInput.value = item.id;
  if (state.modal) state.modal.classList.add('modal--open');
}

function closeModal() {
  state.currentItem = null;
  if (state.form) state.form.reset();
  if (state.modal) state.modal.classList.remove('modal--open');
}

function hydrateReserved() {
  document.querySelectorAll('.gift-item').forEach(card => {
    if (isReserved(card)) {
      markReserved(card);
    }
  });
}

function attachListeners() {
  state.modal = document.querySelector('#reservationModal');
  state.form = document.querySelector('#reservationForm');

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  document.querySelectorAll('.reserve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.gift-item');
      if (!card) return;
      const item = {
        id: card.dataset.id,
        name: card.dataset.name || card.querySelector('h3')?.textContent || 'Presente',
        tier: btn.dataset.tier || document.body.dataset.tier || ''
      };
      openModal(item);
    });
  });

  if (state.form) {
    state.form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!state.currentItem) return;
      const name = document.querySelector('#guestName')?.value.trim();
      const contact = document.querySelector('#guestContact')?.value.trim();
      const note = document.querySelector('#guestNote')?.value.trim();
      const card = document.querySelector(`.gift-item[data-id="${state.currentItem.id}"]`);
      if (!name || !contact) return;

      const payload = {
        page: state.pageKey,
        tier: state.currentItem.tier,
        itemId: state.currentItem.id,
        itemName: state.currentItem.name,
        guestName: name,
        guestContact: contact,
        guestNote: note || ''
      };

      const res = await sendReservation(payload);
      if (!res.ok && !res.skipped) {
        alert('Nao foi possivel registrar online agora, mas vamos marcar localmente.');
      }
      markReserved(card);
      saveReserved(card);
      closeModal();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  hydrateReserved();
  attachListeners();
});
