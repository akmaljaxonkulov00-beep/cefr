'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import CreateMockPartPage from '../../create/page';

export default function EditMockPartPage() {
  const params = useParams();

  return <CreateMockPartPage />;
}
