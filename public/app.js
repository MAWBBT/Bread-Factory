const API = '';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function setUser(user) {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((el) => {
    el.hidden = el.id !== id;
  });
}

function showLogin(err) {
  showScreen('screen-login');
  const el = document.getElementById('login-error');
  el.hidden = !err;
  el.textContent = err || '';
}

function showRegister(err) {
  showScreen('screen-register');
  const el = document.getElementById('register-error');
  el.hidden = !err;
  el.textContent = err || '';
}

function showApp() {
  showScreen('screen-app');
  const user = getUser();
  document.getElementById('header-username').textContent = user ? user.username : '';
  const adminBtn = document.getElementById('btn-admin-panel');
  const isAdmin = user && (user.isAdmin === true || user.is_admin === true);
  adminBtn.style.display = isAdmin ? '' : 'none';
  loadRequests();
}

function showAdmin() {
  showScreen('screen-admin');
  const user = getUser();
  document.getElementById('admin-header-username').textContent = user ? user.username : '';
  loadAdminUsers();
  loadAdminRequests();
}

function initAuth() {
  const token = getToken();
  if (token) {
    fetch(API + '/auth/me', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((user) => {
        setUser(user);
        showApp();
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        showLogin();
      });
  } else {
    showLogin();
  }
}

document.getElementById('form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value;
  const errEl = document.getElementById('login-error');
  errEl.hidden = true;
  fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.error) {
        errEl.textContent = data.error;
        errEl.hidden = false;
        return;
      }
      setToken(data.token);
      setUser(data.user);
      showApp();
    })
    .catch(() => {
      errEl.textContent = 'Ошибка соединения';
      errEl.hidden = false;
    });
});

document.getElementById('form-register').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value;
  const errEl = document.getElementById('register-error');
  errEl.hidden = true;
  fetch(API + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.error) {
        errEl.textContent = data.error;
        errEl.hidden = false;
        return;
      }
      setToken(data.token);
      setUser(data.user);
      showApp();
    })
    .catch(() => {
      errEl.textContent = 'Ошибка соединения';
      errEl.hidden = false;
    });
});

document.getElementById('link-register').addEventListener('click', (e) => {
  e.preventDefault();
  showRegister();
});

document.getElementById('link-login').addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

document.getElementById('btn-logout').addEventListener('click', () => {
  setToken(null);
  setUser(null);
  showLogin();
});

document.getElementById('btn-admin-panel').addEventListener('click', (e) => {
  e.preventDefault();
  showAdmin();
});

document.getElementById('btn-back-app').addEventListener('click', (e) => {
  e.preventDefault();
  showApp();
});

document.getElementById('btn-logout-admin').addEventListener('click', () => {
  setToken(null);
  setUser(null);
  showLogin();
});

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: 'Bearer ' + token } : {};
}

function loadRequests() {
  const listEl = document.getElementById('requests-list');
  const loadingEl = document.getElementById('requests-loading');
  const emptyEl = document.getElementById('requests-empty');
  listEl.innerHTML = '';
  loadingEl.hidden = false;
  emptyEl.hidden = true;
  fetch(API + '/requests', { headers: authHeaders() })
    .then((r) => r.json())
    .then((requests) => {
      loadingEl.hidden = true;
      if (!requests.length) {
        emptyEl.hidden = false;
        return;
      }
      requests.forEach((req) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <div class="request-info">
            <strong>${escapeHtml(req.breadType)}</strong> — ${Number(req.quantityKg)} кг
            <div class="request-meta">ID: ${req.id}</div>
          </div>
          <span class="request-status ${escapeHtml(req.status || 'new')}">${escapeHtml(req.status || 'new')}</span>
          <button type="button" class="btn btn-danger btn-delete" data-id="${req.id}">Удалить</button>
        `;
        li.querySelector('.btn-delete').addEventListener('click', () => deleteRequest(req.id, li));
        listEl.appendChild(li);
      });
    })
    .catch(() => {
      loadingEl.hidden = true;
      emptyEl.textContent = 'Не удалось загрузить заявки.';
      emptyEl.hidden = false;
    });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function deleteRequest(id, li) {
  if (!confirm('Удалить заявку?')) return;
  fetch(API + '/requests/' + id, {
    method: 'DELETE',
    headers: authHeaders(),
  })
    .then((r) => {
      if (r.ok) li.remove();
      else return r.json().then((d) => Promise.reject(d.error));
    })
    .catch((err) => alert(err || 'Ошибка удаления'));
}

document.getElementById('form-request').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = {
    breadType: form.breadType.value.trim(),
    quantityKg: parseFloat(form.quantityKg.value) || 0,
    status: form.status.value || 'new',
  };
  fetch(API + '/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
        return;
      }
      form.breadType.value = '';
      form.quantityKg.value = '';
      form.status.value = 'new';
      loadRequests();
    })
    .catch(() => alert('Ошибка создания заявки'));
});

// ——— Админ-панель ———

function loadAdminUsers() {
  const listEl = document.getElementById('admin-users-list');
  const loadingEl = document.getElementById('admin-users-loading');
  const emptyEl = document.getElementById('admin-users-empty');
  listEl.innerHTML = '';
  loadingEl.hidden = false;
  emptyEl.hidden = true;
  fetch(API + '/users', { headers: authHeaders() })
    .then((r) => {
      if (!r.ok) return Promise.reject(r.status);
      return r.json();
    })
    .then((users) => {
      loadingEl.hidden = true;
      if (!users.length) {
        emptyEl.hidden = false;
        return;
      }
      users.forEach((u) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="user-login">${escapeHtml(u.username)}</span>
          ${u.isAdmin ? '<span class="user-badge">Админ</span>' : ''}
          <div class="user-actions">
            <button type="button" class="btn btn-outline btn-edit-user" data-id="${u.id}">Изменить</button>
            <button type="button" class="btn btn-danger btn-delete-user" data-id="${u.id}">Удалить</button>
          </div>
        `;
        li.querySelector('.btn-edit-user').addEventListener('click', () => openUserModal(u));
        li.querySelector('.btn-delete-user').addEventListener('click', () => deleteUser(u.id, u.username, li));
        listEl.appendChild(li);
      });
    })
    .catch(() => {
      loadingEl.hidden = true;
      emptyEl.textContent = 'Нет доступа или ошибка загрузки.';
      emptyEl.hidden = false;
    });
}

