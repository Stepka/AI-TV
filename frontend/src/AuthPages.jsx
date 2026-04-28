import React from "react";
import AppButton from "./AppButton";

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
  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <span className="auth-brand">AI-TV</span>
          <h1>Login</h1>
          <p>Sign in to manage channels, playlists, and audio branding.</p>
        </div>

        <form className="auth-form" onSubmit={(event) => {
          event.preventDefault();
          onLogin();
        }}>
          <input
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="Email or username"
            autoComplete="username"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />

          {authError && <div className="error">{authError}</div>}
          {authInfo && <div className="success">{authInfo}</div>}

          <div className="auth-actions">
            <AppButton type="submit" disabled={authLoading}>
              {authLoading ? "Logging in..." : "Login"}
            </AppButton>

            <a className="auth-link-button" href="#/register">
              Register
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
  registerLoading,
  onEmailChange,
  onPasswordChange,
  onRegister,
}) {
  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <span className="auth-brand">AI-TV</span>
          <h1>Registration</h1>
          <p>Create a free account or use an invitation link.</p>
        </div>

        <form className="auth-form" onSubmit={(event) => {
          event.preventDefault();
          onRegister();
        }}>
          <input
            type="email"
            value={registerEmail}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="Email"
            autoComplete="email"
          />

          <input
            type="password"
            value={registerPassword}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Password"
            autoComplete="new-password"
          />

          {registerError && <div className="error">{registerError}</div>}
          {!!registerInviteCode && (
            <div className="muted">
              Invite applied for {registerEmail || "this registration"}
            </div>
          )}

          <div className="auth-actions">
            <AppButton type="submit" disabled={registerLoading}>
              {registerLoading ? "Registering..." : "Register"}
            </AppButton>

            <a className="auth-link-button" href="#/login">
              Back to login
            </a>
          </div>
        </form>
      </section>
    </div>
  );
}
