// WISEcon27 — event content + seed data.
// Ported verbatim from prototype/app/data.js. Sample content (14–16 Sep 2027,
// Aarhus) is placeholder per the handoff — swap for real WISEcon27 data.

import type {
  Attendee,
  Day,
  Me,
  AppNotification,
  Session,
  Speaker,
  Sponsor,
  Track,
  TrackId,
} from './types'

export const TRACKS: Record<TrackId, Track> = {
  integrity: { name: 'Integrity', bg: 'var(--wf-purple-2)', fg: 'var(--wf-purple-10)', dot: 'var(--wf-purple-8)' },
  pedagogy:  { name: 'Pedagogy',  bg: 'var(--wf-green-1)',  fg: 'var(--wf-green-11)',  dot: 'var(--wf-green-9)' },
  platform:  { name: 'Platform',  bg: 'var(--wf-blue-1)',   fg: 'var(--wf-blue-11)',   dot: 'var(--wf-blue-9)' },
  research:  { name: 'Research',  bg: 'var(--wf-orange-2)', fg: 'var(--wf-orange-11)', dot: 'var(--wf-orange-9)' },
  workshop:  { name: 'Workshop',  bg: 'var(--wf-teal-3)',   fg: 'var(--wf-teal-11)',   dot: 'var(--wf-teal-9)' },
  plenary:   { name: 'Plenary',   bg: 'var(--wf-grey-3)',   fg: 'var(--wf-grey-11)',   dot: 'var(--wf-grey-10)' },
}

export const DAYS: Day[] = [
  { id: 'd1', dow: 'Tue', date: '14 Sep', long: 'Tuesday, 14 September' },
  { id: 'd2', dow: 'Wed', date: '15 Sep', long: 'Wednesday, 15 September' },
  { id: 'd3', dow: 'Thu', date: '16 Sep', long: 'Thursday, 16 September' },
]

export const SPEAKERS: Speaker[] = [
  { id: 'sp1', name: 'Dr. Astrid Hellevik', role: 'Director of Assessment', org: 'University of Bergen', initials: 'AH', color: 'var(--wf-green-9)',
    bio: 'Astrid leads digital assessment strategy across Bergen’s eight faculties and has spent fifteen years researching how exam design shapes learning outcomes.', topics: ['Assessment design', 'Policy'] },
  { id: 'sp2', name: 'Prof. Mikkel Sørensen', role: 'Professor of Educational Technology', org: 'Aarhus University', initials: 'MS', color: 'var(--wf-blue-9)',
    bio: 'Mikkel’s work focuses on the measurable impact of platform design on candidate stress and integrity outcomes in high-stakes settings.', topics: ['EdTech', 'Candidate experience'] },
  { id: 'sp3', name: 'Dr. Lena Virtanen', role: 'Head of Academic Integrity', org: 'University of Helsinki', initials: 'LV', color: 'var(--wf-purple-8)',
    bio: 'Lena built Helsinki’s integrity review process from the ground up and advises the Finnish ministry on AI-detection policy.', topics: ['Integrity', 'AI detection'] },
  { id: 'sp4', name: 'Johan Berg', role: 'VP Product', org: 'Uniwise', initials: 'JB', color: 'var(--wf-green-10)',
    bio: 'Johan oversees the WISEflow and Originality product lines and is responsible for the 2027 platform roadmap.', topics: ['Product', 'Roadmap'] },
  { id: 'sp5', name: 'Dr. Sofia Almeida', role: 'Senior Lecturer in Law', org: 'University of Coimbra', initials: 'SA', color: 'var(--wf-orange-9)',
    bio: 'Sofia redesigned Coimbra’s law assessments around authentic, open-book tasks and studies their effect on candidate performance.', topics: ['Authentic assessment', 'Law'] },
  { id: 'sp6', name: 'Erik Lindqvist', role: 'Chief Examiner', org: 'KTH Stockholm', initials: 'EL', color: 'var(--wf-blue-10)',
    bio: 'Erik coordinates examinations for 14,000 engineering candidates and champions accessible exam workflows.', topics: ['Accessibility', 'Operations'] },
  { id: 'sp7', name: 'Dr. Priya Nair', role: 'Research Fellow', org: 'University of Edinburgh', initials: 'PN', color: 'var(--wf-teal-9)',
    bio: 'Priya researches the reliability of similarity scoring and the limits of AI-generated text detection.', topics: ['Research', 'AI'] },
  { id: 'sp8', name: 'Marta Nowak', role: 'Assessment Lead', org: 'Jagiellonian University', initials: 'MN', color: 'var(--wf-purple-10)',
    bio: 'Marta migrated Jagiellonian’s paper exams to fully digital flows across three years and 600 courses.', topics: ['Migration', 'Change management'] },
  { id: 'sp9', name: 'Henrik Dahl', role: 'CEO', org: 'Uniwise', initials: 'HD', color: 'var(--wf-green-9)',
    bio: 'Henrik co-founded Uniwise and sets the vision for assessment integrity across the Nordics and beyond.', topics: ['Vision', 'Leadership'] },
  { id: 'sp10', name: 'Dr. Yusuf Demir', role: 'Lecturer in Data Science', org: 'TU Delft', initials: 'YD', color: 'var(--wf-orange-10)',
    bio: 'Yusuf builds auto-graded coding assessments and studies fairness in automated scoring.', topics: ['Auto-grading', 'Fairness'] },
]

