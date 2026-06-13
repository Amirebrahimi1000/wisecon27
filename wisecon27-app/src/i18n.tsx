// WISEcon27 — lightweight i18n. The chosen language is stored per device and
// exposed through a context so the UI re-renders on change. t(key) falls back
// to English, then to the key itself, so a missing translation degrades to
// readable English rather than breaking. Coverage starts with the navigation
// spine (tab bar, More, Settings) and the newer screens; remaining body copy
// is translated incrementally.
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { EXTRA } from './i18nExtra'

export type Lang = 'en' | 'da' | 'no' | 'de'

export const LANGS: { id: Lang; name: string; english: string }[] = [
  { id: 'en', name: 'English', english: 'English' },
  { id: 'da', name: 'Dansk', english: 'Danish' },
  { id: 'no', name: 'Norsk', english: 'Norwegian' },
  { id: 'de', name: 'Deutsch', english: 'German' },
]

const KEY = 'wc27.lang'

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'en' || v === 'da' || v === 'no' || v === 'de') return v
    // first run: take a sensible guess from the browser, default English
    const nav = (navigator.language || '').slice(0, 2).toLowerCase()
    if (nav === 'da' || nav === 'no' || nav === 'nb' || nav === 'nn' || nav === 'de') return nav === 'nb' || nav === 'nn' ? 'no' : (nav as Lang)
  } catch {
    /* ignore */
  }
  return 'en'
}

type Dict = Record<string, string>

const en: Dict = {
  'nav.home': 'Home', 'nav.agenda': 'Agenda', 'nav.activities': 'Activities', 'nav.connect': 'Connect', 'nav.more': 'More',

  'more.title': 'More',
  'more.myProfile': 'My profile',
  'more.completeHint': 'Add a photo & interests',
  'more.viewEdit': 'View and edit your profile',
  'more.myBadge': 'My badge',
  'more.sec.myEvent': 'My event', 'more.sec.explore': 'Explore', 'more.sec.support': 'Support & settings', 'more.sec.organiser': 'Organiser',
  'more.mySchedule': 'My schedule', 'more.myConnections': 'My connections', 'more.myMeetings': 'My meetings', 'more.notifications': 'Notifications',
  'more.sponsors': 'Sponsors & exhibitors', 'more.community': 'Community feed', 'more.venueMap': 'Venue map', 'more.activities': 'Interactive activities', 'more.info': 'Event info & Wi-Fi',
  'more.certificate': 'Certificate of attendance', 'more.notes': 'My notes', 'more.resources': 'Slides & recordings',
  'more.feedback': 'Give feedback', 'more.survey': 'Post-conference survey', 'more.tour': 'Take the app tour', 'more.settings': 'Settings',
  'more.scanning': 'Entrance scanning', 'more.admin': 'Admin tools', 'more.signOut': 'Sign out',
  'more.saved': 'saved', 'more.toAnswer': 'to answer', 'more.new': 'new', 'more.done': 'Done', 'more.staff': 'Staff', 'more.min1': '1 min',

  'settings.title': 'Settings',
  'settings.language': 'Language', 'settings.languageDesc': 'Choose your language for the app',

  'cert.title': 'Certificate of attendance',
  'cert.subtitle': 'Your personal record of the sessions you attended at WISEcon27.',
  'cert.cpd': 'CPD hours', 'cert.sessions': 'Sessions attended', 'cert.download': 'Download / print',
  'cert.none': "You haven't added any sessions to your schedule yet. Bookmark the sessions you attend and they'll appear here.",
  'cert.presented': 'This is to certify that', 'cert.attended': 'attended the following sessions at',

  'notes.title': 'My notes', 'notes.placeholder': 'Write a private note for this session…', 'notes.add': 'Add a note',
  'notes.empty': 'No notes yet. Open any session and tap Notes to jot something down — your notes stay private on this device.',
  'notes.private': 'Private to this device',

  'res.title': 'Slides & recordings', 'res.subtitle': 'Presentations and recordings shared by speakers — all in one place.',
  'res.empty': 'Nothing shared yet. Slides and recordings appear here once speakers upload them.', 'res.slides': 'Slides', 'res.recording': 'Recording',

  'session.addSchedule': 'Add to schedule', 'session.inSchedule': 'In my schedule', 'session.remind': 'Remind', 'session.reminding': 'Reminding',
  'session.notes': 'Notes', 'session.clash': 'Clashes with another session in your schedule', 'session.reminderSet': 'Reminder set — ', 'session.reminderOff': 'Reminder removed',

  'info.eventInfo': 'Event info', 'info.essentials': 'Practical essentials',
  'profileNudge.title': 'Complete your profile', 'profileNudge.body': 'Add your interests to get session matches and let people find you.', 'profileNudge.cta': 'Add details',
}

