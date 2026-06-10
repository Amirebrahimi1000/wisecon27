-- WISEcon27 — real programme (ported from the WISEcon25 programme workbook,
-- mapped onto the WISEcon27 dates: Tue 2 + Wed 3 March 2027).
-- Speaker names are FICTIONAL placeholders (privacy) — sessions are real.
-- Replaces ALL demo sessions/speakers. Organiser notes (chairs, recordings,
-- reminders) from the workbook are intentionally omitted; presenter names
-- without full public identities are credited in the session description.
-- Run in Supabase SQL Editor.

delete from public.session_speakers;
delete from public.sessions;
delete from public.speakers;

insert into public.speakers (id, name, role, org, initials, color, bio, topics, sort) values
  ('sp_rasmus',   'James Whitfield',       '',                                         'UNIwise',                        'JW', 'var(--wf-green-9)',  '', '{}', 0),
  ('sp_bernt',    'Oliver Bennett',        '',                                         'HVL / Sikt',                     'OB', 'var(--wf-blue-9)',   '', '{}', 1),
  ('sp_claudia',  'Emily Carter',          '',                                         'UCL',                            'EC', 'var(--wf-purple-8)', '', '{}', 2),
  ('sp_amanda',   'Sophie Turner',         '',                                         'UCL',                            'ST', 'var(--wf-orange-9)', '', '{}', 3),
  ('sp_aleksei',  'Daniel Hayes',          '',                                         'AWS',                            'DH', 'var(--wf-teal-9)',   '', '{}', 4),
  ('sp_nicole_e', 'Charlotte Webb',        '',                                         'BI Norwegian Business School',   'CW', 'var(--wf-tomato-9)', '', '{}', 5),
  ('sp_cattreya', 'Grace Mitchell',        '',                                         'BI Norwegian Business School',   'GM', 'var(--wf-green-9)',  '', '{}', 6),
  ('sp_christian','Thomas Ellison',        '',                                         'Sikt',                           'TE', 'var(--wf-blue-9)',   '', '{}', 7),
  ('sp_hannah',   'Lucy Pemberton',        '',                                         'Jisc',                           'LP', 'var(--wf-purple-8)', '', '{}', 8),
  ('sp_kurtis',   'Jack Harrison',         '',                                         'Comm100',                        'JH', 'var(--wf-orange-9)', '', '{}', 9),
  ('sp_matin',    'Ryan Cole',             '',                                         'Comm100',                        'RC', 'var(--wf-teal-9)',   '', '{}', 10),
  ('sp_sara',     'Megan Foster',          '',                                         '',                               'MF', 'var(--wf-tomato-9)', '', '{}', 11),
  ('sp_andrea',   'Laura Simmons',         '',                                         '',                               'LS', 'var(--wf-green-9)',  '', '{}', 12),
  ('sp_chris',    'William Drake',         '',                                         'University of Portsmouth',       'WD', 'var(--wf-blue-9)',   '', '{}', 13);

