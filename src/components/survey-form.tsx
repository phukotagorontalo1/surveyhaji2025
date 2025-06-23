"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { signInAnonymously } from "firebase/auth"

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
import { Skeleton } from "@/components/ui/skeleton"

const PEKERJAAN_OPTIONS = ["Pelajar/Mahasiswa", "PNS", "BUMN/BUMD", "Swasta", "Pedagang", "Tani/Nelayan", "Ibu Rumah Tangga", "Lainnya"];
const USIA_OPTIONS = ["18-20 tahun", "21-30 tahun", "31-40 tahun", "41-50 tahun", "51-60 tahun", "Di atas 60 tahun"];
const PENDIDIKAN_OPTIONS = ["Sekolah Dasar (SD)", "Sekolah Menengah Pertama (SMP)", "Sekolah Menengah Atas (SMA)", "Strata 1 (S1)", "Strata 2 (S2)", "Strata 3 (S3)"];

// Default ratings, can be overridden if needed in the future
const KUALITAS_RATINGS = { 1: "Sangat Sulit", 2: "Sulit", 3: "Cukup Mudah", 4: "Mudah", 5: "Sangat Mudah", 6: "Sempurna" };
const PENYIMPANGAN_RATINGS = { 1: "Selalu Ada", 2: "Sering Ada", 3: "Kadang Ada", 4: "Jarang Ada", 5: "Hampir Tdk Ada", 6: "Tidak Ada Sama Sekali" };
const KETERSEDIAAN_RATINGS = { 1: "Sangat Sulit", 2: "Sulit", 3: "Cukup Mudah", 4: "Mudah", 5: "Sangat Mudah", 6: "Sempurna" };

const formSchema = z.object({
  nama: z.string().optional(),
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
  const [isSigningIn, setIsSigningIn] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

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

  useEffect(() => {
    const authenticate = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error: any) {
        console.error("Error signing in anonymously: ", error);
        if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/admin-restricted-operation') {
            toast({
                variant: "destructive",
                title: "Login Anonim Belum Diaktifkan",
                description: "Mohon aktifkan metode login 'Anonymous' di Firebase Console > Authentication > Sign-in method.",
            });
        } else {
            toast({
              variant: "destructive",
              title: "Gagal Autentikasi",
              description: "Tidak dapat terhubung ke server. Mohon muat ulang halaman.",
            });
        }
      } finally {
        setIsSigningIn(false);
      }
    };

    const fetchConfig = async () => {
      setLoadingConfig(true);
      try {
        const configDoc = await getDoc(doc(db, "config", "questions"));
        if (configDoc.exists()) {
          setConfig(configDoc.data());
        } else {
          // This should ideally not happen if admin page initializes it
          toast({ variant: "destructive", title: "Konfigurasi survei tidak ditemukan." });
        }
      } catch (error) {
        console.error("Error fetching config:", error);
        toast({ variant: "destructive", title: "Gagal memuat konfigurasi survei." });
      } finally {
        setLoadingConfig(false);
      }
    };
    
    authenticate();
    fetchConfig();
  }, [toast]);
  
  const kualitasQuestions = useMemo(() => {
      if (!config) return [];
      return Object.entries(config.kualitas).map(([id, label]) => ({ id, label, ratings: KUALITAS_RATINGS }));
  }, [config]);

  const penyimpanganQuestions = useMemo(() => {
      if (!config) return [];
      // Special case for p5
      return Object.entries(config.penyimpangan).map(([id, label]) => ({ id, label, ratings: id === 'p5' ? KETERSEDIAAN_RATINGS : PENYIMPANGAN_RATINGS }));
  }, [config]);

  const perbaikanItems = useMemo(() => {
      if (!config) return [];
      return Object.entries(config.perbaikan).map(([id, label]) => ({ id, label }));
  }, [config]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "surveys"), {
        ...values,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Survey Terkirim!",
        description: "Terima kasih atas partisipasi Anda.",
        action: <div className="p-2 bg-green-500 text-white rounded-full"><Check /></div>
      });
      
      router.push("/hasil");

    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        variant: "destructive",
        title: "Gagal Mengirim Survey",
        description: "Terjadi kesalahan. Mohon coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingConfig) {
      return (
          <div className="space-y-8">
              <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
              <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>
              <Button className="w-full" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat Pertanyaan...</Button>
          </div>
      )
  }
  
  if (!config) {
      return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p>Konfigurasi survei tidak dapat dimuat. Silakan coba lagi nanti atau hubungi administrator.</p></CardContent></Card>
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
              <FormItem><FormLabel>Nama Lengkap (Opsional)</FormLabel><FormControl><Input placeholder="Masukkan nama lengkap Anda" {...field} /></FormControl><FormMessage /></FormItem>
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
            {kualitasQuestions.map((q: any, index: number) => (
              <FormField key={q.id} control={form.control} name={`kualitas.${q.id as 'q1'}`} render={({ field }) => (
                <FormItem>
                  <FormLabel>{index + 1}. {q.label}</FormLabel>
                  <FormControl><StarRating value={field.value} onChange={field.onChange} labels={q.ratings} /></FormControl>
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
            {penyimpanganQuestions.map((q: any, index: number) => (
              <FormField key={q.id} control={form.control} name={`penyimpangan.${q.id as 'p1'}`} render={({ field }) => (
                <FormItem>
                  <FormLabel>{index + 1}. {q.label}</FormLabel>
                  <FormControl><StarRating value={field.value} onChange={field.onChange} labels={q.ratings} /></FormControl>
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
                  {perbaikanItems.map((item: any) => (
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

        <Button type="submit" className="w-full" disabled={isSubmitting || isSigningIn}>
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