const da: Dict = {
  'nav.home': 'Hjem', 'nav.agenda': 'Program', 'nav.activities': 'Aktiviteter', 'nav.connect': 'Netværk', 'nav.more': 'Mere',

  'more.title': 'Mere',
  'more.myProfile': 'Min profil',
  'more.completeHint': 'Tilføj billede og interesser',
  'more.viewEdit': 'Se og rediger din profil',
  'more.myBadge': 'Mit badge',
  'more.sec.myEvent': 'Mit event', 'more.sec.explore': 'Udforsk', 'more.sec.support': 'Support og indstillinger', 'more.sec.organiser': 'Arrangør',
  'more.mySchedule': 'Mit program', 'more.myConnections': 'Mine forbindelser', 'more.myMeetings': 'Mine møder', 'more.notifications': 'Notifikationer',
  'more.sponsors': 'Sponsorer og udstillere', 'more.community': 'Fællesskab', 'more.venueMap': 'Områdekort', 'more.activities': 'Interaktive aktiviteter', 'more.info': 'Eventinfo og Wi-Fi',
  'more.certificate': 'Deltagerbevis', 'more.notes': 'Mine noter', 'more.resources': 'Slides og optagelser',
  'more.feedback': 'Giv feedback', 'more.survey': 'Spørgeskema efter konferencen', 'more.tour': 'Tag rundvisningen', 'more.settings': 'Indstillinger',
  'more.scanning': 'Indgangsscanning', 'more.admin': 'Adminværktøjer', 'more.signOut': 'Log ud',
  'more.saved': 'gemt', 'more.toAnswer': 'at besvare', 'more.new': 'nye', 'more.done': 'Udført', 'more.staff': 'Personale', 'more.min1': '1 min',

  'settings.title': 'Indstillinger',
  'settings.language': 'Sprog', 'settings.languageDesc': 'Vælg appens sprog',

  'cert.title': 'Deltagerbevis',
  'cert.subtitle': 'Din personlige oversigt over de sessioner, du deltog i på WISEcon27.',
  'cert.cpd': 'CPD-timer', 'cert.sessions': 'Sessioner', 'cert.download': 'Download / udskriv',
  'cert.none': 'Du har ikke tilføjet nogen sessioner til dit program endnu. Bogmærk de sessioner, du deltager i, så vises de her.',
  'cert.presented': 'Det bekræftes hermed, at', 'cert.attended': 'deltog i følgende sessioner ved',

  'notes.title': 'Mine noter', 'notes.placeholder': 'Skriv en privat note til denne session…', 'notes.add': 'Tilføj en note',
  'notes.empty': 'Ingen noter endnu. Åbn en session og tryk på Noter for at skrive noget — dine noter forbliver private på denne enhed.',
  'notes.private': 'Privat på denne enhed',

  'res.title': 'Slides og optagelser', 'res.subtitle': 'Præsentationer og optagelser delt af talere — samlet ét sted.',
  'res.empty': 'Intet delt endnu. Slides og optagelser vises her, når talerne uploader dem.', 'res.slides': 'Slides', 'res.recording': 'Optagelse',

  'session.addSchedule': 'Føj til program', 'session.inSchedule': 'I mit program', 'session.remind': 'Påmind', 'session.reminding': 'Påmindes',
  'session.notes': 'Noter', 'session.clash': 'Overlapper med en anden session i dit program', 'session.reminderSet': 'Påmindelse sat — ', 'session.reminderOff': 'Påmindelse fjernet',

  'info.eventInfo': 'Eventinfo', 'info.essentials': 'Praktisk information',
  'profileNudge.title': 'Færdiggør din profil', 'profileNudge.body': 'Tilføj dine interesser for at få sessionsforslag og blive fundet af andre.', 'profileNudge.cta': 'Tilføj detaljer',
}

