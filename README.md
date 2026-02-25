
### 1. Установка зависимостей

В корне проекта выполните:

```bash
npm install
# и
npm install pg pg-hstore # если выдаст ошибку во время инициализации
```

### 2. Запуск сервера

```bash
npm run dev
# или
npm start
```

После успешного запуска в консоли вы увидите что-то вроде:

```text
БД синхронизирована.
Admin id: ...
Worker id: ...
Сервер хлебозавода запущен на порту 3000
```

### 3. Тестирование запросов в Postman

Базовый URL: `http://localhost:3000`

#### Таблица **users** (пользователи)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `http://localhost:3000/users` | Все строки таблицы пользователей |
| GET | `http://localhost:3000/users/:id` | Строка по id с зависимыми заявками (например `/users/1`) |
| POST | `http://localhost:3000/users` | Создать пользователя. Body (JSON): `{"username":"test","password":"pass123","isAdmin":false}` |
| DELETE | `http://localhost:3000/users/:id` | Удалить пользователя по id (проверка существования и удаление) |

#### Таблица **requests** (заявки)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `http://localhost:3000/requests` | Все строки таблицы заявок |
| GET | `http://localhost:3000/requests/:id` | Строка по id с зависимой таблицей User (например `/requests/1`) |
| POST | `http://localhost:3000/requests` | Создать заявку. Body (JSON): `{"breadType":"Белый","quantityKg":100,"status":"new","user_id":1}` |
| DELETE | `http://localhost:3000/requests/:id` | Удалить заявку по id (проверка существования и удаление) |

В Postman: выберите метод, введите URL, для POST вкладка Body → raw → JSON — вставьте пример тела запроса.

---

### 4. Как делать POST-запросы (подробно)

POST создаёт новую строку в таблице. Сервер принимает данные в формате **JSON** в теле запроса.

#### В Postman

1. Выберите метод **POST** в выпадающем списке слева от поля URL.
2. Введите URL:
   - для пользователя: `http://localhost:3000/users`
   - для заявки: `http://localhost:3000/requests`
3. Откройте вкладку **Body**.
4. Выберите тип **raw** и в списке справа — **JSON**.
5. В текстовое поле вставьте JSON с полями (см. ниже).
6. Нажмите **Send**.

Ответ при успехе: статус **201 Created** и в теле — созданная запись (с полем `id`).

---

#### POST — создать пользователя (`/users`)

**URL:** `POST http://localhost:3000/users`

**Поля таблицы users:**

| Поле      | Тип     | Обязательное | Описание                          |
|-----------|--------|--------------|-----------------------------------|
| `username` | string | да           | Логин, уникальный в системе      |
| `password` | string | да           | Пароль                            |
| `isAdmin`  | boolean| нет          | Администратор или нет (по умолчанию `false`) |

**Пример тела запроса (JSON):**

```json
{
  "username": "ivan",
  "password": "secret123",
  "isAdmin": false
}
```

Если не передать `username` или `password`, сервер вернёт **400** с сообщением об ошибке.

---

#### POST — создать заявку (`/requests`)

**URL:** `POST http://localhost:3000/requests`

**Поля таблицы requests:**

| Поле        | Тип    | Обязательное | Описание                                      |
|-------------|--------|--------------|-----------------------------------------------|
| `breadType` | string | да           | Тип хлеба (например, «Белый», «Ржаной»)      |
| `quantityKg`| number | да           | Объём заказа в килограммах                    |
| `status`    | string | нет          | Статус заявки (по умолчанию `"new"`)          |
| `user_id`   | number | нет          | ID пользователя, создавшего заявку (связь с users) |

**Пример тела запроса (JSON):**

```json
{
  "breadType": "Белый",
  "quantityKg": 150.5,
  "status": "new",
  "user_id": 1
}
```

Минимально достаточно только обязательных полей:

```json
{
  "breadType": "Ржаной",
  "quantityKg": 200
}
```

Если не передать `breadType` или `quantityKg`, сервер вернёт **400**.

---

#### POST через curl (из командной строки)

**Создать пользователя:**

```bash
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"username\":\"ivan\",\"password\":\"secret123\",\"isAdmin\":false}"
```

**Создать заявку:**

```bash
curl -X POST http://localhost:3000/requests -H "Content-Type: application/json" -d "{\"breadType\":\"Белый\",\"quantityKg\":100,\"status\":\"new\",\"user_id\":1}"
```

Важно: заголовок `Content-Type: application/json` обязателен, иначе сервер не распознает тело как JSON.