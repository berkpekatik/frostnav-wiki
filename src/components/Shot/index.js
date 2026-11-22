import React from 'react';
import styles from './styles.module.css';

/**
 * Ekran görüntüsü + dokunulacak yeri gösteren yanıp sönen nokta(lar).
 * dots: [{top: '90%', left: '82%', yellow?: true}]. Sarı nokta ek işarettir, yanıp sönmez.
 */
export default function Shot({src, alt, dots = []}) {
  return (
    <span className={styles.shot}>
      <img src={src} alt={alt} loading="lazy" />
      {dots.map((d, i) => (
        <i
          key={i}
          aria-hidden="true"
          className={d.yellow ? styles.yellow : undefined}
          style={{top: d.top, left: d.left}}
        />
      ))}
    </span>
  );
}