const no: Dict = {
  'nav.home': 'Hjem', 'nav.agenda': 'Program', 'nav.activities': 'Aktiviteter', 'nav.connect': 'Nettverk', 'nav.more': 'Mer',

  'more.title': 'Mer',
  'more.myProfile': 'Min profil',
  'more.completeHint': 'Legg til bilde og interesser',
  'more.viewEdit': 'Se og rediger profilen din',
  'more.myBadge': 'Mitt badge',
  'more.sec.myEvent': 'Mitt arrangement', 'more.sec.explore': 'Utforsk', 'more.sec.support': 'Støtte og innstillinger', 'more.sec.organiser': 'Arrangør',
  'more.mySchedule': 'Mitt program', 'more.myConnections': 'Mine kontakter', 'more.myMeetings': 'Mine møter', 'more.notifications': 'Varsler',
  'more.sponsors': 'Sponsorer og utstillere', 'more.community': 'Fellesskap', 'more.venueMap': 'Områdekart', 'more.activities': 'Interaktive aktiviteter', 'more.info': 'Arrangementsinfo og Wi-Fi',
  'more.certificate': 'Deltakerbevis', 'more.notes': 'Mine notater', 'more.resources': 'Lysbilder og opptak',
  'more.feedback': 'Gi tilbakemelding', 'more.survey': 'Spørreundersøkelse etter konferansen', 'more.tour': 'Ta omvisningen', 'more.settings': 'Innstillinger',
  'more.scanning': 'Inngangsskanning', 'more.admin': 'Adminverktøy', 'more.signOut': 'Logg ut',
  'more.saved': 'lagret', 'more.toAnswer': 'å svare på', 'more.new': 'nye', 'more.done': 'Fullført', 'more.staff': 'Personale', 'more.min1': '1 min',

  'settings.title': 'Innstillinger',
  'settings.language': 'Språk', 'settings.languageDesc': 'Velg språk for appen',

  'cert.title': 'Deltakerbevis',
  'cert.subtitle': 'Din personlige oversikt over øktene du deltok på under WISEcon27.',
  'cert.cpd': 'CPD-timer', 'cert.sessions': 'Økter', 'cert.download': 'Last ned / skriv ut',
  'cert.none': 'Du har ikke lagt til noen økter i programmet ennå. Bokmerk øktene du deltar på, så vises de her.',
  'cert.presented': 'Det bekreftes herved at', 'cert.attended': 'deltok på følgende økter ved',

  'notes.title': 'Mine notater', 'notes.placeholder': 'Skriv et privat notat for denne økten…', 'notes.add': 'Legg til notat',
  'notes.empty': 'Ingen notater ennå. Åpne en økt og trykk på Notater for å skrive noe — notatene dine forblir private på denne enheten.',
  'notes.private': 'Privat på denne enheten',

  'res.title': 'Lysbilder og opptak', 'res.subtitle': 'Presentasjoner og opptak delt av foredragsholdere — samlet på ett sted.',
  'res.empty': 'Ingenting delt ennå. Lysbilder og opptak vises her når foredragsholderne laster dem opp.', 'res.slides': 'Lysbilder', 'res.recording': 'Opptak',

  'session.addSchedule': 'Legg til i program', 'session.inSchedule': 'I mitt program', 'session.remind': 'Påminn', 'session.reminding': 'Påminnes',
  'session.notes': 'Notater', 'session.clash': 'Overlapper med en annen økt i programmet ditt', 'session.reminderSet': 'Påminnelse satt — ', 'session.reminderOff': 'Påminnelse fjernet',

  'info.eventInfo': 'Eventinfo', 'info.essentials': 'Praktisk informasjon',
  'profileNudge.title': 'Fullfør profilen din', 'profileNudge.body': 'Legg til interessene dine for å få øktforslag og bli funnet av andre.', 'profileNudge.cta': 'Legg til detaljer',
}

