import React from "react";
import AppButton from "./AppButton";
import { useI18n } from "./i18n";

export function LoginPage({
  username,
  password,
  authError,
  authInfo,
  authLoading,
  onUsernameChange,
  onPasswordChange,
  onLogin,
}) {
  const { t } = useI18n();

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <span className="auth-brand">{t("common.aiTv")}</span>
          <h1>{t("auth.loginTitle")}</h1>
          <p>{t("auth.loginDescription")}</p>
        </div>

        <form className="auth-form" onSubmit={(event) => {
          event.preventDefault();
          onLogin();
        }}>
          <input
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder={t("auth.usernamePlaceholder")}
            autoComplete="username"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
            autoComplete="current-password"
          />

          {authError && <div className="error">{authError}</div>}
          {authInfo && <div className="success">{authInfo}</div>}

          <div className="auth-actions">
            <AppButton type="submit" disabled={authLoading}>
              {authLoading ? t("auth.loggingIn") : t("auth.loginButton")}
            </AppButton>

            <a className="auth-link-button" href="#/register">
              {t("auth.registerLink")}
            </a>
          </div>
        </form>
      </section>
    </div>
  );
}

export function RegisterPage({
  registerEmail,
  registerPassword,
  registerInviteCode,
  registerError,
  registerInfo,
  registerLoading,
  registerVerificationPending,
  registerVerificationCode,
  onEmailChange,
  onPasswordChange,
  onVerificationCodeChange,
  onRegister,
  onVerifyEmail,
}) {
  const { t } = useI18n();

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <span className="auth-brand">{t("common.aiTv")}</span>
          <h1>{t("auth.registrationTitle")}</h1>
          <p>{t("auth.registrationDescription")}</p>
        </div>

        <form className="auth-form" onSubmit={(event) => {
          event.preventDefault();
          registerVerificationPending ? onVerifyEmail() : onRegister();
        }}>
          {!registerVerificationPending && (
            <>
              <input
                type="email"
                value={registerEmail}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
              />

              <input
                type="password"
                value={registerPassword}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                autoComplete="new-password"
              />
            </>
          )}

          {registerVerificationPending && (
            <>
              <div className="muted">
                {registerEmail}
              </div>

              <input
                inputMode="numeric"
                value={registerVerificationCode}
                onChange={(event) => onVerificationCodeChange(event.target.value)}
                placeholder={t("auth.verificationCodePlaceholder")}
                autoComplete="one-time-code"
              />
            </>
          )}

          {registerError && <div className="error">{registerError}</div>}
          {registerInfo && <div className="success">{registerInfo}</div>}
          {!!registerInviteCode && (
            <div className="muted">
              {t("auth.inviteApplied", { email: registerEmail || t("auth.inviteAppliedFallback") })}
            </div>
          )}

          <div className="auth-actions">
            <AppButton type="submit" disabled={registerLoading}>
              {registerLoading
                ? t("auth.registering")
                : registerVerificationPending
                  ? t("auth.verifyEmailButton")
                  : t("auth.registerButton")}
            </AppButton>

            <a className="auth-link-button" href="#/login">
              {t("auth.backToLogin")}
            </a>
          </div>
        </form>
      </section>
    </div>
  );
}
