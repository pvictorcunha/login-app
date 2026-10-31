const messageEl = document.getElementById('message');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const submitBtn = loginForm.querySelector('button[type="submit"]');

let lockoutTimer = null;

function showMessage(text, type = 'error') {
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
  messageEl.hidden = false;
}

function hideMessage() {
  messageEl.hidden = true;
}

function startLockout(seconds) {
  if (lockoutTimer) clearInterval(lockoutTimer);
  let remaining = seconds;
  submitBtn.disabled = true;
  const update = () => {
    if (remaining <= 0) {
      clearInterval(lockoutTimer);
      lockoutTimer = null;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
      hideMessage();
      return;
    }
    submitBtn.textContent = `Aguarde ${remaining}s`;
    remaining--;
  };
  update();
  lockoutTimer = setInterval(update, 1000);
}

showRegister.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.hidden = true;
  registerForm.hidden = false;
  hideMessage();
});

showLogin.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.hidden = true;
  loginForm.hidden = false;
  hideMessage();
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Entrando...';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.status === 429) {
      const seconds = (data.retryAfter) || 60;
      showMessage(data.message || 'Muitas tentativas. Aguarde para tentar novamente.');
      alert(data.message || 'Você excedeu o número de tentativas. Aguarde para tentar novamente.');
      startLockout(seconds);
      return;
    }
    if (!res.ok) {
      let msg = data.message || 'Erro ao fazer login';
      if (typeof data.attemptsLeft === 'number') {
        msg += ` (tentativas restantes: ${data.attemptsLeft})`;
      }
      showMessage(msg);
      alert('Senha ou usuário incorretos. Verifique suas credenciais e tente novamente.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
      return;
    }
    window.location.href = '/dashboard';
  } catch (err) {
    showMessage('Erro de conexão com o servidor');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Entrar';
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  const btn = registerForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Criando...';

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.message || 'Erro ao criar conta');
      return;
    }
    window.location.href = '/dashboard';
  } catch (err) {
    showMessage('Erro de conexão com o servidor');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar conta';
  }
});