const de: Dict = {
  'nav.home': 'Start', 'nav.agenda': 'Programm', 'nav.activities': 'Aktivitäten', 'nav.connect': 'Netzwerk', 'nav.more': 'Mehr',

  'more.title': 'Mehr',
  'more.myProfile': 'Mein Profil',
  'more.completeHint': 'Foto & Interessen hinzufügen',
  'more.viewEdit': 'Profil ansehen und bearbeiten',
  'more.myBadge': 'Mein Badge',
  'more.sec.myEvent': 'Mein Event', 'more.sec.explore': 'Entdecken', 'more.sec.support': 'Support & Einstellungen', 'more.sec.organiser': 'Veranstalter',
  'more.mySchedule': 'Mein Programm', 'more.myConnections': 'Meine Kontakte', 'more.myMeetings': 'Meine Meetings', 'more.notifications': 'Benachrichtigungen',
  'more.sponsors': 'Sponsoren & Aussteller', 'more.community': 'Community', 'more.venueMap': 'Lageplan', 'more.activities': 'Interaktive Aktivitäten', 'more.info': 'Event-Infos & WLAN',
  'more.certificate': 'Teilnahmebescheinigung', 'more.notes': 'Meine Notizen', 'more.resources': 'Folien & Aufzeichnungen',
  'more.feedback': 'Feedback geben', 'more.survey': 'Umfrage nach der Konferenz', 'more.tour': 'App-Tour starten', 'more.settings': 'Einstellungen',
  'more.scanning': 'Eingangs-Scan', 'more.admin': 'Admin-Tools', 'more.signOut': 'Abmelden',
  'more.saved': 'gespeichert', 'more.toAnswer': 'zu beantworten', 'more.new': 'neu', 'more.done': 'Fertig', 'more.staff': 'Personal', 'more.min1': '1 Min.',

  'settings.title': 'Einstellungen',
  'settings.language': 'Sprache', 'settings.languageDesc': 'Wähle die Sprache der App',

  'cert.title': 'Teilnahmebescheinigung',
  'cert.subtitle': 'Deine persönliche Übersicht der Sessions, an denen du bei der WISEcon27 teilgenommen hast.',
  'cert.cpd': 'CPD-Stunden', 'cert.sessions': 'Sessions', 'cert.download': 'Herunterladen / drucken',
  'cert.none': 'Du hast noch keine Sessions zu deinem Programm hinzugefügt. Markiere die besuchten Sessions, dann erscheinen sie hier.',
  'cert.presented': 'Hiermit wird bestätigt, dass', 'cert.attended': 'an den folgenden Sessions teilgenommen hat bei',

  'notes.title': 'Meine Notizen', 'notes.placeholder': 'Schreibe eine private Notiz zu dieser Session…', 'notes.add': 'Notiz hinzufügen',
  'notes.empty': 'Noch keine Notizen. Öffne eine Session und tippe auf Notizen — deine Notizen bleiben privat auf diesem Gerät.',
  'notes.private': 'Privat auf diesem Gerät',

  'res.title': 'Folien & Aufzeichnungen', 'res.subtitle': 'Von Vortragenden geteilte Präsentationen und Aufzeichnungen — alles an einem Ort.',
  'res.empty': 'Noch nichts geteilt. Folien und Aufzeichnungen erscheinen hier, sobald Vortragende sie hochladen.', 'res.slides': 'Folien', 'res.recording': 'Aufzeichnung',

  'session.addSchedule': 'Zum Programm', 'session.inSchedule': 'In meinem Programm', 'session.remind': 'Erinnern', 'session.reminding': 'Erinnerung an',
  'session.notes': 'Notizen', 'session.clash': 'Überschneidet sich mit einer anderen Session in deinem Programm', 'session.reminderSet': 'Erinnerung gesetzt — ', 'session.reminderOff': 'Erinnerung entfernt',

  'info.eventInfo': 'Event-Infos', 'info.essentials': 'Praktische Infos',
  'profileNudge.title': 'Profil vervollständigen', 'profileNudge.body': 'Füge deine Interessen hinzu, um passende Sessions zu erhalten und gefunden zu werden.', 'profileNudge.cta': 'Details hinzufügen',
}

const DICT: Record<Lang, Dict> = { en, da, no, de }

interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18n>({ lang: 'en', setLang: () => {}, t: (k) => en[k] ?? k })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLang)
  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem(KEY, l)
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('lang', l)
    setLangState(l)
  }, [])
  const t = useCallback((key: string) => DICT[lang][key] ?? EXTRA[key]?.[lang] ?? en[key] ?? EXTRA[key]?.en ?? key, [lang])
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useT(): I18n {
  return useContext(I18nContext)
}
