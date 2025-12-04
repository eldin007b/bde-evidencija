import React from 'react';
import styles from './InfoCard.module.css';

const InfoCard = ({ icon, title, description, onClick }) => (
  <div className={styles.card} onClick={onClick}>
    <div className={styles.icon}>{icon}</div>
    <div className={styles.textBlock}>
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
    </div>
  </div>
);

export default InfoCard;
