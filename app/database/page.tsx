"use client";

import React, { useEffect, useState } from 'react';
import NavBar from '../../components/NavBar';
import styles from '../../styles/DatabasePage.module.css';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

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
                <button className={styles.moreButton}>⋯</button>
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
                <button className={styles.moreButton}>⋯</button>
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
                <button className={styles.moreButton}>⋯</button>
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
    </div>
  );
};

export default DatabasePage;
