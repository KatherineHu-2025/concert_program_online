import React from 'react';
import styles from '../styles/ConcertCard.module.css';
import { Timestamp } from 'firebase/firestore';
import Image from "next/image";

interface ConcertCardProps {
    title: string;
    time: Timestamp;  // Use only Timestamp
    location: string;
    onDelete: () => void;
    onUpdate: () => void;
}

const ConcertCard: React.FC<ConcertCardProps> = ({ title, time, location, onDelete, onUpdate }) => {
    // Convert `time` to Date and format it
    const dateObj = time.toDate();
    const date = dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <div className={styles.concertCard}>
            <div className={styles.cardHeader}>
                <h3 className={styles.title}>{title}</h3>
                <div className={styles.deleteIcon} onClick={onDelete}></div>
            </div>
            <div className={styles.details}>
                <div className={styles.infoRow}>
                    <Image 
                        src="/calendar.svg" 
                        alt="Calendar" 
                        width={24} 
                        height={24} 
                        className={styles.icon} 
                    />
                    <span className={styles.text}>{date} {formattedTime}</span>
                </div>
                <div className={styles.infoRow}>
                    <Image 
                        src="/location.svg" 
                        alt="Location" 
                        width={24} 
                        height={24} 
                        className={styles.icon} 
                    />
                    <span className={styles.text}>{location}</span>
                </div>
            </div>
            <button className={styles.updateButton} onClick={onUpdate}>UPDATE</button> {/* Update button with onUpdate prop */}
        </div>
    );
};

export default ConcertCard;

