import NavBar from '../components/NavBar';
// import ConcertCard from '../components/ConcertCard';
import styles from '../styles/HomePage.module.css';

export default function HomePage() {
  return (
      <div className={styles.container}>
          <NavBar />
          {/* Other homepage content */}
      </div>
  );
}
