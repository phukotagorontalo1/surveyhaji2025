import { SurveyForm } from '@/components/survey-form';
import { DashboardDisplay } from '@/components/dashboard-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="text-center mb-8">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
            Survey Pelayanan Haji
          </h1>
          <p className="font-headline text-lg sm:text-xl text-foreground/80 mt-2">
            Tahun 2025 M / 1446 H
          </p>
          <p className="text-muted-foreground mt-1">
            Kantor Kementerian Agama Kota Gorontalo
          </p>
        </header>

        <Tabs defaultValue="survey" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="survey">Isi Survey</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard Hasil</TabsTrigger>
          </TabsList>
          <TabsContent value="survey" className="mt-6">
            <div className="mx-auto max-w-2xl">
              <SurveyForm />
            </div>
          </TabsContent>
          <TabsContent value="dashboard" className="mt-6">
            <DashboardDisplay />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