export const SESSIONS: Session[] = [
  // ── Day 1 ──
  { id: 's101', day: 'd1', start: '08:30', end: '09:30', title: 'Registration & welcome coffee', type: 'break', track: 'plenary', room: 'Foyer', speakers: [], desc: 'Collect your badge, grab a coffee, and meet fellow delegates before the opening.', going: 0 },
  { id: 's102', day: 'd1', start: '09:30', end: '10:30', title: 'Opening keynote: Assessment, reimagined', type: 'keynote', track: 'plenary', room: 'Main Stage', speakers: ['sp9', 'sp1'], desc: 'A look at where digital assessment is heading — and why the next decade belongs to authentic, integrity-first design. Henrik opens the conference, joined by Astrid Hellevik for a forward-looking conversation.', going: 412, tags: ['Opening', 'Vision'] },
  { id: 's103', day: 'd1', start: '10:30', end: '11:00', title: 'Morning break', type: 'break', track: 'plenary', room: 'Foyer', speakers: [], desc: 'Refreshments served in the foyer.', going: 0 },
  { id: 's104', day: 'd1', start: '11:00', end: '11:45', title: 'Detecting AI-generated text: what the evidence says', type: 'talk', track: 'integrity', room: 'Hall B', speakers: ['sp3', 'sp7'], desc: 'A sober, research-grounded view of what current AI-detection methods can and cannot reliably tell us — and how to set defensible thresholds.', going: 156, tags: ['AI', 'Detection'] },
  { id: 's105', day: 'd1', start: '11:00', end: '11:45', title: 'Designing open-book exams that work', type: 'talk', track: 'pedagogy', room: 'Studio 1', speakers: ['sp5'], desc: 'Practical patterns for authentic, open-book assessment that measures reasoning rather than recall.', going: 98, tags: ['Authentic'] },
  { id: 's106', day: 'd1', start: '11:00', end: '12:30', title: 'Workshop: Building your first flow', type: 'workshop', track: 'workshop', room: 'Workshop Lab', speakers: ['sp4'], desc: 'Hands-on session — bring a laptop. Build an end-to-end assessment flow in WISEflow, from authoring to grading. Limited to 40 seats.', going: 38, capacity: 40, tags: ['Hands-on', 'Beginner'] },
  { id: 's107', day: 'd1', start: '12:30', end: '13:30', title: 'Lunch', type: 'break', track: 'plenary', room: 'Foyer', speakers: [], desc: 'Lunch is served in the foyer and terrace.', going: 0 },
  { id: 's108', day: 'd1', start: '13:30', end: '14:15', title: 'Migrating 600 courses to digital exams', type: 'talk', track: 'platform', room: 'Hall B', speakers: ['sp8'], desc: 'How Jagiellonian University moved from paper to fully digital flows over three years — the wins, the setbacks, and the change-management playbook.', going: 134, tags: ['Migration', 'Case study'] },
  { id: 's109', day: 'd1', start: '13:30', end: '14:15', title: 'Accessibility is not an add-on', type: 'talk', track: 'pedagogy', room: 'Studio 1', speakers: ['sp6'], desc: 'Designing exam workflows that work for every candidate from the start, not as a retrofit.', going: 87, tags: ['Accessibility'] },
  { id: 's110', day: 'd1', start: '14:30', end: '15:30', title: 'Panel: The integrity arms race', type: 'panel', track: 'integrity', room: 'Main Stage', speakers: ['sp3', 'sp7', 'sp2', 'sp1'], desc: 'As generative AI advances, how should institutions respond — with detection, with redesign, or both? A candid panel across four institutions.', going: 298, tags: ['Panel', 'AI'] },
  { id: 's111', day: 'd1', start: '15:30', end: '16:00', title: 'Afternoon break', type: 'break', track: 'plenary', room: 'Foyer', speakers: [], desc: 'Refreshments served in the foyer.', going: 0 },
  { id: 's112', day: 'd1', start: '16:00', end: '16:45', title: 'Fairness in automated scoring', type: 'talk', track: 'research', room: 'Studio 2', speakers: ['sp10'], desc: 'What does it take to trust an auto-graded result? New findings on bias and reliability in automated scoring.', going: 76, tags: ['Auto-grading', 'Fairness'] },
  { id: 's113', day: 'd1', start: '17:30', end: '19:30', title: 'Welcome reception', type: 'social', track: 'plenary', room: 'Rooftop Terrace', speakers: [], desc: 'Drinks, food, and music to close the first day. Open to all delegates.', going: 356, tags: ['Social'] },

  // ── Day 2 ──
  { id: 's201', day: 'd2', start: '09:00', end: '10:00', title: 'Keynote: What candidates actually feel', type: 'keynote', track: 'plenary', room: 'Main Stage', speakers: ['sp2'], desc: 'New data on candidate stress, trust, and platform design — and what it means for how we build assessment tools.', going: 388, tags: ['Keynote', 'Research'] },
  { id: 's202', day: 'd2', start: '10:15', end: '11:00', title: 'The 2027 WISEflow roadmap', type: 'talk', track: 'platform', room: 'Main Stage', speakers: ['sp4'], desc: 'A first look at what’s shipping next across WISEflow and Originality, straight from the product team.', going: 341, tags: ['Roadmap', 'Product'] },
  { id: 's203', day: 'd2', start: '11:15', end: '12:45', title: 'Workshop: Originality in practice', type: 'workshop', track: 'workshop', room: 'Workshop Lab', speakers: ['sp3'], desc: 'Hands-on with the Originality module — reading similarity reports, setting thresholds, and handling reviews. Limited to 40 seats.', going: 40, capacity: 40, tags: ['Hands-on', 'Integrity'] },
  { id: 's204', day: 'd2', start: '11:15', end: '12:00', title: 'Reliability of similarity scoring', type: 'talk', track: 'research', room: 'Studio 2', speakers: ['sp7'], desc: 'How reproducible are similarity scores across runs and corpora? A research deep-dive.', going: 64, tags: ['Research'] },
  { id: 's205', day: 'd2', start: '12:45', end: '13:45', title: 'Lunch', type: 'break', track: 'plenary', room: 'Foyer', speakers: [], desc: 'Lunch is served in the foyer and terrace.', going: 0 },
  { id: 's206', day: 'd2', start: '14:00', end: '14:45', title: 'Open-book law exams: two years on', type: 'talk', track: 'pedagogy', room: 'Studio 1', speakers: ['sp5'], desc: 'Results and lessons from Coimbra’s shift to authentic, open-book law assessment.', going: 92, tags: ['Law', 'Case study'] },
  { id: 's207', day: 'd2', start: '15:00', end: '16:00', title: 'Panel: Buying assessment technology', type: 'panel', track: 'platform', room: 'Hall B', speakers: ['sp6', 'sp8', 'sp4'], desc: 'What chief examiners and procurement teams really need to ask before committing to a platform.', going: 178, tags: ['Panel', 'Procurement'] },

  // ── Day 3 ──
  { id: 's301', day: 'd3', start: '09:30', end: '10:30', title: 'Keynote: The next ten years of integrity', type: 'keynote', track: 'plenary', room: 'Main Stage', speakers: ['sp1', 'sp3'], desc: 'Closing thoughts on where academic integrity is heading and what institutions should prepare for now.', going: 302, tags: ['Keynote'] },
  { id: 's302', day: 'd3', start: '10:45', end: '11:30', title: 'Auto-graded coding at scale', type: 'talk', track: 'research', room: 'Studio 2', speakers: ['sp10'], desc: 'Building and trusting auto-graded programming assessments for thousands of candidates.', going: 71, tags: ['Auto-grading'] },
  { id: 's303', day: 'd3', start: '11:45', end: '12:30', title: 'Closing remarks & WISEcon28', type: 'plenary', track: 'plenary', room: 'Main Stage', speakers: ['sp9'], desc: 'We wrap up, share the highlights, and reveal where WISEcon goes next.', going: 280, tags: ['Closing'] },
]

