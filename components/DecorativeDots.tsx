import React from "react";
import styles from "../styles/DecorativeDots.module.css"; // Ensure this CSS file exists
import Image from "next/image";

interface DecorativeDividerProps {
  dotCount?: number; // Number of dots
  musicNotePosition?: "front" | "back"; // Determines the position of the music note
}

const DecorativeDivider: React.FC<DecorativeDividerProps> = ({ dotCount = 20, musicNotePosition = "back" }) => {
  return (
    <div className={styles.divider}>
      {musicNotePosition === "front" && <Image 
        src="/music.svg" 
        alt="🎵" 
        width={24} 
        height={24} 
    />}
      <span className={styles.dots}>
        {"•".repeat(dotCount)}
      </span>
      {musicNotePosition === "back" && <Image 
        src="/music.svg" 
        alt="🎵" 
        width={24} 
        height={24} 
    />}
    </div>
    

  );
};

export default DecorativeDivider;
