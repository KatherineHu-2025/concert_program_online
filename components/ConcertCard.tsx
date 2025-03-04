import React from 'react';
import styles from '../styles/ConcertCard.module.css';
import { Timestamp } from 'firebase/firestore';
import Image from "next/image";


interface ConcertCardProps {
    title: string;
    time: Timestamp;
    location: string;
    color: string; 
    onDelete: () => void;
    onUpdate: () => void;
}

const ConcertCard: React.FC<ConcertCardProps> = ({ title, time, location, color, onDelete, onUpdate }) => {
    const dateObj = time.toDate();
    const formattedDate = dateObj.toLocaleDateString(undefined, { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
    });
    const formattedTime = dateObj.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });
    const now = new Date();
    const isPast = dateObj < now;


    return (
        <div className={`${styles.concertCard} ${isPast ? styles.pastEvent : styles.upcomingEvent}`}>
            <div className={styles.cardContent}>
                <h3 className={styles.title}>{title}</h3>
                <div className={styles.infoContainer}>
                    <div className={styles.detailsContainer}>
                        <div className={styles.infoRow}>
                            <Image src="/calendar.svg" alt="Calendar" width={20} height={20} className={styles.icon} />
                            <span className={styles.text}>{formattedDate} {formattedTime}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <Image src="/location.svg" alt="Location" width={20} height={20} className={styles.icon} />
                            <span className={styles.text}>{location}</span>
                        </div>
                    </div>

                    <div className={styles.avatarContainer} style={{ backgroundColor: color }}></div>
                </div>
            </div>

            {/* Action Buttons (Trash Can & Update) */}
            <div className={styles.actionContainer}>
                <div className={styles.deleteIcon} onClick={onDelete}></div>
                <button className={styles.updateButton} onClick={onUpdate}>UPDATE</button>
            </div>
        </div>
    );
};

export default ConcertCard;
