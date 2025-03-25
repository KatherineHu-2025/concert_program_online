"use client";

import { FunctionComponent, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '../firebaseConfig';
import { User } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import styles from '../styles/NavBar.module.css';
import Image from "next/image";

const NavBar: FunctionComponent = () => {
    const [active, setActive] = useState<'dashboard' | 'database'>('dashboard');
    const [user, setUser] = useState<User | null>(null);
    const [profileColor, setProfileColor] = useState("#FFFFFF");
    const router = useRouter();
    const pathname = usePathname(); // Detects current route

    useEffect(() => {
        // Set active page based on current route
        if (pathname === "/") {
            setActive('dashboard');
        } else if (pathname === "/database") {
            setActive('database');
        }
    }, [pathname]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setProfileColor(userDoc.data().profileColor || "#A5A46B");
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const handleDashboardClick = () => {
        router.push('/');
    };

    const handleDatabaseClick = () => {
        router.push('/database');
    };

    const handleSignUpOrAvatarClick = () => {
        if (user) {
            router.push('/account');
        } else {
            router.push('/signup');
        }
    };

    return (
        <div className={styles.navbar}>
            <div className={styles.interactiveConcertProgramContainer}>
                <p className={styles.interactive}>Interactive</p>
                <p className={styles.interactive}>Concert ♫</p>
                <p className={styles.interactive}>Program</p>
            </div>
            
            <div className={styles.databaseParent}>
                <div
                    className={`${styles.dashboard} ${active === 'dashboard' ? styles.activeButton : ''}`}
                    onClick={handleDashboardClick}
                >
                    <Image
                        className={styles.icon}
                        alt="Dashboard Icon"
                        src={active === 'dashboard' ? '/home-active.svg' : '/home.svg'}
                        width={24} 
                        height={24} 
                    />
                    <b className={styles.dashboardText}>Dashboard</b>
                </div>
                
                <div
                    className={`${styles.database} ${active === 'database' ? styles.activeButton : ''}`}
                    onClick={handleDatabaseClick}
                >
                    <Image
                        className={styles.server02Icon}
                        alt="Database Icon"
                        src={active === 'database' ? '/database-active.svg' : '/database.svg'}
                        width={24} 
                        height={24} 
                    />
                    <b className={styles.databaseText}>Database</b>
                </div>
    
                <div
                    className={styles.activeBar}
                   style={{ transform: active === 'dashboard' ? 'translateY(0)' : 'translateY(60px)' }}
                />
            </div>
            
            <div className={styles.account} onClick={handleSignUpOrAvatarClick}>
                {user ? (
                    <>
                        <div className={styles.avatar} style={{ backgroundColor: profileColor }}>
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : "?"}
                        </div>
                        <span className={styles.userName}>{user.displayName || "User"}</span>
                    </>
                ) : (
                    <div className={styles.signUp}>Sign Up</div>
                )}
            </div>
        </div>
    );
};

export default NavBar;
