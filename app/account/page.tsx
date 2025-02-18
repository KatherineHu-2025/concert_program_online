"use client"; // Ensure this is a client component

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getAuth } from "firebase/auth";
import styles from "../../styles/Account.module.css"; 
import DecorativeDivider from "@/components/DecorativeDots";
import type { NextPage } from "next";
import { db } from "../../firebaseConfig";
import { auth } from "../../firebaseConfig";
import NavBar from "../../components/NavBar";
import ConcertCard from "../../components/ConcertCard";

const AccountInformation: NextPage = () => {
    const router = useRouter(); // ✅ useRouter must be inside the component

    const goBackDash = () => {
        router.push("/"); // Redirect to the Dashboard page
    };

    const newPFP = () => {
        
    };

    const changePassword = () => {
        
    };

    return (
        <div className={styles.accountInformation}>
            <div className={styles.infoBackground} />
            <div className={styles.eventBackground} />

            <div className={styles.initialInfo}>
                <div className={styles.initialInfoChild} />
                <i className={styles.name}>Name</i>
                <i className={styles.usernameEmail}>Username / email</i>
                
                {/* ✅ Arrow button that navigates back */}
                <button className={styles.arrowButton} onClick={goBackDash}>
                    <Image 
                        className={styles.arrowLeftIcon} 
                        width={24} 
                        height={24} 
                        alt="Go back" 
                        src="arrow-left.svg" 
                    />
                </button>
            </div>

            <div className={styles.passwordBar}>
                <div className={styles.passwordBarChild} />
                <Image className={styles.decorativeDotsIcon} width={162} height={6} alt="" src="Decorative Dots.svg" />
                <div className={styles.currentPassword}>Current Password</div>
                <Image className={styles.eyeOffIcon} width={24} height={24} alt="" src="eye-off.svg" />
                {/* <i className={styles.changePassword}>Change Password?</i> */}

                {/* ✅ Arrow button that navigates back */}
                <button className={styles.changePassword} onClick={changePassword}>
                    Change Password?
                </button>

                
            </div>

            <div className={styles.nameChange}>
                <div className={styles.passwordBarChild} />
                <div className={styles.username}>Name</div>
                <i className={styles.currentName}>Current Name</i>
            </div>

            <div className={styles.usernameChange}>
                <div className={styles.passwordBarChild} />
                <div className={styles.username}>Username</div>
                <i className={styles.currentUsername}>Current Username</i>
            </div>

            <div className={styles.emailChange}>
                <div className={styles.passwordBarChild} />
                <div className={styles.username}>Email Address</div>
                <i className={styles.currentEmailAddress}>Current Email Address</i>
            </div>

            <div className={styles.profilePictureChange}>
                <div className={styles.profilePicture}>Profile Picture</div>
                <div className={styles.profilePictureChangeChild} />
                <Image className={styles.plusIcon} width={24} height={24} alt="" src="plus.svg" />

                 {/* ✅ Arrow button that navigates back */}
                                <button className={styles.plusButton} onClick={newPFP}>
                    <Image 
                        className={styles.plusIcon} 
                        width={24} 
                        height={24} 
                        alt="Add new profile picture" 
                        src="plus.svg" 
                    />
                </button>
            </div>

            <div className={styles.events}>
                <b className={styles.yourEvents}>Your Events</b>
            </div>

            <div className={styles.container}>
                <NavBar />
                {/* Other homepage content */}
            </div>
        </div>
    );
};

export default AccountInformation;


// "use client"; // Ensure this is a client component

// import { useRouter } from "next/navigation";

// import NavBar from '../../components/NavBar';
// import React, { useState, useEffect } from "react";import Image from "next/image";
// import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, Auth } from "firebase/auth";
// import { FirebaseError } from "firebase/app";
// import styles from "../../styles/Account.module.css"; // Using same styles as SignUp
// import DecorativeDivider from "@/components/DecorativeDots";
// import { Lora } from "next/font/google";
// import type { NextPage } from 'next';import {
//     collection,
//     onSnapshot,
//     Timestamp,
//     deleteDoc,
//     addDoc,
//     doc,
// } from "firebase/firestore";
// import { db } from "../../firebaseConfig";
// import { auth } from "../../firebaseConfig";



// // import type { NextPage } from 'next';
// // import Image from "next/image";
// // import styles from './index.module.css';





// const AccountInformation:NextPage = () => {

// 	const goBackDash = () => {
// 		const router = useRouter(); // Initialize Next.js router

// 		router.push("/"); // Redirects to the Dashboard page
// 	};
//   	return (
//     		<div className={styles.accountInformation}>
//       			<div className={styles.infoBackground} />
//       			<div className={styles.eventBackground} />
//       			<div className={styles.initialInfo}>
//         				<div className={styles.initialInfoChild} />
//         				<i className={styles.name}>Name</i>
//         				<i className={styles.usernameEmail}>Username / email</i>
// 						<button className={styles.arrowButton} onClick={goBackDash}>
// 							<Image 
// 								className={styles.arrowLeftIcon} 
// 								width={24} 
// 								height={24} 
// 								alt="Go back" 
// 								src="arrow-left.svg" 
// 							/>
// 						</button>
//         				{/* <Image className={styles.arrowLeftIcon} width={24} height={24} alt="" src="arrow-left.svg" /> */}
//       			</div>
//       			<div className={styles.passwordBar}>
//         				<div className={styles.passwordBarChild} />
//         				<Image className={styles.decorativeDotsIcon} width={162} height={6} alt="" src="Decorative Dots.svg" />
//         				<div className={styles.currentPassword}>Current Password</div>
//         				<Image className={styles.eyeOffIcon} width={24} height={24} alt="" src="eye-off.svg" />
//         				<i className={styles.changePassword}>Change Password?</i>
//           					</div>
//           					<div className={styles.nameChange}>
//             						<div className={styles.passwordBarChild} />
//             						<div className={styles.username}>Name</div>
//             						<i className={styles.currentName}>Current Name</i>
//           					</div>
//           					<div className={styles.usernameChange}>
//             						<div className={styles.passwordBarChild} />
//             						<div className={styles.username}>Username</div>
//             						<i className={styles.currentUsername}>Current Username</i>
//           					</div>
//           					<div className={styles.emailChange}>
//             						<div className={styles.passwordBarChild} />
//             						<div className={styles.username}>Email Address</div>
//             						<i className={styles.currentEmailAddress}>Current Email Address</i>
//           					</div>
//           					<div className={styles.profilePictureChange}>
//             						<div className={styles.profilePicture}>Profile Picture</div>
//             						<div className={styles.profilePictureChangeChild} />
//             						<div className={styles.profilePictureChangeItem} />
//             						<div className={styles.profilePictureChangeInner} />
//             						<div className={styles.rectangleDiv} />
//             						<div className={styles.profilePictureChangeChild1} />
//             						<div className={styles.profilePictureChangeChild2} />
//             						<div className={styles.profilePictureChangeChild3} />
//             						<div className={styles.profilePictureChangeChild4} />
//             						<div className={styles.profilePictureChangeChild5} />
//             						<div className={styles.profilePictureChangeChild6} />
//             						<div className={styles.profilePictureChangeChild7} />
//             						<Image className={styles.plusIcon} width={24} height={24} alt="" src="plus.svg" />
//           					</div>
//           					<div className={styles.events}>
//             						<b className={styles.yourEvents}>Your Events</b>
//           					</div>

// 							<div className={styles.container}>
// 								<NavBar />
// 								{/* Other homepage content */}
// 							</div>
//           					</div>);
//         				};
        				
//         				export default AccountInformation;
        				
