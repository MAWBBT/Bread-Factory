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
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    // Нормализуем isAdmin при чтении
    if (user) {
      user.isAdmin = !!user.isAdmin || !!user.is_admin;
      user.is_admin = user.isAdmin;
    }
    return user;
  } catch {
    return null;
  }
}

function setUser(user) {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
}

// Вспомогательная функция для проверки, является ли пользователь админом
function isUserAdmin(user) {
  if (!user) return false;
  return user.isAdmin === true || 
         user.is_admin === true || 
         user.isAdmin === 1 || 
         user.is_admin === 1 ||
         user.isAdmin === 'true' ||
         user.is_admin === 'true';
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: 'Bearer ' + token } : {};
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// Функция для перевода статуса на русский язык
function getStatusLabel(status) {
  const statusMap = {
    'new': 'Новая',
    'in_progress': 'В работе',
    'done': 'Выполнена',
    'rejected': 'Отклонена'
  };
  return statusMap[status] || status;
}

// Проверка прав администратора и инициализация
async function initAdmin() {
  const token = getToken();
  if (!token) {
    alert('Требуется авторизация');
    window.location.href = '/';
    return;
  }

  try {
    const response = await fetch(API + '/auth/me', {
      headers: { Authorization: 'Bearer ' + token },
    });
    
    if (!response.ok) {
      throw new Error('Ошибка авторизации');
    }

    const user = await response.json();
    // Нормализуем флаг isAdmin
    if (user) {
      user.isAdmin = !!user.isAdmin || !!user.is_admin;
      user.is_admin = user.isAdmin;
    }
    setUser(user);

    // Проверяем права администратора
    if (!isUserAdmin(user)) {
      alert('Доступ запрещён. Только администраторы могут войти в админ-панель.');
      window.location.href = '/';
      return;
    }

    // Отображаем имя пользователя
    document.getElementById('admin-header-username').textContent = user ? user.username : '';
    
    // Загружаем данные
    loadAdminUsers();
    loadAdminRequests();
  } catch (error) {
    console.error('Ошибка инициализации:', error);
    alert('Ошибка загрузки данных. Проверьте авторизацию.');
    window.location.href = '/';
  }
}

// Загрузка списка пользователей
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

// Загрузка всех заявок
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
      const statuses = [
        { value: 'new', label: 'Новая' },
        { value: 'in_progress', label: 'В работе' },
        { value: 'done', label: 'Выполнена' },
        { value: 'rejected', label: 'Отклонена' }
      ];
      requests.forEach((req) => {
        const li = document.createElement('li');
        const statusSelect = statuses
          .map(
            (s) =>
              `<option value="${s.value}" ${(req.status || 'in_progress') === s.value ? 'selected' : ''}>${s.label}</option>`
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

// Обновление статуса заявки
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

// Удаление заявки
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

// Удаление пользователя
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

// Модальное окно для редактирования пользователя
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
  userEditIsadmin.checked = user ? (user.isAdmin || user.is_admin) : false;
  modalUserError.hidden = true;
  modalUser.hidden = false;
}

function closeUserModal() {
  modalUser.hidden = true;
}

// Обработчики событий
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

// Выход из админ-панели
document.getElementById('btn-logout-admin').addEventListener('click', () => {
  setToken(null);
  setUser(null);
  window.location.href = '/';
});

// Инициализация при загрузке страницы
initAdmin();
