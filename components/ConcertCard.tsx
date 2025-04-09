import React, { useState } from 'react';
import styles from '../styles/ConcertCard.module.css';
import { Timestamp } from 'firebase/firestore';
import Image from "next/image";
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

interface ConcertCardProps {
    id: string;  // Add this to receive the event ID
    title: string;
    time: Timestamp;
    location: string;
    color: string; 
    onDelete: () => void;
    onUpdate: () => void;
}

const ConcertCard: React.FC<ConcertCardProps> = ({ id, title, time, location, color, onDelete, onUpdate }) => {
    const [showQR, setShowQR] = useState(false);

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

    // Updated download function
    const downloadQRCode = () => {
        const canvas = document.getElementById('qr-code-canvas');
        if (canvas && canvas instanceof HTMLCanvasElement) {
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `${title}-qr-code.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    // Updated QR Code Modal
    const QRCodeModal = () => (
        <div className={styles.qrModal}>
            <div className={styles.qrModalContent}>
                <button 
                    className={styles.closeButton}
                    onClick={() => setShowQR(false)}
                >
                    ×
                </button>
                <h4>Scan QR Code</h4>
                {/* Display SVG for viewing - now only contains the ID */}
                <QRCodeSVG
                    value={id}  // Changed to only use the ID
                    size={200}
                    level="H"
                />
                {/* Hidden canvas for downloading - also only contains the ID */}
                <div style={{ display: 'none' }}>
                    <QRCodeCanvas
                        id="qr-code-canvas"
                        value={id}  // Changed to only use the ID
                        size={200}
                        level="H"
                    />
                </div>
                <button 
                    className={styles.downloadButton}
                    onClick={downloadQRCode}
                >
                    Download QR Code
                </button>
            </div>
        </div>
    );

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

            {/* Action Buttons (Trash Can, QR Code & Update) */}
            <div className={styles.actionContainer}>
                <div className={styles.deleteIcon} onClick={onDelete}></div>
                <button className={styles.qrButton} onClick={() => setShowQR(true)}>
                    <Image src="/qr-code.svg" alt="QR Code" width={20} height={20} />
                </button>
                <button className={styles.updateButton} onClick={onUpdate}>UPDATE</button>
            </div>

            {/* QR Code Modal */}
            {showQR && <QRCodeModal />}
        </div>
    );
};

export default ConcertCard;
