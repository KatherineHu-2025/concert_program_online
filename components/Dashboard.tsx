"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    collection,
    onSnapshot,
    Timestamp,
    deleteDoc,
    addDoc,
    doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { auth } from "../firebaseConfig";
import styles from "../styles/Dashboard.module.css";
import ConcertCard from "./ConcertCard";

// Define the structure of an event
interface EventData {
    id: string; // Document ID
    title: string;
    date: Timestamp; // Use Timestamp consistently
    location: string;
}

const Dashboard = () => {
    const router = useRouter();
    const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
    const [pastEvents, setPastEvents] = useState<EventData[]>([]);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [searchUpcoming, setSearchUpcoming] = useState<string>(""); // Search for Upcoming
    const [searchPast, setSearchPast] = useState<string>(""); // Search for Past

    // Fetch events from Firestore in real-time
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (!user) {
                alert("You need to be logged in to view your events.");
                router.push("/signup");
            }
            setLoadingAuth(false);
        });
    
        return () => unsubscribeAuth();
    }, [router]);
    
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;
    
                const userId = user.uid;
                const userEventsCollectionRef = collection(db, "users", userId, "events");
                const now = new Date();
    
                const unsubscribe = onSnapshot(userEventsCollectionRef, (snapshot) => {
                    const eventList = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...(doc.data() as Omit<EventData, "id">),
                    }));
    
                    const upcoming = eventList.filter((event) => event.date.toDate() >= now);
                    const past = eventList.filter((event) => event.date.toDate() < now);
    
                    upcoming.sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());
                    past.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
    
                    setUpcomingEvents(upcoming);
                    setPastEvents(past);
                    setLoading(false); // Finish loading
                });
    
                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching events:", error);
                setLoading(false);
            }
        };
    
        if (!loadingAuth) fetchEvents();
    }, [loadingAuth]);

    // Navigate to the add-event form page
    const openAddEventForm = async () => {
        const user = auth.currentUser;
        
        if (!user) {
            alert("You need to be logged in to create an event.");
            return;
        }
    
        try {
            // Create an empty event in Firestore
            const eventRef = await addDoc(collection(db, "users", user.uid, "events"), {
                title: "Input your title here...",
                date: Timestamp.fromDate(new Date()),
                location: "",
                concertType: "",
                programs: [],
                performers: [],
                performanceGroup: null,
                customSections: [],
            });
    
            console.log("New event created with ID:", eventRef.id);
    
            // Redirect to the edit page with the new eventId
            router.push(`/add-event/${eventRef.id}`);
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event. Please try again.");
        }
    };

    const openAccountPage = async () => {
        const user = auth.currentUser;
    
        if (!user) {
            alert("You need to be logged in to create an event.");
            return;
        }
    
        // Redirect to the account page
        window.location.href = "/account"; // Change "/account" to your desired page
    };

    // Handle opening the delete confirmation form
    const openDeleteConfirm = (index: number, id: string) => {
        setSelectedEventIndex(index);
        setSelectedEventId(id);
        setIsDeleteConfirmOpen(true);
    };
    
    // Handle confirming the deletion
    const confirmDelete = async () => {
        const user = auth.currentUser;
    
        if (!user) {
            alert("You need to be logged in to delete an event.");
            return;
        }
    
        if (selectedEventIndex !== null && selectedEventId) {
            try {
                // Reference the event document under the user's collection
                const eventDoc = doc(db, "users", user.uid, "events", selectedEventId);
                await deleteDoc(eventDoc);
            } catch (error) {
                console.error("Error deleting document: ", error);
                alert("Failed to delete event. Please try again.");
            }
        }
        closeDeleteConfirm();
    };
    
    // Close the delete confirmation dialog
    const closeDeleteConfirm = () => {
        setIsDeleteConfirmOpen(false);
        setSelectedEventIndex(null);
        setSelectedEventId(null);
    };

    // Handle update button click
    const handleUpdate = (event: EventData) => {
        const user = auth.currentUser;
    
        if (!user) {
            alert("You need to be logged in to update an event.");
            return;
        }
    
        // Navigate to the update page, including the userId and eventId in the query parameters
        router.push(`/add-event/${event.id}`);
    };

    // Filter events in Upcoming and Past section
    const filteredUpcoming = upcomingEvents.filter(event =>
        event.title.toLowerCase().includes(searchUpcoming.toLowerCase())
    );

    const filteredPast = pastEvents.filter(event =>
        event.title.toLowerCase().includes(searchPast.toLowerCase())
    );
    
    if (loading || loadingAuth) {
        return <div className={styles.loading}>Loading...</div>; // Show a loading spinner or message
    }

    return (
        <div className={styles.background}>
            <h1 className={styles.dashboard}>Dashboard</h1>
    
            {/* Button to Navigate to the Account Page */}
            <button 
                className={styles.accountButton} 
                onClick={openAccountPage}
            >
                Go to Account Page
            </button>
    
            <div className={styles.section}>
                <div className={styles.upcoming}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Upcoming</h2>
                        <button
                            className={styles.addButton}
                            onClick={openAddEventForm}
                        >
                            +
                        </button>
                    </div>
    
                    {/* Search Input for Upcoming Events */}
                    <input
                        type="text"
                        placeholder="Search upcoming events..."
                        value={searchUpcoming}
                        onChange={(e) => setSearchUpcoming(e.target.value)}
                        className={styles.searchInput}
                    />
    
                    {filteredUpcoming.length > 0 ? (
                        filteredUpcoming.map((event, index) => (
                            <ConcertCard
                                key={event.id}
                                title={event.title}
                                time={event.date}
                                location={event.location}
                                onDelete={() => openDeleteConfirm(index, event.id)}
                                onUpdate={() => handleUpdate(event)}
                            />
                        ))
                    ) : (
                        <p className={styles.noResults}>No upcoming events found.</p>
                    )}
                </div>
    
                <div className={styles.past}>
                    <h2 className={styles.sectionTitle}>Past</h2>
                    <input
                        type="text"
                        placeholder="Search past events..."
                        value={searchPast}
                        onChange={(e) => setSearchPast(e.target.value)}
                        className={styles.searchInput}
                    />
    
                    {filteredPast.length > 0 ? (
                        filteredPast.map((event, index) => (
                            <ConcertCard
                                key={event.id}
                                title={event.title}
                                time={event.date}
                                location={event.location}
                                onDelete={() => openDeleteConfirm(index, event.id)}
                                onUpdate={() => handleUpdate(event)}
                            />
                        ))
                    ) : (
                        <p className={styles.noResults}>No past events found.</p>
                    )}
                </div>
            </div>
    
            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className={styles.modal}>
                    <div className={styles.confirmation}>
                        <p>Are you sure you want to delete this event?</p>
                        <button
                            onClick={confirmDelete}
                            className={styles.confirmButton}
                        >
                            Yes, delete
                        </button>
                        <button
                            onClick={closeDeleteConfirm}
                            className={styles.cancelButton}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;