export const authCopy = {
  ru: {
    loginTitle: 'Вход в аккаунт', registerTitle: 'Создать аккаунт', login: 'Войти', register: 'Зарегистрироваться',
    email: 'Электронная почта', password: 'Пароль', hint: 'Не менее 8 символов', switchRegister: 'Нет аккаунта? Зарегистрироваться', switchLogin: 'Уже есть аккаунт? Войти',
    loading: 'Подождите…', account: 'Аккаунт', logout: 'Выйти', logoutError: 'Не удалось завершить выход на сервере. Попробуйте позже.',
    invalid_input: 'Проверьте адрес почты и пароль (не менее 8 символов).', invalid_credentials: 'Неверная почта или пароль.', account_exists: 'Не удалось зарегистрироваться. Возможно, аккаунт уже существует. Попробуйте войти.',
    rate_limit: 'Слишком много попыток. Попробуйте позже.', confirmation_enabled: 'Регистрация временно недоступна: требуется настройка подтверждения почты.',
    unavailable: 'Сервис аккаунтов временно недоступен. Попробуйте позже.', forbidden: 'Запрос отклонён. Обновите страницу и попробуйте снова.',
  },
  en: {
    loginTitle: 'Log in to your account', registerTitle: 'Create an account', login: 'Log in', register: 'Create account',
    email: 'Email address', password: 'Password', hint: 'At least 8 characters', switchRegister: 'No account? Create one', switchLogin: 'Already have an account? Log in',
    loading: 'Please wait…', account: 'Account', logout: 'Log out', logoutError: 'Could not complete sign-out on the server. Try again later.',
    invalid_input: 'Check your email and password (at least 8 characters).', invalid_credentials: 'Incorrect email or password.', account_exists: 'Could not register. The account may already exist. Try logging in.',
    rate_limit: 'Too many attempts. Try again later.', confirmation_enabled: 'Registration is temporarily unavailable: email confirmation needs configuration.',
    unavailable: 'The account service is temporarily unavailable. Try again later.', forbidden: 'Request rejected. Refresh the page and try again.',
  },
} as const;
export type AuthErrorCode = 'invalid_input' | 'invalid_credentials' | 'account_exists' | 'rate_limit' | 'confirmation_enabled' | 'unavailable' | 'forbidden';
