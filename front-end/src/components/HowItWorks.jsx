import React from 'react';
import { useNavigate } from 'react-router-dom';

const HowItWorks = () => {
  const navigate = useNavigate();

  const styles = {
    fullPage: {
      backgroundColor: 'rgb(27, 29, 40)',
      color: 'rgb(134, 239, 172)',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '3rem 1.5rem',
      textAlign: 'center',
    },
    content: {
      maxWidth: '800px',
    },
    heading: {
      fontSize: '2.5rem',
      marginBottom: '1.5rem',
    },
    paragraph: {
      fontSize: '1.1rem',
      lineHeight: '1.8',
      marginBottom: '1.5rem',
    },
    list: {
      listStyleType: 'decimal',
      textAlign: 'left',
      margin: '1.5rem 0',
      paddingLeft: '1.2rem',
      fontSize: '1.1rem',
      lineHeight: '1.8',
    },
    button: {
      marginTop: '2rem',
      padding: '0.9rem 2rem',
      fontSize: '1.1rem',
      backgroundColor: 'rgb(134, 239, 172)',
      color: 'rgb(27, 29, 40)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
    }
  };

  return (
    <div style={styles.fullPage}>
      <div style={styles.content}>
        <h2 style={styles.heading}>How it works</h2>
        <p style={styles.paragraph}>
          Moondotfun is a decentralized platform that empowers anyone to launch their own token in just seconds.
          No coding skills, no gatekeeping — just creativity and community.
        </p>
        <p style={styles.paragraph}>
          All coins created on Moon are <strong>fair-launch</strong>, meaning there are no pre-mines, no special allocations, and no early advantages.
          Everyone participates equally from the very beginning.
        </p>
        <ul style={styles.list}>
          <li> Pick a coin that you like or create your own.</li>
          <li> Buy the coin via bonding curve. The earlier you buy, the cheaper it is.</li>
          <li> Sell anytime to realize your profits (or losses).</li>
          <li> Engage with the community. Share memes, hype your project, and grow organically.</li>
          <li> Track performance in real-time and climb the leaderboard!</li>
        </ul>
        <p style={styles.paragraph}>
          Launching a token has never been more fun, transparent, and accessible.
          Moondotfun brings the spirit of crypto back to where it started — with the people.
        </p>
        <p style={styles.paragraph}>
          By clicking the button below, you confirm that you are over 18 years old and agree to our terms and conditions.
          Please remember that crypto is volatile and investments are not guaranteed.
        </p>
        <button style={styles.button} onClick={() => navigate('/')}>
          I'm ready to pump 🚀
        </button>
      </div>
    </div>
  );
};

export default HowItWorks;
