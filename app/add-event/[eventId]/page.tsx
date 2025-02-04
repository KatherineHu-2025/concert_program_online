"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NavBar from '../../../components/NavBar';
import styles from '../../../styles/AddEvent.module.css';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { auth } from '../../../firebaseConfig';
import OpenAI from "openai";


const AddEventForm = () => {
    const router = useRouter();
    const { eventId } = useParams();
    console.log(eventId);
    
    const [programs, setPrograms] = useState([{ composer: '', piece: '', notes: '' }]);
    const [performers, setPerformer] = useState([{ name: '', role: '' }]);
    const [heading, setHeading] = useState("Input your title here...");
    const [isEditingHeading, setIsEditingHeading] = useState(false);
    const [isPerformanceGroup, setIsPerformanceGroup] = useState(false);
    const [performanceGroupName, setPerformanceGroupName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [location, setLocation] = useState('');
    const [concertType, setConcertType] = useState('');
    const [customSections, setCustomSections] = useState<{ title: string, content: string }[]>([]);
    
    // Fetch event data if editing an existing event
    useEffect(() => {
        const fetchEventData = async () => {
            const user = auth.currentUser;
            
    
            if (!user) {
                alert("You need to be logged in to edit an event.");
                return;
            }
    
            if (eventId) {
                try {
                    // Get the event document reference
                    const eventDocRef = doc(db, "users", user.uid, "events", eventId as string);
                    const eventDoc = await getDoc(eventDocRef);
    
                    if (eventDoc.exists()) {
                        const data = eventDoc.data();
    
                        // Set the state values based on the retrieved data
                        setHeading(data.title || "Input your title here...");
                        setEventDate(data.date.toDate().toISOString().slice(0, 16)); // Convert Firestore Timestamp to datetime-local format
                        setLocation(data.location || "");
                        setConcertType(data.concertType || "");
                        setPrograms(data.programs || [{ composer: "", piece: "", notes: "" }]);
                        setPerformer(data.performers || [{ name: "", role: "" }]);
                        setIsPerformanceGroup(!!data.performanceGroup);
                        setPerformanceGroupName(data.performanceGroup || "");
                        setCustomSections(data.customSections || []);
                    } else {
                        alert("No event data found.");
                    }
                } catch (error) {
                    console.error("Error fetching event data: ", error);
                    alert("Failed to load event data. Please try again.");
                }
            }
        };
    
        fetchEventData();
    }, [eventId]);

    const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true, // Make sure to store this key securely
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        const user = auth.currentUser; // Get the current authenticated user
        if (!user) {
            alert("You need to be logged in to add or update an event.");
            return;
        }
    
        // Validate required fields
        if (!heading || !eventDate || !location || !concertType) {
            alert("Please fill out all required fields.");
            return;
        }
    
        // Validate date format
        if (isNaN(new Date(eventDate).getTime())) {
            alert("Please provide a valid date and time.");
            return;
        }
    
        const eventData = {
            title: heading,
            date: Timestamp.fromDate(new Date(eventDate)),
            location,
            concertType,
            programs,
            performers,
            performanceGroup: isPerformanceGroup ? performanceGroupName : null,
            customSections,
        };
    
        console.log("Submitting Event Data:", eventData); // Debugging
    
        try {
            if (eventId) {
                // Update existing event under the user's collection
                const eventDocRef = doc(db, 'users', user.uid, 'events', eventId as string);
                await updateDoc(eventDocRef, eventData);
                alert("Event successfully updated!");
            } else {
                // Add new event under the user's collection
                const userEventsCollectionRef = collection(db, 'users', user.uid, 'events');
                const docRef = await addDoc(userEventsCollectionRef, eventData);
                console.log("Document written with ID:", docRef.id); // Debugging
                alert("Event successfully added!");
            }
    
            // Reset form fields after successful submission
            setHeading("Input your title here...");
            setEventDate('');
            setLocation('');
            setConcertType('');
            setPrograms([{ composer: '', piece: '', notes: '' }]);
            setPerformer([{ name: '', role: '' }]);
            setIsPerformanceGroup(false);
            setPerformanceGroupName('');
            setCustomSections([]);
            router.push('/');
        } catch (error) {
            console.error("Error adding/updating document:", error);
            alert("Failed to add/update event. Please try again.");
        }
    };

    const handleGenerateNotes = async (index: number) => {
        const { composer, piece } = programs[index];
    
        if (!composer || !piece) {
            alert("Please fill in both the composer and piece fields to generate program notes.");
            return;
        }
    
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are a helpful assistant specialized in classical music." },
                    { role: "user", content: `Write a short and engaging program note for the classical music piece "${piece}" by ${composer}.` },
                ],
            });
    
            const generatedNotes = completion.choices[0]?.message?.content?.trim();
            if (generatedNotes) {
                const updatedPrograms = [...programs];
                updatedPrograms[index] = {
                    ...updatedPrograms[index],
                    notes: generatedNotes,
                };
                setPrograms(updatedPrograms);
            }
        } catch (error) {
            console.error("Error generating program notes:", error);
            alert("Failed to generate program notes. Please try again.");
        }
    };

    // Function to handle adding a new custom section
    const handleAddSection = () => {
        setCustomSections([...customSections, { title: '', content: '' }]);
    };

    // Function to handle changes in the custom sections
    const handleCustomSectionChange = (index: number, field: 'title' | 'content', value: string) => {
        const updatedSections = [...customSections];
        updatedSections[index] = { ...updatedSections[index], [field]: value };
        setCustomSections(updatedSections);
    };

    const handleCheckboxChange = () => {
        setIsPerformanceGroup(!isPerformanceGroup);
    };

    // Function to handle adding a new program piece
    const handleAddProgram = () => {
        setPrograms([...programs, { composer: '', piece: '', notes: '' }]);
    };

    const handleAddPerformer = () => {
        setPerformer([...performers, { name:'', role: '' }])
    }

    const handlePerformerChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newPerformers = [...performers];
        newPerformers[index] = { ...newPerformers[index], [name]: value };
        setPerformer(newPerformers);
    }

    // Function to handle input changes for the program pieces
    const handleProgramChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newPrograms = [...programs];
        newPrograms[index] = { ...newPrograms[index], [name]: value };
        setPrograms(newPrograms);
    };

    const toggleEditHeading = () => {
        setIsEditingHeading(!isEditingHeading);
    };

    // Function to handle heading change
    const handleHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHeading(e.target.value);
    };

    // Function to save heading on blur or Enter key
    const handleHeadingBlurOrEnter = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
        if (e.type === 'blur' || (e.type === 'keydown' && (e as React.KeyboardEvent).key === 'Enter')) {
            setIsEditingHeading(false);
        }
    };

    return (
        <div className={styles.container}>
            <NavBar />
            <div className={styles.formContent}>
                <button onClick={() => window.history.back()} className={styles.backButton}>← Back</button>
                {/* Editable heading */}
                {isEditingHeading ? (
                    <input
                        type="text"
                        value={heading}
                        onChange={handleHeadingChange}
                        onBlur={handleHeadingBlurOrEnter}
                        onKeyDown={handleHeadingBlurOrEnter}
                        autoFocus
                        className={styles.editableHeadingInput}
                    />
                ) : (
                    <h2 className={styles.heading} onClick={toggleEditHeading}>{heading}</h2>
                )}
                <form className={styles.form} onSubmit={handleSubmit}>
                    <label>Time *</label>
                    <input
                        type="datetime-local"
                        name="time"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                    />

                    <label>Location *</label>
                    <input
                        type="text"
                        name="location"
                        placeholder="Text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                    />

                    <label>Concert Type *</label>
                    <select
                        name="concertType"
                        value={concertType}
                        onChange={(e) => setConcertType(e.target.value)}
                        required
                    >
                        <option value="">Select item</option>
                        <option value="Recital">Recital</option>
                        <option value="Symphony">Symphony</option>
                        <option value="Chamber">Chamber</option>
                    </select>

                    <label>Performer(s) *</label>
                    <div className={styles.checkboxGroup}>
                        <input
                            type="checkbox"
                            name="performerGroup"
                            onChange={handleCheckboxChange}
                            checked={isPerformanceGroup}
                        />
                        <label>Performance Group</label>
                    </div>

                    {/* Conditionally render the Performance Group input field */}
                    {isPerformanceGroup && (
                        <input
                        type="text"
                        name="performanceGroupName"
                        placeholder="Performance Group Name"
                        value={performanceGroupName}
                        onChange={(e) => setPerformanceGroupName(e.target.value)}
                        className={styles.performanceGroupInput}
                        />
                    )}

                    <label>Individual Performer</label>
                    {performers.map((performer, index) => (
                        <div key={index} className={styles.additionalPerformer}>
                            <input
                                type="text"
                                name="name"
                                placeholder={`Name ${index + 1}`}
                                value={performer.name}
                                onChange={(e) => handlePerformerChange(index, e)}
                            />
                            <input
                                type="text"
                                name="role"
                                placeholder={`Role ${index + 1}`}
                                value={performer.role}
                                onChange={(e) => handlePerformerChange(index, e)}
                            />
                        </div>
                    ))}
                    <button type="button" className={styles.addButton} onClick={handleAddPerformer}>Add Performer</button>

                    <label>Program</label>
                    {programs.map((program, index) => (
                        <div key={index} className={styles.program}>
                            <input
                                type="text"
                                name="composer"
                                placeholder={`Composer ${index + 1}`}
                                value={program.composer}
                                onChange={(e) => handleProgramChange(index, e)}
                            />
                            <input
                                type="text"
                                name="piece"
                                placeholder={`Piece ${index + 1}`}
                                value={program.piece}
                                onChange={(e) => handleProgramChange(index, e)}
                            />
                            <div className={styles.programNotesContainer}>
                                <textarea
                                    name="notes"
                                    placeholder={`Program Notes ${index + 1}`}
                                    value={program.notes}
                                    onChange={(e) => handleProgramChange(index, e)}
                                    className={styles.programNotesInput}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleGenerateNotes(index)}
                                    className={styles.generateNotesButton}
                                >
                                    Generate Notes
                                </button>
                            </div>
                        </div>
                    ))}
                    <button type="button" className={styles.addButton} onClick={handleAddProgram}>Add Piece</button>

                    <label>Custom Sections</label>
                    {customSections.map((section, index) => (
                        <div key={index} className={styles.customSection}>
                            <input
                                type="text"
                                placeholder={`Section Title ${index + 1}`}
                                value={section.title}
                                onChange={(e) => handleCustomSectionChange(index, 'title', e.target.value)}
                                className={styles.customSectionTitleInput}
                            />
                            <textarea
                                placeholder={`Section Content ${index + 1}`}
                                value={section.content}
                                onChange={(e) => handleCustomSectionChange(index, 'content', e.target.value)}
                                className={styles.customSectionContentInput}
                            />
                        </div>
                    ))}
                    <button type="button" className={styles.addButton} onClick={handleAddSection}>Add a Section</button>

                    <button type="submit" className={styles.submitButton}>{eventId ? "Update Event" : "Add Event"}</button>
                </form>
            </div>
        </div>
    );
};

export default AddEventForm;
