"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebaseConfig";
import { signOut, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import styles from "../../styles/Account.module.css";
import NavBar from "../../components/NavBar";
import Image from "next/image";

const AccountPage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [selectedColor, setSelectedColor] = useState("#A5A46B"); // Default color
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setName(currentUser.displayName || "");
                setEmail(currentUser.email || "");
    
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
    
                if (userDoc.exists()) {
                    // Ensure profileColor exists; if not, set a default one
                    const data = userDoc.data();
                    if (!data.profileColor) {
                        await setDoc(userDocRef, { profileColor: "#A5A46B" }, { merge: true });
                        setSelectedColor("#A5A46B");
                    } else {
                        setSelectedColor(data.profileColor);
                    }
                } else {
                    // Create the user document if it doesn't exist
                    await setDoc(userDocRef, { profileColor: "#A5A46B" });
                    setSelectedColor("#A5A46B");
                }
            } else {
                router.push("/signup");
            }
        });
        return () => unsubscribe();
    }, [router]);
    

    const handleSave = async () => {
        console.log(user)
        if (user) {
            try {
                await setDoc(doc(db, "users", user.uid), { profileColor: selectedColor }, { merge: true });
                alert("Profile updated successfully!");
            } catch (error) {
                alert("Failed to update profile: " + (error instanceof Error ? error.message : "Unknown error"));
            }
        }
    };

    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
    };

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/signup"); // Redirect to login page after sign out
    };

    return (
        <div className={styles.container}>
            <NavBar />
            <div className={styles.content}>
                <button onClick={() => window.history.back()} className={styles.backButton}>
                    <Image src="/arrow-left.svg" alt="Back" width={24} height={24} className={styles.icon} />
                </button>
                <div className={styles.profileSection}>
                    <div className={styles.avatar} style={{ backgroundColor: selectedColor }} />
                    <div className = {styles.nameAndEmail}>
                        <h2 className={styles.name}>{name || "Name"}</h2>
                        <p className={styles.email}>{email}</p>
                    </div>
                </div>
                <div className={styles.form}>
                    <label>Email Address</label>
                    <input type="email" className={styles.input} value={email} disabled />

                    <label>Current Password</label>
                    <input type="password" className={styles.input} disabled value="********" />
                    <a href="#" className={styles.changePassword}>Change Password?</a>
                    
                    <label>Profile Picture</label>
                    <div className={styles.colorPicker}>
                        {["#DEDDED", "#A5A46B", "#F2C3B3", "#7472B3", "#334934", "#D8F8D8", "#232239"].map((color) => (
                            <div 
                                key={color} 
                                className={styles.colorOption} 
                                style={{ backgroundColor: color, border: selectedColor === color ? "2px solid black" : "none" }}
                                onClick={() => handleColorSelect(color)}
                            />
                        ))}
                    </div>
                    
                    <button className={styles.saveButton} onClick={handleSave}>Save Changes</button>
                    <button className={styles.saveButton} onClick={handleSignOut}>Sign Out</button>
                </div>
            </div>
        </div>
    );
};

export default AccountPage;