insert into public.sessions (id, day_id, start, "end", title, type, track, room, "desc", tags, going, capacity) values
  -- ════════ Day 1 — Tuesday 2 March ════════
  ('t100', 'd1', '10:00', '10:30', 'Arrival & networking', 'social', 'plenary', 'Foyer', 'Pick up your badge, grab a coffee and say hello.', '{}', 0, null),
  ('t110', 'd1', '10:30', '10:55', 'Welcome to WISEcon', 'plenary', 'plenary', 'Auditorium 1', 'Opening welcome from the UNIwise team — and where digital assessment is heading next.', '{}', 0, null),
  ('t121', 'd1', '11:00', '11:45', 'Preventing academic misconduct with WISEflow', 'talk', 'integrity', 'Frobisher Room 1', 'Discover how WISEflow can help you prevent academic misconduct. Presented by the UNIwise team.', '{"Breakout #1"}', 0, null),
  ('t122', 'd1', '11:00', '11:45', 'Accessibility: who cares?', 'talk', 'pedagogy', 'Frobisher Room 2', 'A practical look at accessibility in digital assessment. Presented by the UNIwise team.', '{"Breakout #1"}', 0, null),
  ('t123', 'd1', '11:00', '11:45', 'Digitising paper-based exams: student-based scanning', 'talk', 'research', 'Frobisher Room 3', 'Exploring digitisation of paper-based exams through student-based scanning.', '{"Breakout #1"}', 0, null),
  ('t124', 'd1', '11:00', '11:45', 'WISEflow Integration Lab: APIs, LTI and shared challenges', 'workshop', 'platform', 'Frobisher Room 4', 'Maximising the potential of APIs and LTI — bring your integration questions. Hosted by the UNIwise integration team.', '{"Breakout #1"}', 0, null),
  ('t130', 'd1', '11:45', '12:15', 'Coffee break', 'break', 'plenary', 'Foyer', '', '{}', 0, null),
  ('t140', 'd1', '12:15', '13:00', 'HEI sector outlook: status and drivers in digital assessment', 'keynote', 'plenary', 'Auditorium 1', 'Where the higher-education sector stands on digital assessment, and the drivers shaping what comes next.', '{}', 0, null),
  ('t150', 'd1', '13:00', '13:45', 'Lunch', 'break', 'plenary', '', '', '{}', 0, null),
  ('t161', 'd1', '13:45', '14:30', 'New year, new you: implementing the new marking tool at UCL', 'talk', 'platform', 'Frobisher Room 1', 'How UCL rolled out the new marking tool — lessons from a large-scale implementation.', '{"Breakout #2"}', 0, null),
  ('t162', 'd1', '13:45', '14:30', 'AI feedback', 'panel', 'pedagogy', 'Frobisher Room 2', 'AI-supported feedback in practice — perspectives from UNIwise, AWS and BI Norwegian Business School.', '{"Breakout #2"}', 0, null),
  ('t163', 'd1', '13:45', '14:30', 'Rethinking rubrics: from assessment tool to data-driven resource', 'talk', 'research', 'Frobisher Room 3', 'Turning rubrics into a data-driven resource for better assessment decisions.', '{"Breakout #2"}', 0, null),
  ('t164', 'd1', '13:45', '14:30', 'Click smart, not hard: the iron triangle of manager efficiency', 'talk', 'platform', 'Frobisher Room 4', 'Investigating manager efficiency in WISEflow.', '{"Breakout #2"}', 0, null),
  ('t170', 'd1', '14:30', '15:00', 'Networking break', 'break', 'plenary', 'Foyer', '', '{}', 0, null),
  ('t180', 'd1', '15:00', '15:45', 'Partnering at scale: turning collaboration into outcomes', 'panel', 'plenary', 'Auditorium 1', 'How national partners turn collaboration into outcomes for institutions.', '{}', 0, null),
  ('t191', 'd1', '15:45', '16:15', 'Application drop-in: Comm100, Schoolyear, Originality & WISEflow', 'workshop', 'workshop', 'Frobisher Room 1', 'Drop in with your questions about the applications in and around WISEflow.', '{"Drop-in"}', 0, null),
  ('t192', 'd1', '15:45', '16:15', 'WISEflow question cards & support quiz', 'social', 'workshop', 'Frobisher Room 2', 'A light-hearted networking break with WISEflow question cards and a support quiz.', '{"Drop-in"}', 0, null),
  ('t193', 'd1', '15:45', '16:15', 'Customer Success WISEflow Q&A', 'workshop', 'workshop', 'Frobisher Room 3', 'Open Q&A with the UNIwise Customer Success team.', '{"Drop-in"}', 0, null),
  ('t194', 'd1', '15:45', '16:15', 'Getting started: onboarding & change management', 'talk', 'workshop', 'Frobisher Room 4', 'Hear from a recently onboarded institution, plus practical guidance on change management.', '{"Drop-in"}', 0, null),
  ('t199', 'd1', '16:15', '16:30', 'Closing remarks & gala dinner preview', 'plenary', 'plenary', 'Auditorium 1', 'Wrapping up day one — and a look ahead to tonight''s gala dinner and tomorrow''s programme.', '{}', 0, null),

  -- ════════ Day 2 — Wednesday 3 March ════════
  ('w200', 'd2', '09:30', '09:45', 'Arrival & networking', 'social', 'plenary', 'Foyer', '', '{}', 0, null),
  ('w210', 'd2', '09:45', '10:00', 'Welcome back', 'plenary', 'plenary', 'Auditorium 1', 'Day two kick-off — plus a teaser for the UNIwise Customer Awards.', '{}', 0, null),
  ('w221', 'd2', '10:00', '10:45', 'Guiding assessment, enhancing feedback: rubrics in WISEflow', 'talk', 'pedagogy', 'Frobisher Room 1', 'Exploring rubrics in WISEflow to guide assessment and enhance feedback.', '{"Breakout #3"}', 0, null),
  ('w222', 'd2', '10:00', '10:45', 'Supporting assessors with smart, efficient originality checks', 'talk', 'integrity', 'Frobisher Room 2', 'Smart, efficient originality checking that supports assessors.', '{"Breakout #3"}', 0, null),
  ('w223', 'd2', '10:00', '10:45', 'Two-way chat, one goal: student success in exams', 'talk', 'platform', 'Frobisher Room 3', 'Live two-way chat in exams and what it means for student success.', '{"Breakout #3"}', 0, null),
  ('w224', 'd2', '10:00', '10:45', 'The formative assessment package', 'talk', 'pedagogy', 'Frobisher Room 4', 'Introducing the formative assessment package.', '{"Breakout #3"}', 0, null),
  ('w230', 'd2', '10:45', '11:30', 'Brunch', 'break', 'plenary', '', '', '{}', 0, null),
  ('w241', 'd2', '11:30', '12:15', 'WISEflowing from one digital exam system to another', 'talk', 'platform', 'Frobisher Room 1', 'A migration story: moving from one digital exam system to another.', '{"Breakout #4"}', 0, null),
  ('w242', 'd2', '11:30', '12:15', 'Authentic assessment: are our assessments truly authentic?', 'talk', 'research', 'Frobisher Room 2', 'A critical look at authenticity in assessment design.', '{"Breakout #4"}', 0, null),
  ('w243', 'd2', '11:30', '12:15', 'Secure exams with Excel and real desktop applications', 'talk', 'integrity', 'Frobisher Room 3', 'WISEflow meets Schoolyear: running secure exams with Excel and other real desktop applications.', '{"Breakout #4"}', 0, null),
  ('w244', 'd2', '11:30', '12:15', 'Paper Submission Module: bridging paper and digital', 'talk', 'platform', 'Frobisher Room 4', 'Bridging the gap between paper and digital submission.', '{"Breakout #4"}', 0, null),
  ('w250', 'd2', '12:15', '12:40', 'UNIwise Customer Awards', 'social', 'plenary', 'Auditorium 1', 'Celebrating this year''s customer achievements.', '{}', 0, null),
  ('w260', 'd2', '12:40', '13:00', 'Farewell & departure', 'social', 'plenary', 'Foyer', 'Thank you for joining WISEcon27 — safe travels home.', '{}', 0, null);

insert into public.session_speakers (session_id, speaker_id, ord) values
  ('t110', 'sp_rasmus', 0),
  ('t123', 'sp_bernt', 0),
  ('t140', 'sp_rasmus', 0),
  ('t161', 'sp_claudia', 0), ('t161', 'sp_amanda', 1),
  ('t162', 'sp_rasmus', 0), ('t162', 'sp_aleksei', 1), ('t162', 'sp_nicole_e', 2),
  ('t163', 'sp_cattreya', 0),
  ('t180', 'sp_christian', 0), ('t180', 'sp_hannah', 1),
  ('w223', 'sp_kurtis', 0), ('w223', 'sp_matin', 1),
  ('w224', 'sp_rasmus', 0),
  ('w241', 'sp_sara', 0), ('w241', 'sp_andrea', 1),
  ('w242', 'sp_chris', 0);

-- countdown / live state follows the real programme times
update public.settings set value = '2027-03-02T10:00' where key = 'event_start';
update public.settings set value = '2027-03-03T13:00' where key = 'event_end';
