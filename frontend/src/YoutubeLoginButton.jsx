import { useEffect, useState } from "react";

export default function GoogleLoginButton({ onSuccess }) {
    
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID;
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      console.log(CLIENT_ID)
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true
      });

      window.google.accounts.id.prompt((notification) => {

        if (notification.isNotDisplayed()) {
            console.log("User not logged in to Google");
        }

        if (notification.isSkippedMoment()) {
            console.log("User logged in but skipped login");
            // setHasSession(true);
        }

        if (notification.isDisplayed()) {
            console.log("User has Google session");
            // setHasSession(true);
        }

      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-button"),
        {
          theme: "outline",
          size: "large",
          width: 250
        }
      );
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = (response) => {
    if (onSuccess) {
      onSuccess(response.credential);
    }
  };

  return !hasSession ? (
    <div id="google-login-button"></div>
  ) : null;
}