function loadAdminRequests() {
  const listEl = document.getElementById('admin-requests-list');
  const loadingEl = document.getElementById('admin-requests-loading');
  const emptyEl = document.getElementById('admin-requests-empty');
  listEl.innerHTML = '';
  loadingEl.hidden = false;
  emptyEl.hidden = true;
  fetch(API + '/requests', { headers: authHeaders() })
    .then((r) => r.json())
    .then((requests) => {
      loadingEl.hidden = true;
      if (!requests.length) {
        emptyEl.hidden = false;
        return;
      }
      const statuses = ['new', 'in_progress', 'done', 'rejected'];
      requests.forEach((req) => {
        const li = document.createElement('li');
        const statusSelect = statuses
          .map(
            (s) =>
              `<option value="${s}" ${(req.status || 'new') === s ? 'selected' : ''}>${s}</option>`
          )
          .join('');
        li.innerHTML = `
          <div class="request-info">
            <strong>${escapeHtml(req.breadType)}</strong> — ${Number(req.quantityKg)} кг
            <div class="request-meta">ID: ${req.id}</div>
          </div>
          <select class="request-status-select" data-id="${req.id}">${statusSelect}</select>
          <button type="button" class="btn btn-danger btn-delete-admin-request" data-id="${req.id}">Удалить</button>
        `;
        li.querySelector('.request-status-select').addEventListener('change', (e) => {
          updateRequestStatus(req.id, e.target.value, e.target);
        });
        li.querySelector('.btn-delete-admin-request').addEventListener('click', () =>
          deleteRequest(req.id, li)
        );
        listEl.appendChild(li);
      });
    })
    .catch(() => {
      loadingEl.hidden = true;
      emptyEl.textContent = 'Ошибка загрузки заявок.';
      emptyEl.hidden = false;
    });
}

function updateRequestStatus(id, status, selectEl) {
  fetch(API + '/requests/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ status }),
  })
    .then((r) => {
      if (!r.ok) return r.json().then((d) => Promise.reject(d.error));
    })
    .catch((err) => {
      alert(err || 'Ошибка изменения статуса');
      selectEl.value = selectEl.dataset.prev || 'new';
    });
  selectEl.dataset.prev = status;
}

function deleteUser(id, username, li) {
  if (!confirm(`Удалить пользователя «${username}»?`)) return;
  fetch(API + '/users/' + id, {
    method: 'DELETE',
    headers: authHeaders(),
  })
    .then((r) => {
      if (r.ok) li.remove();
      else return r.json().then((d) => Promise.reject(d.error));
    })
    .catch((err) => alert(err || 'Ошибка удаления'));
}

const modalUser = document.getElementById('modal-user');
const formUserEdit = document.getElementById('form-user-edit');
const modalUserTitle = document.getElementById('modal-user-title');
const userEditId = document.getElementById('user-edit-id');
const userEditUsername = document.getElementById('user-edit-username');
const userEditPassword = document.getElementById('user-edit-password');
const userEditIsadmin = document.getElementById('user-edit-isadmin');
const modalUserError = document.getElementById('modal-user-error');

function openUserModal(user) {
  modalUserTitle.textContent = user ? 'Редактировать пользователя' : 'Добавить пользователя';
  userEditId.value = user ? user.id : '';
  userEditUsername.value = user ? user.username : '';
  userEditUsername.disabled = !!user;
  userEditPassword.value = '';
  userEditPassword.placeholder = user ? 'Не менять' : '';
  userEditPassword.required = !user;
  userEditIsadmin.checked = user ? user.isAdmin : false;
  modalUserError.hidden = true;
  modalUser.hidden = false;
}

function closeUserModal() {
  modalUser.hidden = true;
}

modalUser.querySelector('.modal-backdrop').addEventListener('click', closeUserModal);
modalUser.querySelector('.btn-modal-cancel').addEventListener('click', closeUserModal);

document.getElementById('btn-add-user').addEventListener('click', () => openUserModal(null));

formUserEdit.addEventListener('submit', (e) => {
  e.preventDefault();
  modalUserError.hidden = true;
  const id = userEditId.value;
  const payload = {
    username: userEditUsername.value.trim(),
    isAdmin: userEditIsadmin.checked,
  };
  if (userEditPassword.value) payload.password = userEditPassword.value;
  const isNew = !id;
  if (isNew && !payload.password) {
    modalUserError.textContent = 'Укажите пароль';
    modalUserError.hidden = false;
    return;
  }
  const url = isNew ? API + '/users' : API + '/users/' + id;
  const method = isNew ? 'POST' : 'PUT';
  fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.error) {
        modalUserError.textContent = data.error;
        modalUserError.hidden = false;
        return;
      }
      closeUserModal();
      loadAdminUsers();
    })
    .catch(() => {
      modalUserError.textContent = 'Ошибка сохранения';
      modalUserError.hidden = false;
    });
});

initAuth();
