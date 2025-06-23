"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { StarRating } from "@/components/star-rating"
import { SignaturePad } from "@/components/signature-pad"

const PEKERJAAN_OPTIONS = ["Pelajar/Mahasiswa", "PNS", "BUMN/BUMD", "Swasta", "Pedagang", "Tani/Nelayan", "Ibu Rumah Tangga", "Lainnya"];
const USIA_OPTIONS = ["18-20 tahun", "21-30 tahun", "31-40 tahun", "41-50 tahun", "51-60 tahun", "Di atas 60 tahun"];
const PENDIDIKAN_OPTIONS = ["Sekolah Dasar (SD)", "Sekolah Menengah Pertama (SMP)", "Sekolah Menengah Atas (SMA)", "Strata 1 (S1)", "Strata 2 (S2)", "Strata 3 (S3)"];

const KUALITAS_QUESTIONS = [
    { id: 'q1', label: 'Persyaratan pelayanan yang mudah dipahami.' },
    { id: 'q2', label: 'Prosedur pelayanan yang tidak berbelit-belit.' },
    { id: 'q3', label: 'Waktu penyelesaian pelayanan yang cepat dan tepat.' },
    { id: 'q4', label: 'Kewajaran biaya/tarif dalam pelayanan.' },
    { id: 'q5', label: 'Kualitas hasil pelayanan yang diberikan.' },
    { id: 'q6', label: 'Kompetensi dan profesionalisme petugas pelayanan.' },
    { id: 'q7', label: 'Sikap petugas pelayanan yang ramah dan sopan.' },
    { id: 'q8', label: 'Kualitas sarana dan prasarana pendukung pelayanan.' },
];

const PENYIMPANGAN_QUESTIONS = [
    { id: 'p1', label: 'Tidak adanya praktik pungutan liar (pungli) dalam pelayanan.' },
    { id: 'p2', label: 'Tidak adanya praktik di luar prosedur resmi yang merugikan.' },
    { id: 'p3', label: 'Tidak adanya praktik percaloan dalam pengurusan layanan.' },
    { id: 'p4', label: 'Tidak adanya gratifikasi atau pemberian imbalan kepada petugas.' },
    { id: 'p5', label: 'Ketersediaan dan kemudahan akses sistem pengaduan.' },
];

const PERBAIKAN_ITEMS = [
    { id: "kebijakan", label: "Kebijakan pelayanan" },
    { id: "sdm", label: "Profesionalisme SDM" },
    { id: "sarpras", label: "Kualitas Sarana dan Prasarana" },
    { id: "sistem", label: "Sistem informasi dan pelayanan publik" },
    { id: "konsultasi", label: "Konsultasi dan pengaduan" },
    { id: "pungli", label: "Penghilangan Praktik pungli" },
    { id: "prosedur", label: "Penghilangan praktik diluar prosedur" },
    { id: "calo", label: "Penghilangan praktik percaloan" },
] as const;

const formSchema = z.object({
  nama: z.string().min(2, { message: "Nama lengkap harus diisi." }),
  nomorHp: z.string().min(10, { message: "Nomor HP tidak valid." }),
  pekerjaan: z.string({ required_error: "Pekerjaan harus dipilih." }),
  usia: z.string({ required_error: "Usia harus dipilih." }),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"], { required_error: "Jenis kelamin harus dipilih." }),
  pendidikan: z.string({ required_error: "Pendidikan terakhir harus dipilih." }),
  kualitas: z.object({
    q1: z.number().min(1).max(6), q2: z.number().min(1).max(6), q3: z.number().min(1).max(6), q4: z.number().min(1).max(6),
    q5: z.number().min(1).max(6), q6: z.number().min(1).max(6), q7: z.number().min(1).max(6), q8: z.number().min(1).max(6),
  }),
  penyimpangan: z.object({
    p1: z.number().min(1).max(6), p2: z.number().min(1).max(6), p3: z.number().min(1).max(6),
    p4: z.number().min(1).max(6), p5: z.number().min(1).max(6),
  }),
  tidakDiarahkan: z.boolean().refine(val => val === true, { message: "Anda harus menyetujui pernyataan ini." }),
  perbaikan: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Anda harus memilih setidaknya satu opsi.",
  }),
  saran: z.string().optional(),
  tandaTangan: z.string().min(1, { message: "Tanda tangan digital diperlukan." }),
});

