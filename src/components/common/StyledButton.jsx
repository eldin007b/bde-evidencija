import React from "react";

export default function Button({ children, onClick, type = "button" }) {
  return (
    <button className="styled-button" type={type} onClick={onClick}>
      {children}
    </button>
  );
}