import React from 'react';
import styles from './UserInfo.module.css';

const UserInfo = ({ name, points, avatar }) => (
  <div className={styles.userInfo}>
    <img src={avatar || '/vite.svg'} alt="avatar" className={styles.avatar} />
    <div className={styles.textBlock}>
      <span className={styles.name}>{name}</span>
      <span className={styles.points}>{points}</span>
    </div>
  </div>
);

export default UserInfo;
