import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import MyTickets from './pages/MyTickets';
import CreateEvent from './pages/CreateEvent';
import CheckIn from './pages/CheckIn';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Connections from './pages/Connections';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chat/:userId" element={<Chat />} />
        <Route path="/connections" element={<Connections />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