export const ATTENDEES: Attendee[] = [
  { id: 'a1', name: 'Camille Roy', role: 'Assessment Coordinator', org: 'Université de Lyon', initials: 'CR', color: 'var(--wf-blue-9)', interests: ['Integrity', 'Pedagogy'], mutual: 3, status: 'connect' },
  { id: 'a2', name: 'Tom Bakker', role: 'Lecturer', org: 'Utrecht University', initials: 'TB', color: 'var(--wf-orange-9)', interests: ['EdTech', 'Auto-grading'], mutual: 1, status: 'connect' },
  { id: 'a3', name: 'Ingrid Solberg', role: 'Exams Officer', org: 'NTNU Trondheim', initials: 'IS', color: 'var(--wf-purple-8)', interests: ['Operations', 'Accessibility'], mutual: 5, status: 'pending' },
  { id: 'a4', name: 'Daniel Okafor', role: 'Head of Digital Learning', org: 'Trinity College Dublin', initials: 'DO', color: 'var(--wf-teal-9)', interests: ['Platform', 'Migration'], mutual: 2, status: 'connect' },
  { id: 'a5', name: 'Elena Popescu', role: 'Quality Assurance', org: 'University of Bucharest', initials: 'EP', color: 'var(--wf-green-9)', interests: ['Integrity', 'Policy'], mutual: 0, status: 'connect' },
  { id: 'a6', name: 'Lars Andersen', role: 'IT Lead', org: 'Copenhagen Business School', initials: 'LA', color: 'var(--wf-blue-10)', interests: ['Platform', 'Security'], mutual: 4, status: 'connected' },
]

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'reminder', title: 'Starting in 15 minutes', body: 'Opening keynote: Assessment, reimagined — Main Stage', time: '09:15', unread: true },
  { id: 'n2', type: 'connect', title: 'Ingrid Solberg wants to connect', body: 'Exams Officer · NTNU Trondheim', time: '08:52', unread: true },
  { id: 'n3', type: 'announce', title: 'Room change', body: 'Fairness in automated scoring has moved to Studio 2.', time: '08:30', unread: true },
  { id: 'n4', type: 'social', title: 'Welcome reception tonight', body: 'Rooftop Terrace from 17:30 — open to all delegates.', time: 'Yesterday', unread: false },
  { id: 'n5', type: 'feedback', title: 'How was the workshop?', body: 'Share your feedback on “Building your first flow”.', time: 'Yesterday', unread: false },
  { id: 'n6', type: 'announce', title: 'Wi-Fi & app tips', body: 'Network: WISEcon27 · Password: assessment27', time: '13 Sep', unread: false },
]

