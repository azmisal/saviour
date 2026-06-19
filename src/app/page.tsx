'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';


export default function Home() {


  const {isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
        if(isAuthenticated){
          router.push('/password')
        }
    }, []);



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
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
