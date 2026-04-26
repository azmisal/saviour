import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>
      
      <div className={styles.content}>
        <h1 className={styles.title}>Saviour</h1>
        <p className={styles.subtitle}>
          The ultimate vault to save, organize, and retrieve your valuable stuff securely. 
          Stop losing track of your important links, notes, and digital assets.
        </p>
        
        <div className={styles.actions}>
          <Link href="/signup" className="btn-primary">
            Get Started Free
          </Link>
          <Link href="/login" className={styles.btnSecondary}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
