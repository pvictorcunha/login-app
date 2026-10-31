const messageEl = document.getElementById('message');
const form = document.getElementById('profileForm');
const saveBtn = document.getElementById('saveBtn');

function showMessage(text, type = 'error') {
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
  messageEl.hidden = false;
}

function hideMessage() {
  messageEl.hidden = true;
}

function setAvatar(user) {
  const avatar = document.getElementById('avatarPreview');
  if (user.avatarUrl) {
    avatar.innerHTML = `<img src="${user.avatarUrl}" alt="avatar" onerror="this.parentElement.textContent='${(user.fullName || user.username || 'O').charAt(0).toUpperCase()}'" />`;
  } else {
    avatar.textContent = (user.fullName || user.username || 'O').charAt(0).toUpperCase();
  }
}

(async () => {
  const res = await fetch('/api/profile');
  if (!res.ok) { window.location.href = '/'; return; }
  const data = await res.json();
  const u = data.user;
  document.getElementById('profileName').textContent = u.fullName || u.username;
  document.getElementById('profileEmail').textContent = u.email;
  document.getElementById('fullName').value = u.fullName || '';
  document.getElementById('email').value = u.email || '';
  document.getElementById('phone').value = u.phone || '';
  document.getElementById('bio').value = u.bio || '';
  document.getElementById('avatarUrl').value = u.avatarUrl || '';
  setAvatar(u);
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();
  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando...';

  const payload = {
    fullName: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    bio: document.getElementById('bio').value.trim(),
    avatarUrl: document.getElementById('avatarUrl').value.trim(),
  };
  const pwd = document.getElementById('password').value;
  if (pwd) payload.password = pwd;

  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.message || 'Erro ao atualizar perfil');
      return;
    }
    showMessage(data.message || 'Perfil atualizado', 'success');
    document.getElementById('profileName').textContent = data.user.fullName || data.user.username;
    document.getElementById('profileEmail').textContent = data.user.email;
    setAvatar(data.user);
    document.getElementById('password').value = '';
  } catch (err) {
    showMessage('Erro de conexão com o servidor');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar alterações';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});
