import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import EditEvent from './pages/EditEvent';
import EventDashboard from './pages/EventDashboard';
import MyTickets from './pages/MyTickets';
import CreateEvent from './pages/CreateEvent';
import MyEvents from './pages/MyEvents';
import CheckIn from './pages/CheckIn';
import Chat from './pages/Chat';
import Connections from './pages/Connections';
import ApplyOrganizer from './pages/ApplyOrganizer';
import AdminOrganizerRequests from './pages/AdminOrganizerRequests';
import AdminParticipants from './pages/AdminParticipants';
import AdminOrganizers from './pages/AdminOrganizers';
import AdminEventsOverview from './pages/AdminEventsOverview';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:id/edit" element={<EditEvent />} />
            <Route path="/events/:id/dashboard" element={<EventDashboard />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/check-in" element={<CheckIn />} />
            <Route path="/chat/:userId" element={<Chat />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/apply-organizer" element={<ApplyOrganizer />} />
            <Route path="/admin/organizer-requests" element={<AdminOrganizerRequests />} />
            <Route path="/admin/participants" element={<AdminParticipants />} />
            <Route path="/admin/organizers" element={<AdminOrganizers />} />
            <Route path="/admin/events" element={<AdminEventsOverview />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
