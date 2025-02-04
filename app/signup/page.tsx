"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signInWithPopup, GoogleAuthProvider, Auth } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import styles from "../../styles/SignUp.module.css";

const LoginOrSignUp = () => {
    const router = useRouter();
    const [auth, setAuth] = useState<Auth | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
    const [showPasswordInput, setShowPasswordInput] = useState(false);

    useEffect(() => {
        import("../../firebaseConfig").then(() => setAuth(getAuth())); // ✅ Now properly typed
    }, []);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return; // Prevent execution if auth is not initialized
        setError(null);

        try {
            const normalizedEmail = email.trim().toLowerCase();
            const signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);

            if (signInMethods.includes("password")) {
                setIsExistingUser(true);
            } else if (signInMethods.includes("google.com")) {
                setError("This email is registered with Google Sign-In. Please use that method.");
                setIsExistingUser(null);
            } else {
                setIsExistingUser(false);
            }
            setShowPasswordInput(true);
        } catch (err) {
            console.error("Error fetching sign-in methods:", err);
            if (err instanceof FirebaseError) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;
        setError(null);

        try {
            if (isExistingUser) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            router.push("/");
        } catch (err) {
            if (err instanceof FirebaseError) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred");
            }
        }
    };

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push("/");
        } catch (err) {
            if (err instanceof FirebaseError) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred.");
            }
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>
                {isExistingUser === null ? "Log In / Sign Up" : isExistingUser ? "Log In" : "Sign Up"}
            </h2>
            <form onSubmit={showPasswordInput ? handlePasswordSubmit : handleEmailSubmit} className={styles.form}>
                <label>Email address</label>
                <input
                    type="email"
                    className={styles.inputField}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    disabled={showPasswordInput}
                />
                {showPasswordInput && (
                    <>
                        <label>Password</label>
                        <input
                            type="password"
                            className={styles.inputField}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </>
                )}
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" className={styles.submitButton}>
                    {isExistingUser === null ? "Next" : isExistingUser ? "Log In" : "Sign Up"}
                </button>
            </form>

            <div className={styles.orContainer}>
                <span className={styles.orText}>Or</span>
            </div>

            <button onClick={handleGoogleSignIn} className={styles.googleButton} disabled={!auth}>
                <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" width={24} height={24} />
                Continue with Google
            </button>
        </div>
    );
};

export default LoginOrSignUp;