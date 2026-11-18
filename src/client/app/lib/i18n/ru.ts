const labels: Record<string, string> = {
  USER: "Покупатель", ADMIN: "Администратор", SUPERADMIN: "Главный администратор",
  PENDING: "В обработке", PROCESSING: "Обрабатывается", COMPLETED: "Завершён",
  PAID: "Оплачен", UNPAID: "Не оплачен", FAILED: "Ошибка", SHIPPED: "Отправлен",
  IN_TRANSIT: "В пути", DELIVERED: "Доставлен", CANCELLED: "Отменён", CANCELED: "Отменён",
  RETURNED: "Возвращён", REFUNDED: "Возврат средств", OPEN: "Открыто", RESOLVED: "Закрыто",
  ACTIVE: "Активен", INACTIVE: "Неактивен", UNKNOWN: "Неизвестно",
  INFO: "Информация", WARN: "Предупреждение", ERROR: "Ошибка", DEBUG: "Отладка",
  CARD: "Банковская карта", CREDIT_CARD: "Банковская карта",
};

export function localizeLabel(value: string | null | undefined): string {
  if (!value) return "Не указано";
  return labels[value.toUpperCase()] ?? value;
}

const messages: Record<string, string> = {
  "Email or password is incorrect.": "Неверная почта или пароль.",
  "Invalid credentials": "Неверная почта или пароль.",
  "User registered successfully": "Аккаунт создан.",
  "User logged in successfully": "Вы вошли в аккаунт.",
  "Logged out successfully": "Вы вышли из аккаунта.",
  "User logged out successfully": "Вы вышли из аккаунта.",
  "Session expired. Please log in again.": "Сессия истекла. Войдите снова.",
  "Unauthorized, please log in": "Войдите в аккаунт.",
  "Invalid access token, please log in": "Сессия истекла. Войдите снова.",
  "User no longer exists.": "Аккаунт не найден.",
  "User not found": "Пользователь не найден.",
  "Cart is empty": "Корзина пуста.",
  "Cart item not found": "Товар в корзине не найден.",
  "Product not found": "Товар не найден.",
  "Variant not found": "Вариант товара не найден.",
  "Password reset email sent successfully": "Письмо для восстановления пароля отправлено.",
  "Password reset successful. You can now log in.": "Пароль изменён. Теперь можно войти.",
  "You have already reviewed this product": "Вы уже оставили отзыв об этом товаре.",
  "Rating must be an integer between 1 and 5": "Выберите оценку от 1 до 5.",
  "An error occurred": "Произошла ошибка.",
  "Something went wrong": "Что-то пошло не так.",
  "Failed to fetch": "Не удалось подключиться к серверу.",
};

export function localizeMessage(message: unknown): string {
  if (typeof message !== "string" || !message.trim()) return "Не удалось выполнить действие.";
  if (messages[message]) return messages[message];
  if (/[а-яё]/i.test(message)) return message;
  if (/insufficient stock/i.test(message)) return "Недостаточно товара на складе. Уменьшите количество.";
  if (/already.*(registered|exist)|email.*(used|taken)/i.test(message)) return "Этот адрес электронной почты уже используется.";
  if (/not authorized|forbidden|permission|access denied/i.test(message)) return "Недостаточно прав для этого действия.";
  if (/token.*(expired|invalid)|invalid.*token/i.test(message)) return "Ссылка или сессия устарела. Повторите запрос.";
  if (/successfully|success/i.test(message)) return "Действие выполнено.";
  return "Не удалось выполнить действие. Проверьте данные и попробуйте снова.";
}
