// "use client";

// import { useRouter } from "next/navigation";
// import React, { useState, useEffect } from "react";
// import Image from "next/image";
// import { getAuth, onAuthStateChanged, updateProfile, User } from "firebase/auth";
// import styles from "../../styles/Account.module.css"; 
// import NavBar from "../../components/NavBar";

// const AccountInformation = () => {
//     const router = useRouter();
//     const auth = getAuth();
    
//     // State to hold user data and selected profile color
//     const [user, setUser] = useState<User | null>(null);
//     const [selectedColor, setSelectedColor] = useState<string | null>(null);

//     // Predefined profile colors
//     const profileColors = [
//         "#8B5E3C", "#9DA778", "#8A5675", "#7472B3", "#FDFBF4",
//         "#334934", "#DADAF4", "#E0EFD8", "#3B3C50"
//     ];

//     // Fetch user data on component mount
//     useEffect(() => {
//         const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//             setUser(currentUser);
//             if (currentUser?.photoURL) {
//                 setSelectedColor(currentUser.photoURL); // Assuming color is stored in photoURL
//             }
//         });
//         return () => unsubscribe();
//     }, [auth]);

//     // Function to update profile picture with selected color
//     const updateProfilePicture = async (color: string) => {
//         if (user) {
//             await updateProfile(user, { photoURL: color });
//             setSelectedColor(color);
//         }
//     };

//     // Handle navigation
//     const goBackDash = () => {
//         router.push("/"); // Redirect to the Dashboard page
//     };

//     return (
//         <div className={styles.accountInformation}>
//             <div className={styles.infoBackground} />
//             <div className={styles.eventBackground} />

//             {/* User Info Section */}
//             <div className={styles.initialInfo}>
//                 <div className={styles.initialInfoChild} />
//                 <i className={styles.name}>{user?.displayName || "No Name Provided"}</i>
//                 <i className={styles.usernameEmail}>{user?.email || "No Email Provided"}</i>
                
//                 <button className={styles.arrowButton} onClick={goBackDash}>
//                     <Image 
//                         className={styles.arrowLeftIcon} 
//                         width={24} 
//                         height={24} 
//                         alt="Go back" 
//                         src="arrow-left.svg" 
//                     />
//                 </button>
//             </div>

//             {/* Password Change Section */}
//             <div className={styles.passwordBar}>
//                 <div className={styles.passwordBarChild} />
//                 <Image className={styles.decorativeDotsIcon} width={162} height={6} alt="" src="Decorative Dots.svg" />
//                 <div className={styles.currentPassword}>Current Password</div>
//                 <Image className={styles.eyeOffIcon} width={24} height={24} alt="" src="eye-off.svg" />
//                 <button className={styles.changePassword}>
//                     Change Password?
//                 </button>
//             </div>

//             {/* Name Section */}
//             <div className={styles.nameChange}>
//                 <div className={styles.passwordBarChild} />
//                 <div className={styles.username}>Name</div>
//                 <i className={styles.currentName}>{user?.displayName || "No Name Provided"}</i>
//             </div>

//             {/* Username Section */}
//             <div className={styles.usernameChange}>
//                 <div className={styles.passwordBarChild} />
//                 <div className={styles.username}>Username</div>
//                 <i className={styles.currentUsername}>{user?.displayName || "No Username Set"}</i>
//             </div>

//             {/* Email Section */}
//             <div className={styles.emailChange}>
//                 <div className={styles.passwordBarChild} />
//                 <div className={styles.username}>Email Address</div>
//                 <i className={styles.currentEmailAddress}>{user?.email || "No Email Provided"}</i>
//             </div>

//             {/* Profile Picture Selection Section */}
//             <div className={styles.profilePictureChange}>
//                 <div className={styles.profilePicture}>Profile Picture</div>

//                 {/* Display the selected color as the profile picture */}
//                 <div 
//                     className={styles.selectedProfilePicture} 
//                     style={{ backgroundColor: selectedColor || "#fdfbf4" }}
//                 />

//                 {/* Color selection row */}
//                 <div className={styles.colorOptions}>
//                     {profileColors.map((color) => (
//                         <div
//                             key={color}
//                             className={`${styles.colorCircle} ${selectedColor === color ? styles.selected : ""}`}
//                             style={{ backgroundColor: color }}
//                             onClick={() => updateProfilePicture(color)}
//                         />
//                     ))}
//                 </div>
//             </div>

//             {/* Your Events Section */}
//             <div className={styles.eventBackground}>
//                 <div className={styles.events}>
//                     <b className={styles.yourEvents}>Your Events</b>
//                 </div>
//             </div>

//             <div className={styles.container}>
//                 <NavBar />
//             </div>
//         </div>
//     );
// };

// export default AccountInformation;


"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import styles from "../../styles/Account.module.css"; 
import NavBar from "../../components/NavBar";




const AccountInformation = () => {
    const router = useRouter();
    const auth = getAuth();
    
    // State to hold user data
    const [user, setUser] = useState<User | null>(null);


    // Fetch user data on component mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);
    

    // Handle navigation
    const goBackDash = () => {
        router.push("/"); // Redirect to the Dashboard page
    };

    const changePassword = () => {
        router.push("/change-password"); // Redirect to password change page (if implemented)
    };

        const newPFP = () => {
        
    };




    return (
        <div className={styles.accountInformation}>
            <div className={styles.infoBackground} />
            <div className={styles.eventBackground} />

            {/* User Info Section */}
            <div className={styles.initialInfo}>
                <div className={styles.initialInfoChild} />
                <i className={styles.name}>{user?.displayName || "No Name Provided"}</i>
                <i className={styles.usernameEmail}>{user?.email || "No Email Provided"}</i>
                
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

            {/* Password Change Section */}
            <div className={styles.passwordBar}>
                <div className={styles.passwordBarChild} />
                <div className={styles.currentPassword}>Current Password</div>
                <Image className={styles.eyeOffIcon} width={24} height={24} alt="" src="eye-off.svg" />
                <button className={styles.changePassword} onClick={changePassword}>
                    Change Password?
                </button>
            </div>

            {/* Name Section */}
            <div className={styles.nameChange}>
                <div className={styles.passwordBarChild} />
                <div className={styles.username}>Name</div>
                <i className={styles.currentName}>{user?.displayName || "No Name Provided"}</i>
            </div>

            {/* Username Section */}
            <div className={styles.usernameChange}>
                <div className={styles.passwordBarChild} />
                <div className={styles.username}>Username</div>
                <i className={styles.currentUsername}>{user?.displayName || "No Username Set"}</i>
            </div>

            {/* Email Section */}
            <div className={styles.emailChange}>
                <div className={styles.passwordBarChild} />
                <div className={styles.username}>Email Address</div>
                <i className={styles.currentEmailAddress}>{user?.email || "No Email Provided"}</i>
            </div>

            {/* Profile Picture Section */}
            <div className={styles.profilePictureChange}>
                <div className={styles.profilePicture}>Profile Picture</div>
                <div className={styles.profilePictureChangeChild} />
                <Image 
                    className={styles.plusIcon} 
                    width={24} 
                    height={24} 
                    alt="Add new profile picture" 
                    src="plus.svg" 
                />

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

            <div className={styles.container}>
                <NavBar />
            </div>
        </div>
    );
};

export default AccountInformation;
        				