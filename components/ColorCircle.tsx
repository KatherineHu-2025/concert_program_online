import React, { useState, useEffect } from "react";
import styles from "../styles/ColorCircle.module.css";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { auth } from "../firebaseConfig";

const colors = ["#82634E", "#A5A46B", "#F2C3B3", "#733E58", "#7472B3", "#FEFBF4", "#334934"];

interface ColorCircleProps {
    eventId: string; // Pass eventId as a prop
}

const ColorCircle: React.FC<ColorCircleProps> = ({ eventId }) => {
    const [selectedColor, setSelectedColor] = useState(colors[0]);
    const [showMenu, setShowMenu] = useState(false);

    const user = auth.currentUser;

    // Fetch stored color for this event
    useEffect(() => {
        const fetchColor = async () => {
            if (!user || !eventId) return;
            const eventDoc = doc(db, "users", user.uid, "events", eventId);
            const docSnap = await getDoc(eventDoc);
            if (docSnap.exists()) {
                setSelectedColor(docSnap.data().color || colors[0]);
            }
        };
        fetchColor();
    }, [user, eventId]);

    // Save color to Firebase
    const handleColorSelect = async (color: string) => {
        setSelectedColor(color);
        setShowMenu(false);

        if (user && eventId) {
            await setDoc(doc(db, "users", user.uid, "events", eventId), { color }, { merge: true });
        }
    };

    return (
        <div className={styles.container}>
            <div
                className={styles.circle}
                style={{ backgroundColor: selectedColor }}
                onClick={() => setShowMenu(!showMenu)}
            ></div>

            {showMenu && (
                <div className={styles.menu}>
                    {colors.map((color) => (
                        <div
                            key={color}
                            className={styles.colorOption}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorSelect(color)}
                        ></div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ColorCircle;
