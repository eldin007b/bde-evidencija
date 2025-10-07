import React from "react";
import "./StyledText.css";

export default function StyledText({ children, secondary }) {
  return (
    <p className={`styled-text ${secondary ? "secondary" : ""}`}>
      {children}
    </p>
  );
}