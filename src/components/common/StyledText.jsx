import React from "react";

export default function p({ children, secondary }) {
  return (
    <p className={`styled-text ${secondary ? "secondary" : ""}`}>
      {children}
    </p>
  );
}