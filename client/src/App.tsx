import { Routes, Route } from 'react-router-dom';
import CreatePollPage from './pages/CreatePollPage';
import PollPage from './pages/PollPage';

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<CreatePollPage />} />
        <Route path="/polls/:pollId" element={<PollPage />} />
      </Routes>
    </div>
  );
}
