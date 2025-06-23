import { SurveyForm } from '@/components/survey-form';

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
            Survey Kepuasan Masyarakat & Persepsi Anti Korupsi
          </h1>
          <p className="font-headline text-lg sm:text-xl text-foreground/80 mt-2">
            Pelayanan Haji Tahun 2025 M / 1446 H
          </p>
          <p className="text-muted-foreground mt-1">
            Kantor Kementerian Agama Kota Gorontalo
          </p>
        </header>
        <SurveyForm />
      </div>
    </main>
  );
}
