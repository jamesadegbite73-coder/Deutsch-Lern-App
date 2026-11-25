'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Lesson = {
  id: number;
  cefr_level: string;
  title: string;
  topic: string | null;
};

type Word = {
  id: number;
  lesson_id: number;
  german_word: string;
  article: string | null;
  plural_form: string | null;
  english_meaning: string;
  synonyms: string | null;
  example_sentence: string | null;
  lessons?: {
    cefr_level: string;
    title: string;
  } | null;
};

type GrammarQuestion = {
  id: number;
  cefr_level: string;
  topic: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
};

type GrammarNote = {
  id: string;
  cefr_level: 'A1' | 'A2';
  title: string;
  summary: string;
  rule: string;
  examples: { de: string; en: string }[];
};

const GRAMMAR_NOTES: GrammarNote[] = [
  // A1 GRAMMAR NOTES
  {
    id: 'a1-verb-position',
    cefr_level: 'A1',
    title: 'Satzbau: Verb auf Position 2 & W-Fragen',
    summary: 'In standard German statements, the conjugated verb always sits in Position 2.',
    rule: 'Aussagesatz: [Position 1] + [Konjugiertes Verb] + ... | W-Frage: [Fragewort] + [Verb] + [Subjekt] + ...',
    examples: [
      { de: 'Ich reise gern. / Gern reise ich.', en: 'I like to travel.' },
      { de: 'Woher kommen Sie? — Ich komme aus München.', en: 'Where are you from? — I come from Munich.' },
      { de: 'Wann gehen wir ins Museum? — Am Donnerstag.', en: 'When are we going to the museum? — On Thursday.' },
    ],
  },
  {
    id: 'a1-articles-negation',
    cefr_level: 'A1',
    title: 'Artikel (der / die / das) & Negation (kein / nicht)',
    summary: 'Every German noun has a grammatical gender; negate nouns with kein/keine and verbs/adjectives/phrases with nicht.',
    rule: 'Nominativ: der (m), die (f), das (n), die (Pl.) → kein (m/n), keine (f/Pl.)',
    examples: [
      { de: 'Das ist das Hotel Hafenblick.', en: 'That is the Hotel Hafenblick.' },
      { de: 'Das ist keine Kirche, das ist der Bahnhof.', en: 'That is not a church, that is the train station.' },
    ],
  },
  {
    id: 'a1-accusative',
    cefr_level: 'A1',
    title: 'Akkusativ (Objekt & Präposition "für")',
    summary: 'Most transitive verbs and the preposition "für" take the accusative case, where only masculine changes.',
    rule: 'Akkusativ maskulin: der → den | ein → einen | kein → keinen | mein → meinen (für mich / für dich)',
    examples: [
      { de: 'Wir machen einen Salat.', en: 'We are making a salad.' },
      { de: 'Für mich bitte eine Apfelsaftschorle.', en: 'An apple spritzer for me, please.' },
    ],
  },
  {
    id: 'a1-separable-verbs',
    cefr_level: 'A1',
    title: 'Trennbare Verben (mitkommen, einkaufen, umtauschen)',
    summary: 'Separable prefixes split off in simple present/imperative clauses and move to the very end.',
    rule: 'Aussage/Frage: Stamm auf Pos. 1/2 ... Präfix am Ende | Perfekt: Präfix + ge + Stamm (umgetauscht)',
    examples: [
      { de: 'Kommst du morgen mit ins Kino?', en: 'Are you coming along to the cinema tomorrow?' },
      { de: 'Sie waren zu klein. Ich habe sie umgetauscht.', en: 'They were too small. I exchanged them.' },
    ],
  },
  {
    id: 'a1-modals-imperative',
    cefr_level: 'A1',
    title: 'Modalverben (müssen, können, dürfen, sollen, wollen) & Imperativ',
    summary: 'Modal verbs take Position 2 and send the main verb in its infinitive form to the end.',
    rule: 'Pflicht: müssen | Erlaubnis/Verbot: dürfen (nicht) | Empfehlung/Auftrag: sollen',
    examples: [
      { de: 'Ich soll drei Tage im Bett bleiben.', en: 'I am supposed to stay in bed for three days.' },
      { de: 'Sein Knie tut weh. Er darf nicht Fußball spielen.', en: 'His knee hurts. He is not allowed to play football.' },
      { de: 'Trink Milch mit Honig! / Gehen Sie rechts.', en: 'Drink milk with honey! (du) / Go right. (Sie)' },
    ],
  },
  {
    id: 'a1-dative-wechsel',
    cefr_level: 'A1',
    title: 'Dativ (mit, bei, helfen, wem) & Wechselpräposition "in"',
    summary: '"mit" and "bei" always take the dative; "in" takes dative for location (Wo?) and accusative for direction (Wohin?).',
    rule: 'Dativ: der/das → dem, die → der, Plural → den (+n) | bei + dem = beim | in + das = ins',
    examples: [
      { de: 'Mit wem fährst du? — Mit einer Freundin.', en: 'Who are you traveling with? — With a friend.' },
      { de: 'Ich war beim Zahnarzt.', en: 'I was at the dentist.' },
      { de: 'Wohin stellen wir das Sofa? — Ins Wohnzimmer.', en: 'Where shall we put the sofa? — Into the living room.' },
    ],
  },
  {
    id: 'a1-perfekt',
    cefr_level: 'A1',
    title: 'Perfekt (Vergangenheit mit haben)',
    summary: 'Spoken past tense is formed with conjugated "haben" (or "sein") + Partizip II at the end.',
    rule: 'regelmäßig: ge + Stamm + -(e)t (geplant) | unregelmäßig: ge-...-en (gefunden)',
    examples: [
      { de: 'Peter und ich haben unsere Präsentation geplant.', en: 'Peter and I planned our presentation.' },
      { de: 'Er hat einen Job in München gefunden.', en: 'He found a job in Munich.' },
    ],
  },

  // A2 GRAMMAR NOTES
  {
    id: 'a2-nebensaetze-weil-dass-damit-wenn',
    cefr_level: 'A2',
    title: 'Nebensätze mit weil, dass, damit, ob & wenn',
    summary: 'Subordinating conjunctions push the conjugated verb to the very end of the clause.',
    rule: 'Nebensatz: [Konjunktion] + ... + [konjugiertes Verb am Ende] | Bei Modalverb: Infinitiv + Modalverb am Ende',
    examples: [
      { de: 'Lin braucht ein Handy, weil sie immer erreichbar sein muss.', en: 'Lin needs a mobile phone because she always has to be reachable.' },
      { de: 'Er macht einen Computerkurs, damit er bessere Berufschancen hat.', en: 'He is taking a computer course so that he has better job prospects.' },
      { de: 'Ich würde gern wissen, ob die Stelle noch frei ist.', en: 'I would like to know whether the position is still open.' },
    ],
  },
  {
    id: 'a2-verben-praepositionen',
    cefr_level: 'A2',
    title: 'Verben mit festen Präpositionen & wo(r)- / da(r)-',
    summary: 'Many German verbs pair with a fixed preposition + case; ask about things with "wo(r) + Präposition" and refer back with "da(r) + Präposition".',
    rule: 'sich interessieren für (+Akk) | warten auf (+Akk) | sich ärgern über (+Akk) | denken an (+Akk)',
    examples: [
      { de: 'Worüber sprichst du? — Über meine Probleme.', en: 'What are you talking about? — About my problems.' },
      { de: 'Ich habe nicht daran gedacht.', en: 'I did not think of it.' },
    ],
  },
  {
    id: 'a2-relativsaetze',
    cefr_level: 'A2',
    title: 'Relativsätze & Relativpronomen',
    summary: 'Relative clauses describe a noun in more detail; gender/number comes from the noun, and case comes from the relative clause.',
    rule: 'Nominativ: der/die/das/die | Dativ: dem/der/dem/denen (nach Präpositionen wie mit, zu)',
    examples: [
      { de: 'Kennen Sie ein Restaurant, das auch am Sonntag geöffnet hat?', en: 'Do you know a restaurant that is also open on Sunday?' },
      { de: 'Das sind die Freunde, zu denen ich oft fahre.', en: 'Those are the friends I often visit/drive to.' },
    ],
  },
  {
    id: 'a2-adjektiv-ordinal-doch',
    cefr_level: 'A2',
    title: 'Adjektivdeklination, Ordinalzahlen & Antwort "doch"',
    summary: 'Use "doch" to contradict a negative question; add "-en" after "am" for dates.',
    rule: 'Negative Frage → "doch" | Datum: am + Ordinalzahl + -en (am ersten Dezember)',
    examples: [
      { de: 'Hast du keinen Hunger? — Doch, ich möchte etwas essen.', en: 'Aren’t you hungry? — Yes (on the contrary), I’d like to eat something.' },
      { de: 'Wir treffen uns am ersten Dezember.', en: 'We are meeting on the first of December.' },
    ],
  },
];

