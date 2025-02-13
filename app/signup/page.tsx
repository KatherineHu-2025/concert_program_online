"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, Auth } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import styles from "../../styles/SignUp.module.css";
import DecorativeDivider from "@/components/DecorativeDots";
import { Lora } from "next/font/google";

const lora = Lora({ subsets: ["latin"], weight: ["400", "700"] });

const SignUpPage = () => {
    

    const router = useRouter();
    const [auth, setAuth] = useState<Auth | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      import("../../firebaseConfig").then(() => setAuth(getAuth() as Auth | null));
    }, []);
  
    const handlePasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!auth) return;
      setError(null);
  
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push("/");
      } catch (err) {
        setError(err instanceof FirebaseError ? err.message : "An unexpected error occurred");
      }
    };
  
    const handleGoogleSignIn = async () => {
      if (!auth) return;
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
        router.push("/");
      } catch (err) {
        setError(err instanceof FirebaseError ? err.message : "An unexpected error occurred.");
      }
    };


    return (
      <div className={lora.className}> {/* Apply font class here */}
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
                <div className={styles.rightPanel}>
                    <div className={styles.headerContainer}>
                        <h2 className={styles.heading}>Register Administrative Account!</h2>
                        <p className={styles.subheading}>For purposes of hosting and editing events, an account is required.</p>
                    </div>
                    <DecorativeDivider dotCount={20} musicNotePosition="front" />
                    <form onSubmit={handlePasswordSubmit} className={styles.form}>
                        <label>
                            Your username
                            <span className={styles.asterisk}>*</span>
                        </label>
                        <input type="text" className={styles.inputField} required placeholder="Enter your username" />
                        <label>
                            Email address
                            <span className={styles.asterisk}>*</span>
                        </label>
                        <input type="email" className={styles.inputField} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
                        <label>
                            Create password
                            <span className={styles.asterisk}>*</span>
                        </label>
                        <input type="password" className={styles.inputField} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" />
                        <div className={styles.termsContainer}>
                            <input type="checkbox" required /> I agree to terms & conditions
                        </div>
                        <p className={styles.alreadyUserText} onClick={() => router.push("/login")}>
                            I&apos;m already a user.   
                        </p>
                        {error && <p className={styles.error}>{error}</p>}
                        <button type="submit" className={styles.submitButton}>Register Account</button>
                    </form>
                    <div className={styles.orContainer}><span className={styles.orText}>or</span></div>
                    <button onClick={handleGoogleSignIn} className={styles.googleButton} disabled={!auth}>
                        <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" width={24} height={24} />
                        Register with Google
                    </button>
                </div>
            </div>
        </div>

    );
  };
  
  export default SignUpPage;
  