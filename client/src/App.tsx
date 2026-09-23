import { Link, Routes, Route } from 'react-router-dom';
import CreatePollPage from './pages/CreatePollPage';
import PollPage from './pages/PollPage';

export default function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="app-header">
        <Link to="/">
          <span className="brand-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 3v9a4 4 0 0 0 4 4h1v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 3v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 3v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M17 3c-1.5 0-3 1.5-3 4v4c0 1 .5 2 1.5 2H17v9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          TeamLunch Poll
        </Link>
      </header>
      <div className="app-shell">
        <main id="main-content">
          <Routes>
            <Route path="/" element={<CreatePollPage />} />
            <Route path="/polls/:pollId" element={<PollPage />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
