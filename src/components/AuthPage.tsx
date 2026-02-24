import { FormEvent } from 'react';

interface AuthPageProps {
  username: string;
  password: string;
  remember: boolean;
  showPassword: boolean;
  authError: string | null;
  loadingAuth: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (checked: boolean) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function AuthPage({
  username,
  password,
  remember,
  showPassword,
  authError,
  loadingAuth,
  onUsernameChange,
  onPasswordChange,
  onRememberChange,
  onTogglePassword,
  onSubmit
}: AuthPageProps) {
  return (
    <main className="page auth-page">
      <section className="auth-card">
        <div className="auth-logo"><span className="auth-logo-mark" aria-hidden="true" /></div>
        <div className="auth-title-wrap">
          <h1>Добро пожаловать!</h1>
          <p className="hint auth-subtitle">Пожалуйста, авторизируйтесь</p>
        </div>

        <form onSubmit={onSubmit} className="form-grid">
          <label>
            Логин
            <span className="field-input">
              <span className="input-icon input-icon-user" aria-hidden="true" />
              <input
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                placeholder="Введите username"
              />
              {username && (
                <button
                  type="button"
                  className="icon-action"
                  onClick={() => onUsernameChange('')}
                  aria-label="Очистить логин"
                >
                  <span className="input-icon input-icon-clear" aria-hidden="true" />
                </button>
              )}
            </span>
          </label>
          <label>
            Пароль
            <span className="field-input">
              <span className="input-icon input-icon-lock" aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="Введите пароль"
              />
              {password && (
                <button
                  type="button"
                  className="icon-action"
                  onClick={onTogglePassword}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  <span className={`input-icon ${showPassword ? 'input-icon-eye-open' : 'input-icon-eye'}`} aria-hidden="true" />
                </button>
              )}
            </span>
          </label>
          <label className="checkbox remember-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => onRememberChange(event.target.checked)}
            />
            Запомнить данные
          </label>
          {authError && <p className="error">{authError}</p>}
          <button disabled={loadingAuth} type="submit" className="primary-btn full-width">
            {loadingAuth ? 'Входим...' : 'Войти'}
          </button>
          <div className="auth-divider">или</div>
          <p className="register-hint">
            Нет аккаунта? <a href="#">Создать</a>
          </p>
        </form>
      </section>
    </main>
  );
}
