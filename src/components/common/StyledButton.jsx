import React from "react";
import "./StyledButton.css";

export default function StyledButton({ children, onClick, type = "button" }) {
  return (
    <button className="styled-button" type={type} onClick={onClick}>
      {children}
    </button>
  );
}