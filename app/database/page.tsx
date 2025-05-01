"use client";

import React, { useEffect, useState } from 'react';
import NavBar from '../../components/NavBar';
import styles from '../../styles/DatabasePage.module.css';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import Image from 'next/image';
import Papa from 'papaparse';

interface TableProps {
  headers: string[];
  data: string[][];
}

interface Performer {
  name: string;
  role: string;
  bio: string;
}

interface PerformanceGroup {
  name: string;
  bio: string;
  location?: string;
}

interface Piece {
  composer: string;
  piece: string;
  year: string;
}

interface Program {
  composer: string;
  piece: string;
  year?: string;
}

const Table: React.FC<TableProps> = ({ headers, data }) => (
  <div className={styles.tableContainer}>
    <table className={styles.table}>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DatabasePage: React.FC = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [performanceGroups, setPerformanceGroups] = useState<PerformanceGroup[]>([]);
  const [conductors, setConductors] = useState<Performer[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [searchTerms, setSearchTerms] = useState({
    performers: '',
    performanceGroups: '',
    conductors: '',
    pieces: ''
  });
  
  // Modal states
  const [showPerformerModal, setShowPerformerModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Form states
  const [newPerformer, setNewPerformer] = useState<Performer>({ name: '', role: '', bio: '' });
  const [newGroup, setNewGroup] = useState<PerformanceGroup>({ name: '', bio: '', location: '' });

  // CSV upload states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvUploadType, setCsvUploadType] = useState<'performers' | 'groups' | null>(null);
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState<number>(0);
  const [uploadFailed, setUploadFailed] = useState<number>(0);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch performers
        const performersRef = collection(db, 'performers');
        const performersSnap = await getDocs(performersRef);
        const performersData = performersSnap.docs.map(doc => doc.data() as Performer);
        setPerformers(performersData.filter(p => p.role.toLowerCase() !== 'conductor'));
        setConductors(performersData.filter(p => p.role.toLowerCase() === 'conductor'));

        // Fetch performance groups
        const groupsRef = collection(db, 'performanceGroups');
        const groupsSnap = await getDocs(groupsRef);
        const groupsData = groupsSnap.docs.map(doc => doc.data() as PerformanceGroup);
        setPerformanceGroups(groupsData);

        // Fetch pieces from events
        const eventsRef = collection(db, 'publicEvents');
        const eventsSnap = await getDocs(eventsRef);
        const piecesData: Piece[] = [];
        eventsSnap.docs.forEach(doc => {
          const eventData = doc.data();
          if (eventData.programs) {
            eventData.programs.forEach((program: Program) => {
              if (program.composer && program.piece) {
                piecesData.push({
                  composer: program.composer,
                  piece: program.piece,
                  year: program.year || ''
                });
              }
            });
          }
        });
        setPieces(piecesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Search handlers
  const handleSearch = async (category: string, searchTerm: string) => {
    setSearchTerms(prev => ({ ...prev, [category]: searchTerm }));

    try {
      switch (category) {
        case 'performers': {
          const performersRef = collection(db, 'performers');
          const q = query(
            performersRef,
            where('name', '>=', searchTerm),
            where('name', '<=', searchTerm + '\uf8ff')
          );
          const querySnapshot = await getDocs(q);
          const filteredPerformers = querySnapshot.docs.map(doc => doc.data() as Performer);
          setPerformers(filteredPerformers.filter(p => p.role.toLowerCase() !== 'conductor'));
          break;
        }
        case 'conductors': {
          const performersRef = collection(db, 'performers');
          const q = query(
            performersRef,
            where('role', '==', 'conductor'),
            where('name', '>=', searchTerm),
            where('name', '<=', searchTerm + '\uf8ff')
          );
          const querySnapshot = await getDocs(q);
          setConductors(querySnapshot.docs.map(doc => doc.data() as Performer));
          break;
        }
        case 'performanceGroups': {
          const groupsRef = collection(db, 'performanceGroups');
          const q = query(
            groupsRef,
            where('name', '>=', searchTerm),
            where('name', '<=', searchTerm + '\uf8ff')
          );
          const querySnapshot = await getDocs(q);
          setPerformanceGroups(querySnapshot.docs.map(doc => doc.data() as PerformanceGroup));
          break;
        }
        // For pieces, we'll filter locally since they're stored in events
        case 'pieces': {
          const filteredPieces = pieces.filter(piece => 
            piece.composer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            piece.piece.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setPieces(filteredPieces);
          break;
        }
      }
    } catch (error) {
      console.error(`Error searching ${category}:`, error);
    }
  };

  // Handle form changes
  const handlePerformerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPerformer(prev => ({ ...prev, [name]: value }));
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewGroup(prev => ({ ...prev, [name]: value }));
  };

  // Save new performer to Firebase
  const handleSavePerformer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPerformer.name.trim()) {
      alert("Please enter a performer name");
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You need to be logged in to add a performer");
        return;
      }
      
      const performersRef = collection(db, 'performers');
      await addDoc(performersRef, {
        ...newPerformer,
        createdBy: user.uid,
        createdAt: new Date()
      });
      
      // Refresh performers list
      const performersSnap = await getDocs(performersRef);
      const performersData = performersSnap.docs.map(doc => doc.data() as Performer);
      setPerformers(performersData.filter(p => p.role.toLowerCase() !== 'conductor'));
      setConductors(performersData.filter(p => p.role.toLowerCase() === 'conductor'));
      
      // Reset form and close modal
      setNewPerformer({ name: '', role: '', bio: '' });
      setShowPerformerModal(false);
      
      alert("Performer added successfully!");
    } catch (error) {
      console.error("Error adding performer:", error);
      alert("Failed to add performer. Please try again.");
    }
  };

  // Save new performance group to Firebase
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGroup.name.trim()) {
      alert("Please enter a performance group name");
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You need to be logged in to add a performance group");
        return;
      }
      
      const groupsRef = collection(db, 'performanceGroups');
      await addDoc(groupsRef, {
        ...newGroup,
        createdBy: user.uid,
        createdAt: new Date()
      });
      
      // Refresh performance groups list
      const groupsSnap = await getDocs(groupsRef);
      const groupsData = groupsSnap.docs.map(doc => doc.data() as PerformanceGroup);
      setPerformanceGroups(groupsData);
      
      // Reset form and close modal
      setNewGroup({ name: '', bio: '', location: '' });
      setShowGroupModal(false);
      
      alert("Performance group added successfully!");
    } catch (error) {
      console.error("Error adding performance group:", error);
      alert("Failed to add performance group. Please try again.");
    }
  };

  // Handle CSV file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'performers' | 'groups') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setCsvUploadError('Please select a valid CSV file');
      return;
    }
    
    setCsvFile(file);
    setCsvUploadType(type);
    setCsvUploadError(null);
    
    // Parse CSV for preview
    Papa.parse<any>(file, {
      header: true,
      complete: (results: Papa.ParseResult<any>) => {
        setCsvHeaders(results.meta.fields || []);
        setCsvPreview(results.data.slice(0, 5)); // Show first 5 rows as preview
      },
      error: (error: Error) => {
        setCsvUploadError(`Error parsing CSV: ${error.message}`);
      }
    });
  };
  
  // Handle CSV upload
  const handleCsvUpload = async () => {
    if (!csvFile || !csvUploadType) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(0);
    setUploadFailed(0);
    
    try {
      const results = await new Promise<any[]>((resolve, reject) => {
        Papa.parse<any>(csvFile, {
          header: true,
          complete: (results: Papa.ParseResult<any>) => resolve(results.data),
          error: (error: Error) => reject(error)
        });
      });
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You need to be logged in to upload data');
      }
      
      let successCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        
        // Skip empty rows
        if (Object.values(row).every(val => !val)) continue;
        
        try {
          if (csvUploadType === 'performers') {
            // Validate required fields
            if (!row.name) {
              failedCount++;
              continue;
            }
            
            await addDoc(collection(db, 'performers'), {
              name: row.name,
              role: row.role || '',
              bio: row.bio || '',
              createdBy: user.uid,
              createdAt: new Date()
            });
          } else if (csvUploadType === 'groups') {
            // Validate required fields
            if (!row.name) {
              failedCount++;
              continue;
            }
            
            await addDoc(collection(db, 'performanceGroups'), {
              name: row.name,
              bio: row.bio || '',
              location: row.location || '',
              createdBy: user.uid,
              createdAt: new Date()
            });
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error adding row ${i}:`, error);
          failedCount++;
        }
        
        // Update progress
        setUploadProgress(Math.round((i + 1) / results.length * 100));
        setUploadSuccess(successCount);
        setUploadFailed(failedCount);
      }
      
      // Refresh data after upload
      const fetchData = async () => {
        try {
          // Fetch performers
          const performersRef = collection(db, 'performers');
          const performersSnap = await getDocs(performersRef);
          const performersData = performersSnap.docs.map(doc => doc.data() as Performer);
          setPerformers(performersData.filter(p => p.role.toLowerCase() !== 'conductor'));
          setConductors(performersData.filter(p => p.role.toLowerCase() === 'conductor'));

          // Fetch performance groups
          const groupsRef = collection(db, 'performanceGroups');
          const groupsSnap = await getDocs(groupsRef);
          const groupsData = groupsSnap.docs.map(doc => doc.data() as PerformanceGroup);
          setPerformanceGroups(groupsData);

          // Fetch pieces from events
          const eventsRef = collection(db, 'publicEvents');
          const eventsSnap = await getDocs(eventsRef);
          const piecesData: Piece[] = [];
          eventsSnap.docs.forEach(doc => {
            const eventData = doc.data();
            if (eventData.programs) {
              eventData.programs.forEach((program: Program) => {
                if (program.composer && program.piece) {
                  piecesData.push({
                    composer: program.composer,
                    piece: program.piece,
                    year: program.year || ''
                  });
                }
              });
            }
          });
          setPieces(piecesData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      
      fetchData();
      
      // Reset states
      setCsvFile(null);
      setCsvPreview([]);
      setCsvHeaders([]);
      setCsvUploadType(null);
      
      alert(`Upload complete! ${successCount} entries added successfully, ${failedCount} failed.`);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setCsvUploadError(`Error uploading CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Cancel CSV upload
  const cancelCsvUpload = () => {
    setCsvFile(null);
    setCsvPreview([]);
    setCsvHeaders([]);
    setCsvUploadType(null);
    setCsvUploadError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadSuccess(0);
    setUploadFailed(0);
  };

  return (
    <div className={styles.container}>
      <NavBar />
      <div className={styles.mainContent}>
        <h1 className={styles.title}>Database</h1>
        <div className={styles.gridContainer}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Performers</h2>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search"
                  className={styles.searchInput}
                  value={searchTerms.performers}
                  onChange={(e) => handleSearch('performers', e.target.value)}
                />
                <div className={styles.buttonGroup}>
                  <button className={styles.addButton} onClick={() => setShowPerformerModal(true)}>
                    <Image src="/plus-circle.svg" alt="Add" width={20} height={20} />
                  </button>
                  <label className={styles.uploadButton}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileSelect(e, 'performers')}
                      style={{ display: 'none' }}
                    />
                    <Image src="/upload.svg" alt="Upload CSV" width={20} height={20} />
                  </label>
                </div>
              </div>
            </div>
            <Table 
              headers={['Name', 'Role']} 
              data={performers.map(p => [p.name, p.role])}
            />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Performance Groups</h2>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search"
                  className={styles.searchInput}
                  value={searchTerms.performanceGroups}
                  onChange={(e) => handleSearch('performanceGroups', e.target.value)}
                />
                <div className={styles.buttonGroup}>
                  <button className={styles.addButton} onClick={() => setShowGroupModal(true)}>
                    <Image src="/plus-circle.svg" alt="Add" width={20} height={20} />
                  </button>
                  <label className={styles.uploadButton}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileSelect(e, 'groups')}
                      style={{ display: 'none' }}
                    />
                    <Image src="/upload.svg" alt="Upload CSV" width={20} height={20} />
                  </label>
                </div>
              </div>
            </div>
            <Table 
              headers={['Name', 'Location']} 
              data={performanceGroups.map(g => [g.name, g.location || ''])}
            />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Conductors</h2>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search"
                  className={styles.searchInput}
                  value={searchTerms.conductors}
                  onChange={(e) => handleSearch('conductors', e.target.value)}
                />
                <button className={styles.addButton} onClick={() => {
                  setNewPerformer({ name: '', role: 'conductor', bio: '' });
                  setShowPerformerModal(true);
                }}>
                  <Image src="/plus-circle.svg" alt="Add" width={20} height={20} />
                </button>
              </div>
            </div>
            <Table 
              headers={['Name']} 
              data={conductors.map(c => [c.name])}
            />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pieces</h2>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search"
                  className={styles.searchInput}
                  value={searchTerms.pieces}
                  onChange={(e) => handleSearch('pieces', e.target.value)}
                />
                <button className={styles.moreButton}>⋯</button>
              </div>
            </div>
            <Table 
              headers={['Composer/Performer', 'Piece', 'Year']} 
              data={pieces.map(p => [p.composer, p.piece, p.year])}
            />
          </section>
        </div>
      </div>

      {/* Performer Modal */}
      {showPerformerModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Add New Performer</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowPerformerModal(false)}
              >
                <Image src="/close.svg" alt="Close" width={20} height={20} />
              </button>
            </div>
            <form onSubmit={handleSavePerformer}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newPerformer.name}
                  onChange={handlePerformerChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="role">Role *</label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={newPerformer.role}
                  onChange={handlePerformerChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="bio">Biography</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={newPerformer.bio}
                  onChange={handlePerformerChange}
                  rows={4}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowPerformerModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveButton}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Performance Group Modal */}
      {showGroupModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Add New Performance Group</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowGroupModal(false)}
              >
                <Image src="/close.svg" alt="Close" width={20} height={20} />
              </button>
            </div>
            <form onSubmit={handleSaveGroup}>
              <div className={styles.formGroup}>
                <label htmlFor="groupName">Name *</label>
                <input
                  type="text"
                  id="groupName"
                  name="name"
                  value={newGroup.name}
                  onChange={handleGroupChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newGroup.location}
                  onChange={handleGroupChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="groupBio">Biography</label>
                <textarea
                  id="groupBio"
                  name="bio"
                  value={newGroup.bio}
                  onChange={handleGroupChange}
                  rows={4}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowGroupModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveButton}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {csvFile && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Upload {csvUploadType === 'performers' ? 'Performers' : 'Performance Groups'} CSV</h2>
              <button 
                className={styles.closeButton}
                onClick={cancelCsvUpload}
              >
                <Image src="/close.svg" alt="Close" width={20} height={20} />
              </button>
            </div>
            
            <div className={styles.csvUploadContainer}>
              <div className={styles.csvFileInfo}>
                <p><strong>File:</strong> {csvFile.name}</p>
                <p><strong>Size:</strong> {(csvFile.size / 1024).toFixed(2)} KB</p>
              </div>
              
              {csvUploadError && (
                <div className={styles.errorMessage}>
                  {csvUploadError}
                </div>
              )}
              
              {csvHeaders.length > 0 && (
                <div className={styles.csvPreview}>
                  <h3>CSV Preview (First 5 rows)</h3>
                  <div className={styles.csvHeaders}>
                    {csvHeaders.map((header, index) => (
                      <div key={index} className={styles.csvHeader}>{header}</div>
                    ))}
                  </div>
                  <div className={styles.csvRows}>
                    {csvPreview.map((row, rowIndex) => (
                      <div key={rowIndex} className={styles.csvRow}>
                        {csvHeaders.map((header, colIndex) => (
                          <div key={colIndex} className={styles.csvCell}>
                            {row[header] || ''}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isUploading && (
                <div className={styles.uploadProgress}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p>Uploading: {uploadProgress}%</p>
                  <p>Success: {uploadSuccess} | Failed: {uploadFailed}</p>
                </div>
              )}
              
              <div className={styles.csvInstructions}>
                <h3>CSV Format Instructions</h3>
                {csvUploadType === 'performers' ? (
                  <ul>
                    <li><strong>name</strong> (required): Performer's full name</li>
                    <li><strong>role</strong> (optional): Performer's role (e.g., "Violinist", "Pianist")</li>
                    <li><strong>bio</strong> (optional): Performer's biography</li>
                  </ul>
                ) : (
                  <ul>
                    <li><strong>name</strong> (required): Performance group's name</li>
                    <li><strong>location</strong> (optional): Group's location</li>
                    <li><strong>bio</strong> (optional): Group's biography</li>
                  </ul>
                )}
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                type="button" 
                onClick={cancelCsvUpload}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleCsvUpload}
                className={styles.saveButton}
                disabled={isUploading || !!csvUploadError}
              >
                {isUploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabasePage;