export default function DeutschApp({
  initialWords,
  lessons,
  grammarQuestions,
}: {
  initialWords: Word[];
  lessons: Lesson[];
  grammarQuestions: GrammarQuestion[];
}) {
  const [words, setWords] = useState<Word[]>(initialWords);
  const [liveGrammarQuestions, setLiveGrammarQuestions] =
    useState<GrammarQuestion[]>(grammarQuestions);
  const [grammarError, setGrammarError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('ALL');
  const [selectedGrammarTopic, setSelectedGrammarTopic] = useState<string>('ALL');
  const [notesLevel, setNotesLevel] = useState<'ALL' | 'A1' | 'A2'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mode, setMode] = useState<
    | 'flashcards'
    | 'synonyms'
    | 'grammarNotes'
    | 'grammarQuiz'
    | 'articleQuiz'
    | 'meaningQuiz'
    | 'synonymQuiz'
    | 'add'
  >('flashcards');

  // Flashcard flip state
  const [flippedIds, setFlippedIds] = useState<Record<number, boolean>>({});
  const [showAllDetails, setShowAllDetails] = useState<boolean>(false);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  // Teacher "Add Word" form state
  const [lessonId, setLessonId] = useState<number>(lessons[0]?.id || 1);
  const [article, setArticle] = useState('der');
  const [germanWord, setGermanWord] = useState('');
  const [pluralForm, setPluralForm] = useState('');
  const [englishMeaning, setEnglishMeaning] = useState('');
  const [synonymsInput, setSynonymsInput] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  // Fetch latest grammar questions live on client load
  useEffect(() => {
    supabase
      .from('grammar_questions')
      .select('*')
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setGrammarError(error.message);
        } else if (data) {
          setLiveGrammarQuestions(data);
        }
      });
  }, []);

  // Native German Text-to-Speech (de-DE)
  const speakGerman = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/___/g, '...')
      .replace(/\s*\(.*?\)\s*/g, '')
      .trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  // Separate Core Vocabulary vs. Dedicated Synonym Entries
  const isSynonymEntry = (w: Word) =>
    Boolean(w.synonyms && w.synonyms.trim().length > 0);

  const coreVocabularyWords = words.filter((w) => !isSynonymEntry(w));
  const allSynonymWords = words.filter((w) => isSynonymEntry(w));

  const visibleLessons =
    selectedLevel === 'ALL'
      ? lessons
      : lessons.filter((l) => l.cefr_level === selectedLevel);

  const filteredCoreWords = coreVocabularyWords.filter((w) => {
    const matchesLevel =
      selectedLevel === 'ALL' || w.lessons?.cefr_level === selectedLevel;
    const matchesLesson =
      selectedLessonId === 'ALL' || String(w.lesson_id) === selectedLessonId;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      w.german_word.toLowerCase().includes(q) ||
      w.english_meaning.toLowerCase().includes(q) ||
      (w.example_sentence && w.example_sentence.toLowerCase().includes(q));
    return matchesLevel && matchesLesson && matchesSearch;
  });

  const filteredSynonymEntries = allSynonymWords.filter((w) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      !q ||
      w.german_word.toLowerCase().includes(q) ||
      (w.synonyms && w.synonyms.toLowerCase().includes(q)) ||
      w.english_meaning.toLowerCase().includes(q) ||
      (w.example_sentence && w.example_sentence.toLowerCase().includes(q))
    );
  });

  const visibleGrammarNotes = GRAMMAR_NOTES.filter((n) => {
    const matchesLvl = notesLevel === 'ALL' || n.cefr_level === notesLevel;
    const q = searchQuery.trim().toLowerCase();
    const matchesQ =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q) ||
      n.rule.toLowerCase().includes(q) ||
      n.examples.some(
        (ex) =>
          ex.de.toLowerCase().includes(q) || ex.en.toLowerCase().includes(q)
      );
    return matchesLvl && matchesQ;
  });

  const levelGrammarQuestions =
    selectedLevel === 'ALL'
      ? liveGrammarQuestions
      : liveGrammarQuestions.filter((g) => g.cefr_level === selectedLevel);

  const grammarTopics = Array.from(new Set(levelGrammarQuestions.map((g) => g.topic)));

  const filteredGrammarQuestions = levelGrammarQuestions.filter(
    (g) => selectedGrammarTopic === 'ALL' || g.topic === selectedGrammarTopic
  );

  const currentGrammarQuestion =
    filteredGrammarQuestions[quizIndex % (filteredGrammarQuestions.length || 1)];

  const nounQuizWords = filteredCoreWords.filter(
    (w) => w.article && ['der', 'die', 'das'].includes(w.article.toLowerCase())
  );
  const currentNounWord = nounQuizWords[quizIndex % (nounQuizWords.length || 1)];

  const currentMeaningWord =
    filteredCoreWords[quizIndex % (filteredCoreWords.length || 1)];

  const currentSynonymWord =
    allSynonymWords[quizIndex % (allSynonymWords.length || 1)];

  const getMeaningOptions = (target: Word | undefined) => {
    if (!target || coreVocabularyWords.length < 4) return [];
    const distractors: string[] = [];
    for (let i = 1; i <= coreVocabularyWords.length && distractors.length < 3; i++) {
      const candidate =
        coreVocabularyWords[(target.id * 7 + i * 13) % coreVocabularyWords.length];
      if (
        candidate.english_meaning !== target.english_meaning &&
        !distractors.includes(candidate.english_meaning)
      ) {
        distractors.push(candidate.english_meaning);
      }
    }
    const all = [target.english_meaning, ...distractors];
    return all.sort((a, b) => ((a.length + target.id) % 5) - ((b.length + target.id) % 5));
  };

  const getSynonymOptions = (target: Word | undefined) => {
    if (!target || !target.synonyms || allSynonymWords.length < 4) return [];
    const distractors: string[] = [];
    for (let i = 1; i <= allSynonymWords.length * 2 && distractors.length < 3; i++) {
      const candidate =
        allSynonymWords[(target.id * 5 + i * 11) % allSynonymWords.length];
      if (
        candidate.synonyms &&
        candidate.synonyms !== target.synonyms &&
        !distractors.includes(candidate.synonyms)
      ) {
        distractors.push(candidate.synonyms);
      }
    }
    const all = [target.synonyms, ...distractors];
    return all.sort((a, b) => ((a.length + target.id) % 5) - ((b.length + target.id) % 5));
  };

  const toggleFlip = (id: number) => {
    if (showAllDetails) return;
    setFlippedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleArticleAnswer = (guess: string) => {
    if (selectedAnswer || !currentNounWord) return;
    setSelectedAnswer(guess);
    setAnsweredCount((c) => c + 1);
    if (guess === currentNounWord.article?.toLowerCase()) {
      setScore((s) => s + 1);
    }
    speakGerman(`${currentNounWord.article} ${currentNounWord.german_word}`);
  };

  const handleMeaningAnswer = (guess: string) => {
    if (selectedAnswer || !currentMeaningWord) return;
    setSelectedAnswer(guess);
    setAnsweredCount((c) => c + 1);
    if (guess === currentMeaningWord.english_meaning) {
      setScore((s) => s + 1);
    }
    const spoken = currentMeaningWord.article
      ? `${currentMeaningWord.article} ${currentMeaningWord.german_word}`
      : currentMeaningWord.german_word;
    speakGerman(spoken);
  };

  const handleSynonymAnswer = (guess: string) => {
    if (selectedAnswer || !currentSynonymWord) return;
    setSelectedAnswer(guess);
    setAnsweredCount((c) => c + 1);
    if (guess === currentSynonymWord.synonyms) {
      setScore((s) => s + 1);
    }
    speakGerman(guess);
  };

  const handleGrammarAnswer = (guess: string) => {
    if (selectedAnswer || !currentGrammarQuestion) return;
    setSelectedAnswer(guess);
    setAnsweredCount((c) => c + 1);
    if (guess === currentGrammarQuestion.correct_answer) {
      setScore((s) => s + 1);
    }
    const completedSentence = currentGrammarQuestion.question_text.replace(
      '___',
      currentGrammarQuestion.correct_answer
    );
    speakGerman(completedSentence);
  };

  const nextQuizCard = () => {
    setSelectedAnswer(null);
    setQuizIndex((i) => i + 1);
  };

  const resetQuiz = (
    newMode: 'articleQuiz' | 'meaningQuiz' | 'synonymQuiz' | 'grammarQuiz'
  ) => {
    setMode(newMode);
    setSelectedAnswer(null);
    setQuizIndex(0);
    setScore(0);
    setAnsweredCount(0);
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!germanWord.trim() || !englishMeaning.trim()) return;

    setSaving(true);
    setFormMessage(null);

    const { data, error } = await supabase
      .from('vocabulary')
      .insert([
        {
          lesson_id: Number(lessonId),
          german_word: germanWord.trim(),
          article: article === 'none' ? null : article,
          plural_form: pluralForm.trim() || null,
          english_meaning: englishMeaning.trim(),
          synonyms: synonymsInput.trim() || null,
          example_sentence: exampleSentence.trim() || null,
        },
      ])
      .select('*, lessons(cefr_level, title)')
      .single();

    setSaving(false);

    if (error) {
      setFormMessage(`Error: ${error.message}`);
      return;
    }

    if (data) {
      setWords((prev) => [...prev, data]);
      setGermanWord('');
      setPluralForm('');
      setEnglishMeaning('');
      setSynonymsInput('');
      setExampleSentence('');
      setFormMessage(
        data.synonyms
          ? `Added "${data.german_word}" to the Synonyme page!`
          : `Added "${data.german_word}" to the Vocabulary Deck!`
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                CEFR A1 – B1 • {coreVocabularyWords.length} Vocabulary • {allSynonymWords.length} Synonyme • {liveGrammarQuestions.length} Grammar
              </span>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Deutsch Lern-App
              </h1>
            </div>

            {/* Mode Switcher */}
            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-200/80 p-1 text-xs sm:text-sm font-medium">
              <button
                onClick={() => {
                  setMode('flashcards');
                  setSearchQuery('');
                }}
                className={`rounded-lg px-3 py-2 transition ${
                  mode === 'flashcards'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vocabulary ({coreVocabularyWords.length})
              </button>
              <button
                onClick={() => {
                  setMode('synonyms');
                  setSearchQuery('');
                }}
                className={`rounded-lg px-3 py-2 transition ${
                  mode === 'synonyms'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Synonyme ({allSynonymWords.length})
              </button>
              <button
                onClick={() => {
                  setMode('grammarNotes');
                  setSearchQuery('');
                }}
                className={`rounded-lg px-3 py-2 transition ${
                  mode === 'grammarNotes'
                    ? 'bg-white text-amber-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grammar Notes ({GRAMMAR_NOTES.length})
              </button>
              <button
                onClick={() => resetQuiz('grammarQuiz')}
                className={`rounded-lg px-3 py-2 transition ${
                  mode === 'grammarQuiz'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grammar Test ({filteredGrammarQuestions.length})
              </button>
              <button
                onClick={() => resetQuiz('articleQuiz')}
                className={`rounded-lg px-3 py-2 transition ${
                  mode === 'articleQuiz'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Article Quiz ({nounQuizWords.length})
              </button>
              <button
                onClick={() => resetQuiz('meaningQuiz')}
                className={`rounded-lg px-3 py-2 transition ${
                  mode === 'meaningQuiz'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Meaning Quiz ({filteredCoreWords.length})
              </button>
              <button
                onClick={() => resetQuiz('synonymQuiz')}
                className={`rounded-lg px-3 py-2 transition ${
                  mode === 'synonymQuiz'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Synonym Quiz ({allSynonymWords.length})
              </button>
              <button
                onClick={() => setMode('add')}
                className={`rounded-lg px-3 py-2 transition ${
                  mode === 'add'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Add Word
              </button>
            </div>
          </div>

          {/* Filters & Search Bar */}
          {mode !== 'add' && mode !== 'grammarNotes' && (
            <div className="mt-6 space-y-3">
              {mode !== 'synonyms' && mode !== 'synonymQuiz' && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Level:
                    </span>
                    {['ALL', 'A1', 'A2', 'B1'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => {
                          setSelectedLevel(lvl);
                          setSelectedLessonId('ALL');
                          setSelectedGrammarTopic('ALL');
                          setQuizIndex(0);
                          setSelectedAnswer(null);
                        }}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                          selectedLevel === lvl
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {lvl === 'ALL' ? 'All (A1–B1)' : `CEFR ${lvl}`}
                      </button>
                    ))}
                  </div>

                  {mode === 'grammarQuiz' ? (
                    <select
                      value={selectedGrammarTopic}
                      onChange={(e) => {
                        setSelectedGrammarTopic(e.target.value);
                        setQuizIndex(0);
                        setSelectedAnswer(null);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      <option value="ALL">
                        All Grammar Topics ({levelGrammarQuestions.length} questions)
                      </option>
                      {grammarTopics.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedLessonId}
                      onChange={(e) => {
                        setSelectedLessonId(e.target.value);
                        setQuizIndex(0);
                        setSelectedAnswer(null);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      <option value="ALL">All Modules ({visibleLessons.length} lessons)</option>
                      {visibleLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.cefr_level}: {l.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {(mode === 'flashcards' || mode === 'synonyms') && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <input
                    type="text"
                    placeholder={
                      mode === 'synonyms'
                        ? 'Search German word, synonym, or English meaning...'
                        : 'Search German word, English meaning, or example...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm placeholder:text-slate-400"
                  />

                  <button
                    onClick={() => setShowAllDetails((v) => !v)}
                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {showAllDetails
                      ? 'Switch to Flip-Card Mode'
                      : 'Show Full Study Notes on All Cards'}
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* MODE: A1 & A2 GRAMMAR NOTES */}
        {mode === 'grammarNotes' && (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(['ALL', 'A1', 'A2'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setNotesLevel(lvl)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      notesLevel === lvl
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {lvl === 'ALL' ? 'All Notes (A1 & A2)' : `CEFR ${lvl} Notes`}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search grammar topic, rule, or example..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-5">
              {visibleGrammarNotes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                        note.cefr_level === 'A1'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      CEFR {note.cefr_level}
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    {note.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{note.summary}</p>

                  <div className="mt-4 rounded-xl bg-slate-900 px-4 py-3 font-mono text-xs text-amber-200">
                    {note.rule}
                  </div>

                  <div className="mt-4 space-y-2">
                    {note.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{ex.de}</p>
                          <p className="text-xs text-slate-500">{ex.en}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => speakGerman(ex.de)}
                          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                          🔊
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* MODE 1: CORE VOCABULARY DECK */}
        {mode === 'flashcards' && (
          <div>
            <p className="mb-4 text-sm text-slate-500">
              Showing <strong>{filteredCoreWords.length}</strong> core vocabulary entries. Click <strong>Listen</strong> for German audio, or tap a card to flip.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredCoreWords.map((item) => {
                const isFlipped = showAllDetails || !!flippedIds[item.id];
                const isVerb = !item.article;
                const spokenTerm = item.article
                  ? `${item.article} ${item.german_word}`
                  : item.german_word;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleFlip(item.id)}
                    className={`${
                      showAllDetails ? '' : 'cursor-pointer hover:-translate-y-0.5'
                    } select-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                        {item.lessons?.cefr_level || 'A1'} • {item.lessons?.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => speakGerman(spokenTerm, e)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        🔊 Listen
                      </button>
                    </div>

                    {(!isFlipped || showAllDetails) && (
                      <div className={showAllDetails ? 'mt-4' : 'py-5'}>
                        <h2 className="text-xl font-bold text-slate-900">
                          {item.article && (
                            <span className="mr-2 font-semibold text-blue-600">
                              {item.article}
                            </span>
                          )}
                          {item.german_word}
                        </h2>
                        {item.plural_form && (
                          <p className="mt-1 text-xs text-slate-500">
                            Plural: <span className="font-medium">die {item.plural_form}</span>
                          </p>
                        )}
                        {isVerb && (
                          <p className="mt-1 text-xs text-slate-400">Verb / Expression</p>
                        )}
                      </div>
                    )}

                    {isFlipped && (
                      <div className={showAllDetails ? 'mt-3 border-t border-slate-100 pt-3' : 'py-4'}>
                        <p className="text-lg font-bold text-emerald-700">
                          {item.english_meaning}
                        </p>
                        {item.example_sentence && (
                          <div className="mt-2 flex items-start justify-between gap-2 rounded-lg bg-slate-100 p-3 text-sm italic text-slate-700">
                            <span>“{item.example_sentence}”</span>
                            <button
                              type="button"
                              onClick={(e) => speakGerman(item.example_sentence!, e)}
                              className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold not-italic text-slate-600 shadow-xs hover:text-blue-700"
                            >
                              🔊
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 2: DEDICATED SYNONYME PAGE */}
        {mode === 'synonyms' && (
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-200 bg-purple-50/70 p-4">
              <div>
                <h2 className="text-base font-bold text-purple-950">
                  Deutsche Synonyme ({filteredSynonymEntries.length})
                </h2>
                <p className="text-xs text-purple-800">
                  All synonym clusters are stored here separately from your main Vocabulary Deck.
                </p>
              </div>
              <button
                onClick={() => resetQuiz('synonymQuiz')}
                className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-800"
              >
                Practice Synonym Quiz →
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {filteredSynonymEntries.map((item) => {
                const isFlipped = showAllDetails || !!flippedIds[item.id];
                const spokenTerm = item.article
                  ? `${item.article} ${item.german_word}`
                  : item.german_word;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleFlip(item.id)}
                    className={`${
                      showAllDetails ? '' : 'cursor-pointer hover:-translate-y-0.5'
                    } select-none rounded-2xl border border-purple-200/80 bg-white p-6 shadow-sm transition hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded-md bg-purple-100 px-2.5 py-0.5 font-semibold text-purple-800">
                        Synonyme
                      </span>
                      <button
                        type="button"
                        onClick={(e) => speakGerman(spokenTerm, e)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-purple-50 hover:text-purple-700"
                      >
                        🔊 Word
                      </button>
                    </div>

                    <div className="mt-4">
                      <h2 className="text-xl font-bold text-slate-900">
                        {item.article && (
                          <span className="mr-2 font-semibold text-blue-600">
                            {item.article}
                          </span>
                        )}
                        {item.german_word}
                      </h2>

                      {item.synonyms && (
                        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-purple-50 p-3">
                          <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-purple-600">
                              Synonyme
                            </span>
                            <span className="text-sm font-bold text-purple-950">
                              {item.synonyms}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => speakGerman(item.synonyms!, e)}
                            title="Listen to synonyms"
                            className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-purple-700 shadow-xs hover:bg-purple-100"
                          >
                            🔊
                          </button>
                        </div>
                      )}
                    </div>

                    {isFlipped && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="text-base font-bold text-emerald-700">
                          {item.english_meaning}
                        </p>
                        {item.example_sentence && (
                          <div className="mt-2 flex items-start justify-between gap-2 rounded-lg bg-slate-100 p-3 text-sm italic text-slate-700">
                            <span>“{item.example_sentence}”</span>
                            <button
                              type="button"
                              onClick={(e) => speakGerman(item.example_sentence!, e)}
                              className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold not-italic text-slate-600 shadow-xs hover:text-purple-700"
                            >
                              🔊
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 3: GRAMMAR & PLACEMENT TEST */}
        {mode === 'grammarQuiz' && (
          <div className="mx-auto max-w-xl">
            {grammarError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <strong>Supabase Error:</strong> {grammarError}
              </div>
            )}

            <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Score: <strong>{score}</strong> / {answeredCount}
              </span>
              <span>
                Aufgabe {(quizIndex % (filteredGrammarQuestions.length || 1)) + 1} of{' '}
                {filteredGrammarQuestions.length}
              </span>
            </div>

            {currentGrammarQuestion ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {currentGrammarQuestion.cefr_level} • {currentGrammarQuestion.topic}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakGerman(currentGrammarQuestion.question_text)}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-amber-50"
                  >
                    🔊 Listen
                  </button>
                </div>

                <h2 className="my-6 text-lg sm:text-xl font-bold leading-relaxed text-slate-900">
                  {currentGrammarQuestion.question_text}
                </h2>

                <div className="space-y-2.5">
                  {currentGrammarQuestion.options.map((option, idx) => {
                    const letter = ['A', 'B', 'C', 'D'][idx] || '';
                    const isCorrect = option === currentGrammarQuestion.correct_answer;
                    let btnStyle =
                      'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100';

                    if (selectedAnswer) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-600 bg-emerald-600 text-white';
                      } else if (option === selectedAnswer) {
                        btnStyle = 'border-red-500 bg-red-500 text-white';
                      } else {
                        btnStyle = 'border-slate-200 bg-slate-50 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleGrammarAnswer(option)}
                        disabled={!!selectedAnswer}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${btnStyle}`}
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-black/10 text-xs font-bold">
                          {letter}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <p className="text-sm font-bold">
                      {selectedAnswer === currentGrammarQuestion.correct_answer ? (
                        <span className="text-emerald-700">Richtig!</span>
                      ) : (
                        <span className="text-red-600">
                          Nicht ganz — richtig ist:{' '}
                          <strong>{currentGrammarQuestion.correct_answer}</strong>
                        </span>
                      )}
                    </p>
                    {currentGrammarQuestion.explanation && (
                      <p className="mt-2 rounded-lg bg-amber-50/70 p-3 text-xs leading-relaxed text-slate-700">
                        <strong>Grammatik-Tipp:</strong> {currentGrammarQuestion.explanation}
                      </p>
                    )}
                    <button
                      onClick={nextQuizCard}
                      className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Nächste Aufgabe →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500">
                No grammar questions for this filter yet.
              </p>
            )}
          </div>
        )}

        {/* MODE 4: DER / DIE / DAS ARTICLE QUIZ */}
        {mode === 'articleQuiz' && (
          <div className="mx-auto max-w-lg">
            <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Score: <strong>{score}</strong> / {answeredCount}
              </span>
              <span>
                Noun {(quizIndex % (nounQuizWords.length || 1)) + 1} of {nounQuizWords.length}
              </span>
            </div>

            {currentNounWord ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {currentNounWord.lessons?.cefr_level} • {currentNounWord.english_meaning}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakGerman(currentNounWord.german_word)}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50"
                  >
                    🔊
                  </button>
                </div>

                <h2 className="my-8 text-4xl font-extrabold tracking-tight text-slate-900">
                  ___ {currentNounWord.german_word}
                </h2>

                <div className="grid grid-cols-3 gap-3">
                  {['der', 'die', 'das'].map((art) => {
                    const correctArt = currentNounWord.article?.toLowerCase();
                    let btnStyle =
                      'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100';

                    if (selectedAnswer) {
                      if (art === correctArt) {
                        btnStyle = 'border-emerald-600 bg-emerald-600 text-white';
                      } else if (art === selectedAnswer) {
                        btnStyle = 'border-red-500 bg-red-500 text-white';
                      } else {
                        btnStyle = 'border-slate-200 bg-slate-50 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={art}
                        onClick={() => handleArticleAnswer(art)}
                        disabled={!!selectedAnswer}
                        className={`rounded-xl border-2 py-3 text-lg font-bold transition ${btnStyle}`}
                      >
                        {art}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <p className="text-sm font-semibold">
                      {selectedAnswer === currentNounWord.article?.toLowerCase() ? (
                        <span className="text-emerald-700">
                          Richtig! ({currentNounWord.article} {currentNounWord.german_word})
                        </span>
                      ) : (
                        <span className="text-red-600">
                          Nicht ganz — richtig ist:{' '}
                          <strong>
                            {currentNounWord.article} {currentNounWord.german_word}
                          </strong>
                        </span>
                      )}
                    </p>
                    {currentNounWord.example_sentence && (
                      <p className="mt-2 text-xs italic text-slate-500">
                        “{currentNounWord.example_sentence}”
                      </p>
                    )}
                    <button
                      onClick={nextQuizCard}
                      className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Next Noun →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500">
                No nouns in this module. Switch to <strong>Meaning Quiz</strong> above!
              </p>
            )}
          </div>
        )}

        {/* MODE 5: MEANING & TRANSLATION QUIZ */}
        {mode === 'meaningQuiz' && (
          <div className="mx-auto max-w-lg">
            <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Score: <strong>{score}</strong> / {answeredCount}
              </span>
              <span>
                Question {(quizIndex % (filteredCoreWords.length || 1)) + 1} of{' '}
                {filteredCoreWords.length}
              </span>
            </div>

            {currentMeaningWord ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    {currentMeaningWord.lessons?.cefr_level} • {currentMeaningWord.lessons?.title}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      speakGerman(
                        currentMeaningWord.article
                          ? `${currentMeaningWord.article} ${currentMeaningWord.german_word}`
                          : currentMeaningWord.german_word
                      )
                    }
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50"
                  >
                    🔊
                  </button>
                </div>

                <h2 className="my-7 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {currentMeaningWord.article && (
                    <span className="mr-2 font-semibold text-blue-600">
                      {currentMeaningWord.article}
                    </span>
                  )}
                  {currentMeaningWord.german_word}
                </h2>

                <div className="space-y-2.5 text-left">
                  {getMeaningOptions(currentMeaningWord).map((option) => {
                    const isCorrect = option === currentMeaningWord.english_meaning;
                    let btnStyle =
                      'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100';

                    if (selectedAnswer) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-600 bg-emerald-600 text-white';
                      } else if (option === selectedAnswer) {
                        btnStyle = 'border-red-500 bg-red-500 text-white';
                      } else {
                        btnStyle = 'border-slate-200 bg-slate-50 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleMeaningAnswer(option)}
                        disabled={!!selectedAnswer}
                        className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${btnStyle}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    {currentMeaningWord.example_sentence && (
                      <p className="text-xs italic text-slate-600">
                        “{currentMeaningWord.example_sentence}”
                      </p>
                    )}
                    <button
                      onClick={nextQuizCard}
                      className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Next Question →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500">No entries available in this filter.</p>
            )}
          </div>
        )}

        {/* MODE 6: SYNONYM QUIZ */}
        {mode === 'synonymQuiz' && (
          <div className="mx-auto max-w-lg">
            <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Score: <strong>{score}</strong> / {answeredCount}
              </span>
              <span>
                Synonym {(quizIndex % (allSynonymWords.length || 1)) + 1} of{' '}
                {allSynonymWords.length}
              </span>
            </div>

            {currentSynonymWord ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2">
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                    Welches Synonym passt? ({currentSynonymWord.english_meaning})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      speakGerman(
                        currentSynonymWord.article
                          ? `${currentSynonymWord.article} ${currentSynonymWord.german_word}`
                          : currentSynonymWord.german_word
                      )
                    }
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-purple-50"
                  >
                    🔊
                  </button>
                </div>

                <h2 className="my-7 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {currentSynonymWord.article && (
                    <span className="mr-2 font-semibold text-blue-600">
                      {currentSynonymWord.article}
                    </span>
                  )}
                  {currentSynonymWord.german_word}
                </h2>

                <div className="space-y-2.5 text-left">
                  {getSynonymOptions(currentSynonymWord).map((option) => {
                    const isCorrect = option === currentSynonymWord.synonyms;
                    let btnStyle =
                      'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100';

                    if (selectedAnswer) {
                      if (isCorrect) {
                        btnStyle = 'border-purple-600 bg-purple-600 text-white';
                      } else if (option === selectedAnswer) {
                        btnStyle = 'border-red-500 bg-red-500 text-white';
                      } else {
                        btnStyle = 'border-slate-200 bg-slate-50 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleSynonymAnswer(option)}
                        disabled={!!selectedAnswer}
                        className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${btnStyle}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    {currentSynonymWord.example_sentence && (
                      <p className="text-xs italic text-slate-600">
                        “{currentSynonymWord.example_sentence}”
                      </p>
                    )}
                    <button
                      onClick={nextQuizCard}
                      className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Next Synonym →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500">No synonym entries found.</p>
            )}
          </div>
        )}

        {/* MODE 7: TEACHER FORM TO ADD NEW VOCABULARY OR SYNONYMS */}
        {mode === 'add' && (
          <form
            onSubmit={handleAddWord}
            className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Add New German Vocabulary or Synonyms
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              Entries with Synonyme automatically go to the <strong>Synonyme</strong> page; entries without Synonyme stay in the <strong>Vocabulary</strong> deck.
            </p>

            {formMessage && (
              <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                {formMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Lesson / CEFR Level
                </label>
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.cefr_level} — {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    Word Type / Article
                  </label>
                  <select
                    value={article}
                    onChange={(e) => setArticle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                  >
                    <option value="der">der (m)</option>
                    <option value="die">die (f)</option>
                    <option value="das">das (n)</option>
                    <option value="none">Verb / Adj / Phrase</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    German Word (or Verb + Forms) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. beginnen (begann • hat begonnen)"
                    value={germanWord}
                    onChange={(e) => setGermanWord(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    Plural Form (Nouns)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anfänge"
                    value={pluralForm}
                    onChange={(e) => setPluralForm(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    English Meaning *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. to start / begin"
                    value={englishMeaning}
                    onChange={(e) => setEnglishMeaning(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Synonyme (optional — routes to Synonyme page)
                </label>
                <input
                  type="text"
                  placeholder="e.g. anfangen, starten, eröffnen"
                  value={synonymsInput}
                  onChange={(e) => setSynonymsInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Example Sentence
                </label>
                <input
                  type="text"
                  placeholder="e.g. Der Unterricht beginnt morgen um acht Uhr."
                  value={exampleSentence}
                  onChange={(e) => setExampleSentence(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving to Supabase...' : 'Save Word to Database'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}