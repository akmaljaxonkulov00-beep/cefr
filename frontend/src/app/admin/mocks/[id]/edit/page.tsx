'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import CreateMockPage from '../../create/page';

export default function EditMockPage() {
  const params = useParams();

  return <CreateMockPage />;
}
