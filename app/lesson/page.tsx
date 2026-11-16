import { Suspense } from 'react';
import LessonClient from '@/components/LessonClient';

// /lesson?id=u1l1 — the exercise player. useSearchParams requires a
// Suspense boundary for prerendered pages.
export default function LessonPage() {
  return (
    <Suspense fallback={<div className="lesson-stage" />}>
      <LessonClient />
    </Suspense>
  );
}
