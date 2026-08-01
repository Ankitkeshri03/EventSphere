import Card from '../components/ui/Card';
import Logo from '../components/Logo';
import { CalendarIcon, TicketIcon, UsersIcon, ChatIcon } from '../components/icons';

const STEPS = [
  { icon: CalendarIcon, title: 'Discover events', text: 'Browse everything happening on EventSphere, no account required.' },
  { icon: TicketIcon, title: 'Register in a click', text: 'Sign up and get a unique QR ticket instantly — no printing, no paperwork.' },
  { icon: UsersIcon, title: 'Meet other attendees', text: "See who else registered for an event you're going to, and send a connection request." },
  { icon: ChatIcon, title: 'Keep talking', text: 'Once connected, message each other in real time, right inside EventSphere.' },
];

function About() {
  return (
    <div className="mx-auto max-w-2xl">
      <Logo className="mb-6" />
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">About EventSphere</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-400">
        EventSphere is a lightweight platform for running events and building the network around them.
        Organizers create and manage events with real QR-code ticketing and check-in; participants discover
        events, register in seconds, and connect with the people they meet there.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <Card key={title} className="p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                {i + 1}
              </div>
              <Icon className="h-4 w-4 text-violet-500" />
            </div>
            <p className="mt-3 font-medium text-slate-900 dark:text-white">{title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">Roles on EventSphere</h2>
        <dl className="mt-3 flex flex-col gap-3 text-sm">
          <div>
            <dt className="font-medium text-slate-800 dark:text-slate-100">Participant</dt>
            <dd className="text-slate-500 dark:text-slate-400">Everyone starts here — discover events, register, and connect with other attendees.</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800 dark:text-slate-100">Organizer</dt>
            <dd className="text-slate-500 dark:text-slate-400">Create and manage events, check guests in, and see who registered. Apply from your account once you're signed in.</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800 dark:text-slate-100">Admin</dt>
            <dd className="text-slate-500 dark:text-slate-400">Reviews organizer applications and keeps an overview of everyone using the platform.</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}

export default About;
