import { redirect } from 'next/navigation';

export default async function ResultsHnPage({ params }: { params: Promise<{ hn: string }> }) {
    const { hn } = await params;
    redirect(`/test-status/${hn}`);
}
