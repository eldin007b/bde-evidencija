import React from "react";
import './HeroSection.css';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-logo-wrap">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="32" fill="url(#grad)" />
          <text x="50%" y="54%" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#fff" fontFamily="Space Mono, Inter, Arial">B</text>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6a7fd1" />
              <stop offset="1" stopColor="#7c4ba2" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="hero-title">BDEVidencija</div>
      <div className="hero-sub">Vaša digitalna evidencija vožnji i dostava</div>
    </section>
  );
}
