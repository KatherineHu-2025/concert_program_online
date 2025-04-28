import React, { useState, useEffect, useCallback } from "react";
import styles from "../styles/ColorCircle.module.css";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { auth } from "../firebaseConfig";

const colors = ["#82634E", "#A5A46B", "#F2C3B3", "#733E58", "#7472B3", "#FEFBF4", "#334934"];

interface ColorCircleProps {
    eventId: string;
    selectedColor: string;
    onColorChange: (color: string) => void;
}

const ColorCircle: React.FC<ColorCircleProps> = ({ eventId, selectedColor, onColorChange }) => {
    const [showMenu, setShowMenu] = useState(false);
    const user = auth.currentUser;

    const fetchColor = useCallback(async () => {
        if (!user || !eventId) return;
        
        try {
            const eventDoc = doc(db, "users", user.uid, "events", eventId);
            const docSnap = await getDoc(eventDoc);
            if (docSnap.exists() && docSnap.data().color) {
                onColorChange(docSnap.data().color);
            }
        } catch (error) {
            console.error("Error fetching color:", error);
        }
    }, [user, eventId, onColorChange]);

    // Only fetch color once when component mounts
    useEffect(() => {
        // Only fetch if we're editing an existing event and the color is still default
        if (eventId && selectedColor === '#FFFFFF') {
            fetchColor();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleColorSelect = (color: string) => {
        onColorChange(color);
        setShowMenu(false);
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
