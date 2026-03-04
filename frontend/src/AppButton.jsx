import React from "react";
import "./button.css";

export default function AppButton({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      className="app-button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}