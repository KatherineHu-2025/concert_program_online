"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NavBar from '../../../components/NavBar';
import styles from '../../../styles/AddEvent.module.css';
import { collection, addDoc, doc, getDoc, updateDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { auth } from '../../../firebaseConfig';
import Image from "next/image"
import ColorCircle from '@/components/ColorCircle';
import {DragDropContext,Droppable,Draggable,DropResult,} from '@hello-pangea/dnd';

interface ProgramItem {
    id: string;
    composer: string;
    piece: string;
    notes: string;
    duration: string;
    isIntermission: boolean;
}

const AddEventForm = () => {
    const router = useRouter();
    const { eventId } = useParams();

    const initialPrograms = [{
        id: 'program-1',
        composer: '',
        piece: '',
        notes: '',
        duration: '',
        isIntermission: false,
      },
      {
        id: 'intermission-1',
        composer: '',
        piece: 'Intermission',
        notes: '',
        duration: '15:00',
        isIntermission: true,
      }];

    // Add a ref to keep track of the next program ID
    const [programs, setPrograms] = useState<ProgramItem[]>(initialPrograms);
    // nextProgramId.current will now === 2
    const nextProgramId = React.useRef(initialPrograms.length + 1);

    const [performers, setPerformer] = useState([{ name: '', role: '', bio: '' }]);
    const [heading, setHeading] = useState("");
    const [isEditingHeading, setIsEditingHeading] = useState(false);
    const [isPerformanceGroup, setIsPerformanceGroup] = useState(false);
    const [performanceGroupName, setPerformanceGroupName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [location, setLocation] = useState('');
    const [concertType, setConcertType] = useState('');
    const [customSections, setCustomSections] = useState<{ title: string, content: string }[]>([]);
    const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
    const [color, setColor] = useState("#FFFFFF");
    const [sponsorText, setSponsorText] = useState('');
    const [performanceGroupBio, setPerformanceGroupBio] = useState('');
    const [performerSuggestions, setPerformerSuggestions] = useState<Array<{name: string, role: string, bio: string}>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [performanceGroupSuggestions, setPerformanceGroupSuggestions] = useState<Array<{name: string, bio: string}>>([]);
    const [showPerformanceGroupSuggestions, setShowPerformanceGroupSuggestions] = useState(false);

    // Function to get the next program ID
    const getNextProgramId = () => {
        const id = `program-${nextProgramId.current}`;
        nextProgramId.current += 1;
        return id;
      };

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
                    const eventDocRef = doc(db, "users", user.uid, "events", eventId as string);
                    const eventDoc = await getDoc(eventDocRef);
    
                    if (eventDoc.exists()) {
                        const data = eventDoc.data();
                        
                        // Handle programs with proper IDs
                        if (data.programs && data.programs.length > 0) {
                            const programsWithIds = data.programs.map((prog: ProgramItem, index: number) => ({
                                ...prog,
                                id: `program-${index + 1}`
                            }));
                            setPrograms(programsWithIds);
                            nextProgramId.current = programsWithIds.length + 1;
                        } else {
                            setPrograms([
                                { 
                                    id: 'program-1',
                                    composer: '', 
                                    piece: '', 
                                    notes: '', 
                                    duration: '',
                                    isIntermission: false 
                                },
                                {
                                    id: 'intermission-1',
                                    composer: '',
                                    piece: 'Intermission',
                                    notes: '',
                                    duration: '15:00',
                                    isIntermission: true,
                                }
                            ]);
                            nextProgramId.current = 3;
                        }

                        // Set other form data
                        setHeading(data.title || "");
                        setEventDate(data.date.toDate().toLocaleString('sv-SE').slice(0, 16));
                        setLocation(data.location || "");
                        setConcertType(data.concertType || "");
                        setColor(data.color || "#FFFFFF");
                        setPerformer(data.performers || [{ name: "", role: "", bio: "" }]);
                        setIsPerformanceGroup(!!data.performanceGroup);
                        setPerformanceGroupName(data.performanceGroup || "");
                        setCustomSections(data.customSections || []);
                        setSponsorText(data.sponsorText || '');
                        setPerformanceGroupBio(data.performanceGroupBio || '');
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

    // Function to store performer data separately
    const storePerformerData = async (performer: { name: string, role: string, bio: string }) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const performersRef = collection(db, 'performers');
            const q = query(performersRef, where("name", "==", performer.name));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                await addDoc(performersRef, {
                    name: performer.name,
                    role: performer.role,
                    bio: performer.bio,
                    createdBy: user.uid,
                    createdAt: new Date()
                });
            }
        } catch (error) {
            console.error("Error storing performer data:", error);
        }
    };

    // Function to store performance group data separately
    const storePerformanceGroupData = async (name: string, bio: string) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const groupsRef = collection(db, 'performanceGroups');
            const q = query(groupsRef, where("name", "==", name));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                await addDoc(groupsRef, {
                    name: name,
                    bio: bio,
                    createdBy: user.uid,
                    createdAt: new Date()
                });
            }
        } catch (error) {
            console.error("Error storing performance group data:", error);
        }
    };

    // Function to search for performers
    const searchPerformers = async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) {
            setPerformerSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const performersRef = collection(db, 'performers');
            const q = query(performersRef, where("name", ">=", searchTerm), where("name", "<=", searchTerm + '\uf8ff'));
            const querySnapshot = await getDocs(q);
            
            const suggestions = querySnapshot.docs.map(doc => doc.data() as {name: string, role: string, bio: string});
            setPerformerSuggestions(suggestions);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error searching performers:", error);
        }
    };

    // Function to search for performance groups
    const searchPerformanceGroups = async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) {
            setPerformanceGroupSuggestions([]);
            setShowPerformanceGroupSuggestions(false);
            return;
        }

        try {
            const groupsRef = collection(db, 'performanceGroups');
            const q = query(groupsRef, where("name", ">=", searchTerm), where("name", "<=", searchTerm + '\uf8ff'));
            const querySnapshot = await getDocs(q);
            
            const suggestions = querySnapshot.docs.map(doc => doc.data() as {name: string, bio: string});
            setPerformanceGroupSuggestions(suggestions);
            setShowPerformanceGroupSuggestions(true);
        } catch (error) {
            console.error("Error searching performance groups:", error);
        }
    };

    // Update handlePerformerChange to include search
    const handlePerformerChange = async (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newPerformers = [...performers];
        newPerformers[index] = { ...newPerformers[index], [name]: value };
        setPerformer(newPerformers);

        if (name === 'name') {
            await searchPerformers(value);
        }
    };

    // Function to select a suggestion
    const handleSelectSuggestion = (index: number, suggestion: {name: string, role: string, bio: string}) => {
        const newPerformers = [...performers];
        newPerformers[index] = suggestion;
        setPerformer(newPerformers);
        setShowSuggestions(false);
    };

    // Handle performance group name change with search
    const handlePerformanceGroupNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPerformanceGroupName(value);
        await searchPerformanceGroups(value);
    };

    // Function to select a performance group suggestion
    const handleSelectPerformanceGroupSuggestion = (suggestion: {name: string, bio: string}) => {
        setPerformanceGroupName(suggestion.name);
        setPerformanceGroupBio(suggestion.bio);
        setShowPerformanceGroupSuggestions(false);
    };

    // Function to format concert type (first letter capital, rest lowercase)
    const formatConcertType = (type: string) => {
        if (!type) return '';
        return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    };

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

        // Format concert type
        const formattedConcertType = formatConcertType(concertType);

        // **Clean Up Unused Data Before Submission**
        const filteredPrograms = programs.filter(
            (p) => p.composer.trim() || p.piece.trim() || p.notes.trim()
        );

        const filteredPerformers = performers.filter(
            (p) => p.name.trim() || p.role.trim() || p.bio.trim()
        );

        const filteredCustomSections = customSections.filter(
            (s) => s.title.trim() || s.content.trim()
        );
    
        const eventData = {
            title: heading,
            date: Timestamp.fromDate(new Date(eventDate)),
            location,
            concertType: formattedConcertType,
            color,
            programs: filteredPrograms,
            performers: filteredPerformers,
            performanceGroup: isPerformanceGroup ? performanceGroupName : null,
            performanceGroupBio: isPerformanceGroup ? performanceGroupBio : null,
            sponsorText,
            customSections: filteredCustomSections,
        };
    
        console.log("Submitting Event Data:", eventData); // Debugging
    
        try {
            // Store performer data separately
            for (const performer of filteredPerformers) {
                if (performer.name.trim()) {
                    await storePerformerData(performer);
                }
            }

            // Store performance group data separately if selected
            if (isPerformanceGroup && performanceGroupName.trim()) {
                await storePerformanceGroupData(performanceGroupName, performanceGroupBio);
            }

            if (eventId) {
                // Update in user collection
                const eventDocRef = doc(db, 'users', user.uid, 'events', eventId as string);
                await updateDoc(eventDocRef, eventData);
            
                // Use setDoc instead of updateDoc for public events
                const publicEventRef = doc(db, 'publicEvents', eventId as string);
                await setDoc(publicEventRef, {
                    ...eventData,
                    createdBy: user.uid,
                });
            } else {
                // Add new event in user collection
                const userEventsCollectionRef = collection(db, 'users', user.uid, 'events');
                const docRef = await addDoc(userEventsCollectionRef, eventData);
            
                // Also add to publicEvents collection
                await setDoc(doc(db, 'publicEvents', docRef.id), {
                    ...eventData,
                    createdBy: user.uid,
                });
            }
    
            // Reset form fields after successful submission
            setHeading("");
            setEventDate('');
            setLocation('');
            setConcertType('');
            setPrograms([{ 
                id: 'program-1',
                composer: '', 
                piece: '', 
                notes: '', 
                duration: '',
                isIntermission: false 
            }]);
            setPerformer([{ name: '', role: '', bio: '' }]);
            setIsPerformanceGroup(false);
            setPerformanceGroupName('');
            setCustomSections([]);
            setSponsorText('');
            setPerformanceGroupBio('');
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
        
        setLoadingIndex(index);

        try {
            const response = await fetch("https://concert-program-online-backend.onrender.com/generate_program_note/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ piece_name: piece, composer: composer }),
            });
    
            if (!response.ok) {
                throw new Error("Failed to fetch program notes");
            }
    
            const data = await response.json();
    
            const updatedPrograms = [...programs];
            updatedPrograms[index] = {
                ...updatedPrograms[index],
                notes: data.program_note,  // Update with backend response
            };
            setPrograms(updatedPrograms);
        } catch (error) {
            console.error("Error fetching program notes:", error);
            alert("Failed to fetch program notes. Please try again.");
        }finally {
        setLoadingIndex(null); // Clear loading index after the process is complete
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

    // Function to calculate total duration
    const calculateTotalDuration = (items: ProgramItem[]) => {
        let totalSeconds = 0;
        let valid = true;
        items.forEach(item => {
            if (item.duration) {
                const parts = item.duration.split(":");
                if (parts.length !== 2 || isNaN(Number(parts[0])) || isNaN(Number(parts[1]))) {
                    valid = false;
                } else {
                    const [minutes, seconds] = parts.map(Number);
                    totalSeconds += (minutes * 60) + seconds;
                }
            }
        });
        if (!valid || isNaN(totalSeconds)) {
            return "--:--";
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Function to handle drag and drop
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
      
        const items = Array.from(programs);
        const [moved] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, moved);
      
        // don't touch item.id – let it stay what it was
        setPrograms(items);
      };

    // Function to add a new program piece
    const handleAddProgram = () => {
        const newProgram = { 
            id: getNextProgramId(),
            composer: '', 
            piece: '', 
            notes: '', 
            duration: '',
            isIntermission: false 
        };
        setPrograms(prev => [...prev, newProgram]);
    };

    // Function to add an intermission
    const handleAddIntermission = () => {
        const newIntermission = { 
            id: getNextProgramId(),
            composer: '', 
            piece: 'Intermission', 
            notes: '', 
            duration: '15:00',
            isIntermission: true 
        };
        setPrograms(prev => [...prev, newIntermission]);
    };

    const handleProgramChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newPrograms = [...programs];
        newPrograms[index] = { ...newPrograms[index], [name]: value };
        setPrograms(newPrograms);
    };

    const toggleEditHeading = () => {
        setIsEditingHeading(!isEditingHeading);
    };

    // Add a handler for color changes
    const handleColorChange = (newColor: string) => {
        setColor(newColor);
    };

    // Add this handler in the component
    const handleDeleteProgram = (index: number) => {
        setPrograms(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className={styles.container}>
                <NavBar />
                <div className={styles.formContent}>
                    <button onClick={() => window.history.back()} className={styles.backButton}>
                        <Image src="/arrow-left.svg" alt="Back" width={24} height={24} className={styles.icon} />
                    </button>
                    <p className={styles.path}>Dashboard / New Event</p>
                    <div className={styles.titleRow}>
                        {isEditingHeading ? (
                            <input
                                type="text"
                                value={heading}
                                onChange={(e) => setHeading(e.target.value)}
                                onBlur={() => setIsEditingHeading(false)}
                                placeholder="Input your title here..."
                                autoFocus
                                className={styles.editableHeadingInput}
                            />
                        ) : (
                            <h2 
                                className={styles.heading} 
                                onClick={toggleEditHeading}
                                data-empty={!heading}
                            >
                                {heading}
                            </h2>
                        )}
                        <span className={styles.asterisk}>*</span>
                    </div>
                    
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.secondHeader}>Basic Information</div>

                        <label>Time
                            <span className={styles.asterisk}>*</span>
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="datetime-local"
                                name="time"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                required
                            />
                        </div>

                        <label>Location 
                            <span className={styles.asterisk}>*</span>
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                name="location"
                                placeholder="Text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            />
                        </div>

                        <label>Concert Type 
                            <span className={styles.asterisk}>*</span>
                        </label>
                        <div className={styles.colorWrappers}>
                            <input
                                type="text"
                                name="concertType"
                                placeholder="Enter concert type"
                                value={concertType}
                                onChange={(e) => setConcertType(e.target.value)}
                                required
                                className={styles.concertTypeInput}
                            />
                            <ColorCircle 
                                eventId={eventId as string}
                                selectedColor={color}
                                onColorChange={handleColorChange}
                            />
                        </div>

                        <div className={styles.secondHeader}>Performer(s) and Conductor(s)</div>
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
                            <>
                                <div className={styles.inputWithSuggestions}>
                                    <input
                                        type="text"
                                        name="performanceGroupName"
                                        placeholder="Performance Group Name"
                                        value={performanceGroupName}
                                        onChange={handlePerformanceGroupNameChange}
                                        className={styles.performanceGroupInput}
                                    />
                                    {showPerformanceGroupSuggestions && performanceGroupName && performanceGroupSuggestions.length > 0 && (
                                        <div className={styles.suggestions}>
                                            {performanceGroupSuggestions.map((suggestion, i) => (
                                                <div
                                                    key={i}
                                                    className={styles.suggestionItem}
                                                    onClick={() => handleSelectPerformanceGroupSuggestion(suggestion)}
                                                >
                                                    {suggestion.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.programNotesContainer}>
                                    <label>Performance Group Bio</label>
                                    <textarea
                                        value={performanceGroupBio}
                                        onChange={(e) => setPerformanceGroupBio(e.target.value)}
                                        placeholder="Enter performance group biography..."
                                        className={styles.programNotesInput}
                                    />
                                </div>
                            </>
                        )}

                        <div className={styles.titleWithLabel}>
                            <label>Additional Performer</label>
                            <Image 
                                src="/plus-circle.svg" 
                                alt="Add Performer" 
                                width={20} 
                                height={20} 
                                className={styles.plusIcon} 
                                onClick={() => setPerformer([...performers, { name: '', role: '', bio: '' }])}
                            />
                        </div>

                        
                        {performers.map((performer, index) => (
                            <div key={index} className={styles.program}>
                                <div className={styles.additionalPerformer}>
                                    <div className={styles.inputWithSuggestions}>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Performer Name"
                                            value={performer.name}
                                            onChange={(e) => handlePerformerChange(index, e)}
                                        />
                                        {showSuggestions && performer.name && performerSuggestions.length > 0 && (
                                            <div className={styles.suggestions}>
                                                {performerSuggestions.map((suggestion, i) => (
                                                    <div
                                                        key={i}
                                                        className={styles.suggestionItem}
                                                        onClick={() => handleSelectSuggestion(index, suggestion)}
                                                    >
                                                        {suggestion.name} - {suggestion.role}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        name="role"
                                        placeholder="Performer Role"
                                        value={performer.role}
                                        onChange={(e) => handlePerformerChange(index, e)}
                                    />
                                </div>
                                <div className={styles.programNotesContainer}>
                                    <label>Performer Bio</label>
                                    <textarea
                                        name="bio"
                                        placeholder="Enter performer biography..."
                                        value={performer.bio}
                                        onChange={(e) => handlePerformerChange(index, e)}
                                        className={styles.programNotesInput}
                                    />
                                </div>
                            </div>
                        ))}
                        
                        <div className={styles.titleWithLabel}>
                            <div className={styles.secondHeader}>Program</div>
                            <div className={styles.programActions}>
                                <button 
                                    className={styles.actionButton}
                                    onClick={handleAddProgram}
                                    type="button"
                                >
                                    <Image 
                                        src="/plus-circle.svg" 
                                        alt="Add Piece" 
                                        width={24} 
                                        height={24}
                                    />
                                </button>
                            </div>
                        </div>
                        
                        <Droppable 
                            droppableId="programs"
                            isDropDisabled={false}
                            isCombineEnabled={false}
                            ignoreContainerClipping={false}
                            type="DEFAULT"
                        >
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={styles.programList}
                                >
                                    {programs.map((program, index) => (
                                        <Draggable 
                                            key={program.id}
                                            draggableId={program.id}
                                            index={index}
                                        >
                                            {(provided) => (
                                                program.isIntermission ? (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={styles.intermissionBanner}
                                                    >
                                                        <div className={styles.intermissionCenter}>
                                                            <span className={styles.intermissionTitle}>Intermission</span>
                                                            <input
                                                                type="text"
                                                                name="duration"
                                                                value={program.duration ?? ''}
                                                                onChange={e => handleProgramChange(index, e)}
                                                                required
                                                                placeholder="mm:ss"
                                                                pattern="[0-9]{2}:[0-9]{2}"
                                                                title="Duration in minutes:seconds (e.g. 03:45)"
                                                                className={styles.intermissionDurationInput}
                                                            />
                                                        </div>
                                                        <div className={styles.intermissionActions}>
                                                            <button
                                                                type="button"
                                                                className={styles.actionButton}
                                                                onClick={handleAddIntermission}
                                                                title="Add another intermission"
                                                            >
                                                                <Image 
                                                                    src="/darker_plus.svg" 
                                                                    alt="Add Intermission" 
                                                                    width={24} 
                                                                    height={24}
                                                                />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={styles.deleteButton}
                                                                onClick={() => handleDeleteProgram(index)}
                                                                aria-label="Delete Intermission"
                                                            >
                                                                <Image src="/close.svg" alt="Delete" width={20} height={20} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={styles.program}
                                                    >
                                                        <div className={styles.programHeader}>
                                                            <div {...provided.dragHandleProps}>
                                                                <Image 
                                                                    src="/drag-handle.svg" 
                                                                    alt="Drag" 
                                                                    width={20} 
                                                                    height={20} 
                                                                    className={styles.dragHandle}
                                                                />
                                                            </div>
                                                            <div className={styles.durationInput}>
                                                                <label>Duration</label>
                                                                <input
                                                                    type="text"
                                                                    name="duration"
                                                                    value={program.duration ?? ''}
                                                                    onChange={e => handleProgramChange(index, e)}
                                                                    required
                                                                    placeholder="mm:ss"
                                                                    pattern="[0-9]{2}:[0-9]{2}"
                                                                    title="Duration in minutes:seconds (e.g. 03:45)"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className={styles.deleteButton}
                                                                onClick={() => handleDeleteProgram(index)}
                                                                aria-label="Delete Program"
                                                            >
                                                                <Image src="/close.svg" alt="Delete" width={20} height={20} />
                                                            </button>
                                                        </div>
                                                        <div className={styles.composerAndPiece}>
                                                            <div className={styles.inputGroup}>
                                                                <label>Composer</label>
                                                                <input
                                                                    type="text"
                                                                    name="composer"
                                                                    placeholder={`Composer Name`}
                                                                    value={program.composer}
                                                                    onChange={(e) => handleProgramChange(index, e)}
                                                                    disabled={program.isIntermission}
                                                                />
                                                            </div>
                                                            <div className={styles.inputGroup}>
                                                                <label>Piece</label>
                                                                <input
                                                                    type="text"
                                                                    name="piece"
                                                                    placeholder={`Piece Name`}
                                                                    value={program.piece}
                                                                    className={styles.piece} 
                                                                    onChange={(e) => handleProgramChange(index, e)}
                                                                    disabled={program.isIntermission}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className={styles.programNotesContainer}>
                                                            <label>Program Notes</label>
                                                            <div className={styles.programNotesWrapper}>
                                                                <textarea
                                                                    name="notes"
                                                                    placeholder={`Write your own program notes or generate using AI! Please remember to check the validity of AI.`}
                                                                    value={program.notes}
                                                                    onChange={(e) => handleProgramChange(index, e)}
                                                                    className={styles.programNotesInput}
                                                                    disabled={program.isIntermission}
                                                                />
                                                                {!program.isIntermission && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleGenerateNotes(index)}
                                                                        className={`${styles.generateNotesButton} ${loadingIndex === index ? styles.disabledButton : ''}`}
                                                                        disabled={loadingIndex === index}
                                                                    >
                                                                        {loadingIndex === index ? (
                                                                            <div className={styles.loader}></div>
                                                                        ) : (
                                                                            <Image src="/AI.svg" alt="Generate Notes" width={24} height={24} />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        <div className={styles.totalDuration}>
                            <label>Total Duration:</label>
                            <span>{calculateTotalDuration(programs)}</span>
                        </div>

                        <div className={styles.secondHeader}>Sponsors</div>
                        <div className={styles.programNotesContainer}>
                            <textarea
                                placeholder="Enter sponsor information here..."
                                value={sponsorText}
                                onChange={(e) => setSponsorText(e.target.value)}
                                className={styles.programNotesInput}
                            />
                        </div>

                        <div className={styles.secondHeader}>Custom Sections</div>
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
        </DragDropContext>
    );
};

export default AddEventForm;