export const SPONSORS: Sponsor[] = [
  { name: 'Uniwise', tier: 'Host', blurb: 'Makers of WISEflow & Originality', initials: 'UW', color: 'var(--wf-green-7)' },
  { name: 'Nordia Cloud', tier: 'Platinum', blurb: 'Secure cloud for education', initials: 'NC', color: 'var(--wf-blue-9)' },
  { name: 'Lexify', tier: 'Platinum', blurb: 'Academic publishing platform', initials: 'LX', color: 'var(--wf-purple-8)' },
  { name: 'Gradewell', tier: 'Gold', blurb: 'Assessment analytics', initials: 'GW', color: 'var(--wf-orange-9)' },
  { name: 'ProctorIO Nordic', tier: 'Gold', blurb: 'Remote invigilation', initials: 'PN', color: 'var(--wf-teal-9)' },
  { name: 'Campus IT', tier: 'Silver', blurb: 'Education infrastructure', initials: 'CI', color: 'var(--wf-blue-10)' },
  { name: 'Skole AS', tier: 'Silver', blurb: 'Student information systems', initials: 'SA', color: 'var(--wf-green-10)' },
  { name: 'BetterMark', tier: 'Silver', blurb: 'Rubric tooling', initials: 'BM', color: 'var(--wf-orange-10)' },
]

export const ME: Me = {
  name: 'Maria Nielsen', initials: 'MN', role: 'Assessment Lead', org: 'Aarhus University',
  color: 'var(--wf-blue-9)', ticket: 'Full delegate', badgeId: 'WC27-1482',
  bookmarks: ['s102', 's104', 's106', 's110', 's202'],
  delegateType: 'delegate', gala: false,
}

// "Now"/"today" is pinned to Day 1 @ 10:50 (as in the prototype) so the
// "up next" / "live" states match the design. Swap CLOCK.now/today for the
// real clock in production to compute these dynamically.
export const CLOCK = { today: 'd1', now: '10:50' }

export const speakersOf = (s: Session): Speaker[] =>
  (s.speakers || []).map((id) => SPEAKERS.find((x) => x.id === id)).filter(Boolean) as Speaker[]