export function SurveyForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      nomorHp: "",
      jenisKelamin: undefined,
      kualitas: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0 },
      penyimpangan: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 },
      tidakDiarahkan: false,
      perbaikan: [],
      saran: "",
      tandaTangan: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Here you would typically send the data to your backend (e.g., Firebase)
    console.log(values);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Survey Terkirim!",
      description: "Terima kasih atas partisipasi Anda.",
      action: <div className="p-2 bg-green-500 text-white rounded-full"><Check /></div>
    });
    
    router.push("/hasil");
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">I. Identitas Responden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="nama" render={({ field }) => (
              <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input placeholder="Masukkan nama lengkap Anda" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="nomorHp" render={({ field }) => (
              <FormItem><FormLabel>Nomor HP</FormLabel><FormControl><Input type="tel" placeholder="Contoh: 081234567890" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="pekerjaan" render={({ field }) => (
              <FormItem><FormLabel>Pekerjaan</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Pilih pekerjaan" /></SelectTrigger></FormControl>
                <SelectContent>{PEKERJAAN_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="usia" render={({ field }) => (
              <FormItem><FormLabel>Usia</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                {USIA_OPTIONS.map(opt => <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value={opt} /></FormControl><FormLabel className="font-normal">{opt}</FormLabel>
                </FormItem>)}
              </RadioGroup></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="jenisKelamin" render={({ field }) => (
              <FormItem><FormLabel>Jenis Kelamin</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Laki-laki" /></FormControl><FormLabel className="font-normal">Laki-laki</FormLabel></FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Perempuan" /></FormControl><FormLabel className="font-normal">Perempuan</FormLabel></FormItem>
              </RadioGroup></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="pendidikan" render={({ field }) => (
              <FormItem><FormLabel>Pendidikan Terakhir</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                {PENDIDIKAN_OPTIONS.map(opt => <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value={opt} /></FormControl><FormLabel className="font-normal">{opt}</FormLabel>
                </FormItem>)}
              </RadioGroup></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">II. Kualitas Pelayanan</CardTitle>
            <CardDescription>Berikan penilaian Anda terhadap kualitas pelayanan haji yang telah diterima. Penilaian didasarkan pada pengalaman Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {KUALITAS_QUESTIONS.map((q, index) => (
              <FormField key={q.id} control={form.control} name={`kualitas.${q.id}`} render={({ field }) => (
                <FormItem>
                  <FormLabel>{index + 1}. {q.label}</FormLabel>
                  <FormControl><StarRating value={field.value} onChange={field.onChange} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">III. Perilaku Penyimpangan Pelayanan</CardTitle>
            <CardDescription>Berikan penilaian Anda mengenai ada atau tidaknya perilaku penyimpangan dalam pelayanan haji yang Anda alami.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {PENYIMPANGAN_QUESTIONS.map((q, index) => (
              <FormField key={q.id} control={form.control} name={`penyimpangan.${q.id}`} render={({ field }) => (
                <FormItem>
                  <FormLabel>{index + 1}. {q.label}</FormLabel>
                  <FormControl><StarRating value={field.value} onChange={field.onChange} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">IV. Evaluasi Perbaikan</CardTitle>
            <CardDescription>Masukan Anda sangat berarti untuk perbaikan layanan kami di masa mendatang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="tidakDiarahkan" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Saya menyatakan bahwa pengisian survey ini tidak diarahkan oleh pegawai/pejabat manapun dan merupakan pendapat pribadi saya.</FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )} />

            <FormField control={form.control} name="perbaikan" render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Menurut Anda, apa yang perlu diperbaiki dari layanan kami?</FormLabel>
                    <FormDescription>Boleh pilih lebih dari satu.</FormDescription>
                  </div>
                  {PERBAIKAN_ITEMS.map((item) => (
                    <FormField key={item.id} control={form.control} name="perbaikan"
                      render={({ field }) => {
                        return (
                          <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(field.value?.filter((value) => value !== item.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{item.label}</FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                   <FormField
                      control={form.control}
                      name="perbaikan"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                           <FormControl>
                            <Checkbox
                              checked={field.value?.includes("tidak_ada")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange(["tidak_ada"]);
                                } else {
                                  field.onChange([]);
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-accent-foreground">Tidak ada yang perlu diperbaiki</FormLabel>
                        </FormItem>
                      )}
                    />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField control={form.control} name="saran" render={({ field }) => (
                <FormItem>
                    <FormLabel>Saran Tambahan (Opsional)</FormLabel>
                    <FormControl><Textarea placeholder="Tuliskan saran, kritik, atau apresiasi Anda di sini..." className="resize-y" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <Separator />
            
            <FormField control={form.control} name="tandaTangan" render={({ field }) => (
                <FormItem>
                    <FormLabel>Tanda Tangan</FormLabel>
                    <FormDescription>Silakan bubuhkan tanda tangan Anda pada area di bawah ini sebagai bentuk verifikasi.</FormDescription>
                    <FormControl><SignaturePad onChange={field.onChange} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim Survey...
            </>
          ) : (
            'Simpan dan Kirim Survey'
          )}
        </Button>
      </form>
    </Form>
  )
}
