"use client";

import React from 'react';
import NavBar from '../../components/NavBar';
import styles from '../../styles/DatabasePage.module.css';

const DatabasePage: React.FC = () => {
    return (
        <div className={styles.container}>
            <NavBar />
            <div className={styles.imageContainer}>
                <img src="/database-image.png" alt="Database Background" className={styles.fullscreenImage} />
            </div>
        </div>
    );
};

export default DatabasePage;
