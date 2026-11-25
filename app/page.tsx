import { createClient } from '@supabase/supabase-js';
import DeutschApp from './DeutschApp';
export const instant = false;
export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const [{ data: words, error: wordsError }, { data: lessons }] = await Promise.all([
    supabase
      .from('vocabulary')
      .select('*, lessons(cefr_level, title)')
      .order('id', { ascending: true }),
    supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true }),
  ]);

  if (wordsError) {
    return (
      <main className="p-10 text-red-600">
        Error connecting to database: {wordsError.message}
      </main>
    );
  }

  return (
    <DeutschApp
      initialWords={words || []}
      lessons={lessons || []}
      grammarQuestions={[]}
    />
  );
}
