"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    collection,
    onSnapshot,
    Timestamp,
    deleteDoc,
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
    const openAddEventForm = () => {
        router.push("/add-event");
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
    
                alert("Event successfully deleted!");
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

    if (loading || loadingAuth) {
        return <div className={styles.loading}>Loading...</div>; // Show a loading spinner or message
    }

    return (
        <div className={styles.background}>
            <h1 className={styles.dashboard}>Dashboard</h1>
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

                    {/* Render each upcoming event card */}
                    {upcomingEvents.map((event, index) => (
                        <ConcertCard
                            key={event.id}
                            title={event.title}
                            time={event.date} // Pass Timestamp directly
                            location={event.location}
                            onDelete={() => openDeleteConfirm(index, event.id)}
                            onUpdate={() => handleUpdate(event)}
                        />
                    ))}
                </div>

                <div className={styles.past}>
                    <h2 className={styles.sectionTitle}>Past</h2>
                    {/* Render each past event card */}
                    {pastEvents.map((event, index) => (
                        <ConcertCard
                            key={event.id}
                            title={event.title}
                            time={event.date} // Pass Timestamp directly
                            location={event.location}
                            onDelete={() => openDeleteConfirm(index, event.id)}
                            onUpdate={() => handleUpdate(event)}
                        />
                    ))}
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
};

export default Dashboard;