
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function HasilPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl animate-in fade-in zoom-in-95">
        <CardHeader>
            <div className="mx-auto bg-green-100 rounded-full p-4 w-fit">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="font-headline text-3xl mt-4 text-primary">
                Survey Berhasil Dikirim!
            </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <p className="text-muted-foreground mb-8">
            Terima kasih telah berpartisipasi dalam Survey Kepuasan Masyarakat Pelayanan Haji dan Rekomendasi Paspor. Masukan Anda sangat berharga bagi kami untuk perbaikan layanan di masa mendatang.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/50 p-6 rounded-lg">
              <div className="text-center">
                  <h3 className="font-bold text-lg text-primary">Indeks Informasi Haji (IIH)</h3>
                  <p className="font-headline text-5xl font-bold text-primary my-2">88.50</p>
                  <p className="font-bold text-green-600">Sangat Baik</p>
              </div>
              <div className="text-center">
                  <h3 className="font-bold text-lg text-primary">Indeks Kepuasan Paspor (IKP)</h3>
                  <p className="font-headline text-5xl font-bold text-primary my-2">92.50</p>
                  <p className="font-bold text-green-600">Sangat Baik</p>
              </div>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            *Nilai indeks di atas adalah contoh. Perhitungan nyata akan diproses berdasarkan semua data responden yang terkumpul.
          </p>

          <Button asChild className="mt-8 w-full md:w-auto">
            <Link href="/">Isi Survey Lagi</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    