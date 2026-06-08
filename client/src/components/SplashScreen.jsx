import { useEffect, useState } from 'react';
import { getImageUrl } from '../api';
import './SplashScreen.css';

export default function SplashScreen({ onFinish }) {
  const [startFade, setStartFade] = useState(false);

  useEffect(() => {
    // Total animation display time: 3.2s, then 0.5s fade out
    const fadeTimer = setTimeout(() => {
      setStartFade(true);
    }, 3200);

    const removeTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  const taglineWords = ["В", "любое", "время", "в", "любом", "месте"];

  return (
    <div className={`splash-overlay ${startFade ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-container">
          <img
            src={getImageUrl('/uploads/logo.png')}
            className="splash-logo"
            alt="🌶️"
          />
        </div>
        <h1 className="splash-title">Паприка Кейтеринг</h1>
        <div className="splash-tagline-wrap">
          {taglineWords.map((word, index) => (
            <span
              key={index}
              className="splash-word"
              style={{ '--word-index': index }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
