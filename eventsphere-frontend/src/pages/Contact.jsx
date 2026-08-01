import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const FAQS = [
  {
    q: "I applied to become an organizer — how long does approval take?",
    a: 'An admin reviews every request manually, so it varies. You can check the status anytime from "Become an organizer" in the nav.',
  },
  {
    q: 'Can I cancel my registration for an event?',
    a: "Not yet from the app — reach out to support below and we'll sort it out for you.",
  },
  {
    q: "Why can't I message someone?",
    a: 'Chat only opens up once a connection request has been accepted on both sides.',
  },
];

function Contact() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Contact & support</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Have a question or run into an issue? We're happy to help.
      </p>

      <Card className="mt-6 p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Reach us at</p>
        <a href="mailto:support@eventsphere.example" className="mt-1 block text-lg font-medium text-violet-600 dark:text-violet-400">
          support@eventsphere.example
        </a>
        <a href="mailto:support@eventsphere.example" className="mt-4 inline-block">
          <Button size="sm">Email support</Button>
        </a>
      </Card>

      <div className="mt-8">
        <h2 className="font-semibold text-slate-900 dark:text-white">Frequently asked</h2>
        <div className="mt-3 flex flex-col gap-3">
          {FAQS.map((item) => (
            <Card key={item.q} className="p-4">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.q}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Contact;
