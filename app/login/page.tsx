"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, Auth } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import styles from "../../styles/SignUp.module.css"; // Using same styles as SignUp
import { Lora } from "next/font/google";

const lora = Lora({ subsets: ["latin"], weight: ["400", "700"] });

const LoginPage = () => {
    const router = useRouter();
    const [auth, setAuth] = useState<Auth | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        import("../../firebaseConfig").then(() => setAuth(getAuth() as Auth | null));
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;
        setError(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/"); // Redirect to dashboard after login
        } catch (err) {
            setError(err instanceof FirebaseError ? err.message : "An unexpected error occurred.");
        }
    };

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push("/"); // Redirect to dashboard
        } catch (err) {
            setError(err instanceof FirebaseError ? err.message : "An unexpected error occurred.");
        }
    };

    return (
        <div className={lora.className}>
           <div className={styles.pageContainer}>
                <div className={styles.leftPanel}>
                    <div className={styles.brandContainer}>
                        <h1 className={styles.brand}>Interactive</h1>
                        <h1 className={styles.brand}>Concert</h1>
                        <h1 className={styles.brand}>Program</h1>
                    </div>
                    <p className={styles.quote}>Music transcends time.</p>
                </div>
                <div className={styles.rightDecorations}>
                    <div className={styles.rectangle1}></div>
                    <div className={styles.rectangle2}></div>
                    <div className={styles.rectangle3}></div>
                </div>

                {/* Right Panel (Login Form) */}
                <div className={styles.rightPanel}>
                    <div className={styles.headerContainer}>
                        <h2 className={styles.heading}>Administrative Account Login!</h2>
                        <p className={styles.subheading}>To host and edit events, an account is required.</p>
                    </div>

                    <form onSubmit={handleLogin} className={styles.form}>
                        <label>
                            Email address
                            <span className={styles.asterisk}>*</span>
                        </label>
                        <input 
                            type="email" 
                            className={styles.inputField} 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            placeholder="Enter your email" 
                        />
                        
                        <label>
                            Password
                            <span className={styles.asterisk}>*</span>
                        </label>
                        <input 
                            type="password" 
                            className={styles.inputField} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="Enter your password" 
                        />

                        <div className={styles.forgotPassword}>
                            <a href="/forgot-password">Forgot Password?</a>
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        <button type="submit" className={styles.submitButton}>Login</button>
                    </form>

                    <div className={styles.orContainer}><span className={styles.orText}>or</span></div>

                    <button onClick={handleGoogleSignIn} className={styles.googleButton} disabled={!auth}>
                        <Image 
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                            alt="Google Logo" 
                            width={24} 
                            height={24} 
                        />
                        Login with Google
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
