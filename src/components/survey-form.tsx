
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type FieldPath } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { 
  Check, Loader2, Info, BookOpen, Clock, Languages, Accessibility, Rss, Calendar,
  Presentation, Star, ShieldCheck, HandCoins, FileX2, UserX, PackageX, ShieldQuestion,
  Timer, Smile, MessagesSquare, MousePointerClick, Fingerprint, Users, Package, Bus
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth"

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
import { Progress } from "@/components/ui/progress"

const PEKERJAAN_OPTIONS = ["Pelajar/Mahasiswa", "PNS", "TNI/POLRI", "BUMN/BUMD", "Swasta", "Pedagang", "Tani/Nelayan", "Ibu Rumah Tangga", "Lainnya"];
const USIA_OPTIONS = ["18-20 tahun", "21-30 tahun", "31-40 tahun", "41-50 tahun", "51-60 tahun", "Di atas 60 tahun"];
const PENDIDIKAN_OPTIONS = ["Sekolah Dasar (SD)", "Sekolah Menengah Pertama (SMP)", "Sekolah Menengah Atas (SMA)", "Strata 1 (S1)", "Strata 2 (S2)", "Strata 3 (S3)"];

const KUALITAS_RATINGS = { 1: "Sangat Tidak Setuju", 2: "Tidak Setuju", 3: "Netral", 4: "Setuju", 5: "Sangat Setuju" };
const KEPUASAN_RATINGS = { 1: "Sangat Tidak Puas", 2: "Tidak Puas", 3: "Cukup Puas", 4: "Puas", 5: "Sangat Puas" };

const DEFAULT_QUESTIONS = {
    informasiHaji: {
        q1: 'Saya memahami urutan tahapan haji dalam negeri (administrasi, manasik, keberangkatan, dll) dengan jelas.',
        q2: 'Penjelasan mengenai tahapan haji disampaikan secara rinci dan terstruktur.',
        q3: 'Informasi tahapan haji disampaikan dengan bahasa yang mudah dimengerti.',
        q4: 'Informasi mengenai tahapan haji mudah diakses melalui berbagai media (cetak, digital, bimbingan).',
        q5: 'Petugas atau narasumber memberikan informasi yang cukup dan akurat terkait setiap tahapan.',
        q6: 'Informasi setiap tahapan disampaikan sesuai waktu yang dibutuhkan (tidak terlambat/tidak terlalu dini).',
        q7: 'Perubahan jadwal atau prosedur disampaikan dengan segera dan jelas.',
        q8: 'Media penyampaian informasi (aplikasi, media sosial, leaflet, bimbingan manasik) sangat membantu memahami tahapan.',
        q9: 'Bimbingan manasik efektif dalam menjelaskan setiap tahapan haji yang harus dijalani.',
        q10: 'Secara keseluruhan, saya puas terhadap penyampaian informasi mengenai tahapan haji dalam negeri.',
    },
    rekomendasiPaspor: {
        rp1: 'Seberapa puas Anda terhadap kejelasan informasi yang diberikan terkait proses penerbitan rekomendasi paspor?',
        rp2: 'Seberapa mudah proses pengajuan rekomendasi paspor yang Anda alami?',
        rp3: 'Seberapa cepat proses penerbitan rekomendasi paspor setelah Anda mengajukan permohonan?',
        rp4: 'Seberapa puas Anda terhadap sikap dan pelayanan petugas dalam proses penerbitan rekomendasi paspor?',
        rp5: 'Seberapa efektif komunikasi yang Anda terima terkait status permohonan rekomendasi paspor Anda?',
        rp6: 'Secara keseluruhan, seberapa puas Anda terhadap layanan penerbitan rekomendasi paspor?',
    },
    biovisa: {
        bv1: 'Seberapa jelas informasi yang Anda terima terkait proses perekaman sidik jari untuk biovisa?',
        bv2: 'Seberapa mudah proses pendaftaran atau antrean perekaman sidik jari?',
        bv3: 'Seberapa puas Anda terhadap fasilitas atau kenyamanan tempat perekaman sidik jari?',
        bv4: 'Seberapa profesional dan ramah petugas yang melayani perekaman sidik jari?',
        bv5: 'Seberapa puas Anda terhadap komunikasi atau notifikasi jadwal perekaman sidik jari?',
        bv6: 'Seberapa puas Anda terhadap keseluruhan layanan perekaman sidik jari untuk keperluan biovisa?',
    },
    penjemputanKoper: {
        pk1: 'Seberapa puas Anda terhadap ketepatan waktu penjemputan dan penyerahan koper jemaah?',
        pk2: 'Seberapa puas Anda terhadap kejelasan informasi mengenai jadwal dan lokasi penjemputan dan penyerahan koper?',
        pk3: 'Seberapa puas Anda terhadap kemudahan proses penyerahan koper kepada petugas?',
        pk4: 'Seberapa puas Anda terhadap sikap dan pelayanan petugas saat penjemputan dan penyerahan koper?',
        pk5: 'Seberapa puas Anda terhadap koordinasi antara petugas dan jemaah dalam proses penjemputan dan penyerahan koper?',
        pk6: 'Seberapa puas Anda secara keseluruhan terhadap layanan penjemputan dan penyerahan koper?',
    },
    mobilisasi: {
        mh1: "Seberapa puas Anda terhadap kejelasan informasi jadwal keberangkatan dan rute perjalanan?",
        mh2: "Seberapa puas Anda terhadap jumlah armada yang disediakan sesuai kebutuhan jumlah jemaah?",
        mh3: "Seberapa puas Anda terhadap keteraturan dan koordinasi saat proses naik-turun kendaraan?",
        mh4: "Seberapa puas Anda terhadap bantuan petugas selama proses mobilisasi jemaah?",
        mh5: "Seberapa puas Anda secara keseluruhan terhadap pelayanan mobilisasi dari Masjid Jami' ke Asrama Haji?"
    },
    perbaikan: {
        kebijakan: "Kebijakan pelayanan",
        sdm: "Profesionalisme SDM",
        sarpras: "Kualitas Sarana dan Prasarana",
        sistem: "Sistem informasi dan pelayanan publik",
        konsultasi: "Konsultasi dan pengaduan",
        pungli: "Penghilangan Praktik pungli",
        prosedur: "Penghilangan praktik diluar prosedur",
        calo: "Penghilangan praktik percaloan",
        tidak_ada: "Tidak ada yang perlu diperbaiki"
    }
};

const formSchema = z.object({
  nama: z.string().optional(),
  nomorHp: z.string().optional(),
  pekerjaan: z.string({ required_error: "Pekerjaan harus dipilih." }),
  usia: z.string({ required_error: "Usia harus dipilih." }),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"], { required_error: "Jenis kelamin harus dipilih." }),
  pendidikan: z.string({ required_error: "Pendidikan terakhir harus dipilih." }),
  informasiHaji: z.object({
    q1: z.number().min(1, "Penilaian wajib diisi").max(5), q2: z.number().min(1, "Penilaian wajib diisi").max(5), q3: z.number().min(1, "Penilaian wajib diisi").max(5), q4: z.number().min(1, "Penilaian wajib diisi").max(5),
    q5: z.number().min(1, "Penilaian wajib diisi").max(5), q6: z.number().min(1, "Penilaian wajib diisi").max(5), q7: z.number().min(1, "Penilaian wajib diisi").max(5), q8: z.number().min(1, "Penilaian wajib diisi").max(5),
    q9: z.number().min(1, "Penilaian wajib diisi").max(5), q10: z.number().min(1, "Penilaian wajib diisi").max(5),
  }),
  saranInformasiHaji: z.string().optional(),
  rekomendasiPaspor: z.object({
    rp1: z.number().min(1, "Penilaian wajib diisi").max(5), rp2: z.number().min(1, "Penilaian wajib diisi").max(5), rp3: z.number().min(1, "Penilaian wajib diisi").max(5),
    rp4: z.number().min(1, "Penilaian wajib diisi").max(5), rp5: z.number().min(1, "Penilaian wajib diisi").max(5), rp6: z.number().min(1, "Penilaian wajib diisi").max(5),
  }),
  saranRekomendasiPaspor: z.string().optional(),
  biovisa: z.object({
    bv1: z.number().min(1, "Penilaian wajib diisi").max(5), bv2: z.number().min(1, "Penilaian wajib diisi").max(5), bv3: z.number().min(1, "Penilaian wajib diisi").max(5),
    bv4: z.number().min(1, "Penilaian wajib diisi").max(5), bv5: z.number().min(1, "Penilaian wajib diisi").max(5), bv6: z.number().min(1, "Penilaian wajib diisi").max(5),
  }),
  saranBiovisa: z.string().optional(),
  penjemputanKoper: z.object({
    pk1: z.number().min(1, "Penilaian wajib diisi").max(5), pk2: z.number().min(1, "Penilaian wajib diisi").max(5), pk3: z.number().min(1, "Penilaian wajib diisi").max(5),
    pk4: z.number().min(1, "Penilaian wajib diisi").max(5), pk5: z.number().min(1, "Penilaian wajib diisi").max(5), pk6: z.number().min(1, "Penilaian wajib diisi").max(5),
  }),
  saranPenjemputanKoper: z.string().optional(),
  mobilisasi: z.object({
    mh1: z.number().min(1, "Penilaian wajib diisi").max(5), mh2: z.number().min(1, "Penilaian wajib diisi").max(5), mh3: z.number().min(1, "Penilaian wajib diisi").max(5),
    mh4: z.number().min(1, "Penilaian wajib diisi").max(5), mh5: z.number().min(1, "Penilaian wajib diisi").max(5),
  }),
  saranMobilisasi: z.string().optional(),
  tidakDiarahkan: z.boolean().refine(val => val === true, { message: "Anda harus menyetujui pernyataan ini." }),
  perbaikan: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Anda harus memilih setidaknya satu opsi.",
  }),
  tandaTangan: z.string().min(1, { message: "Tanda tangan digital diperlukan." }),
});

type FormSchemaType = z.infer<typeof formSchema>;

export function SurveyForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  const questionIcons: { [key: string]: React.ElementType } = {
      q1: Info, q2: BookOpen, q3: Languages, q4: Accessibility, q5: Rss,
      q6: Clock, q7: Calendar, q8: Presentation, q9: Presentation, q10: Star,
      rp1: Info, rp2: MousePointerClick, rp3: Timer, rp4: Smile, rp5: MessagesSquare, rp6: Star,
      bv1: Info, bv2: MousePointerClick, bv3: Accessibility, bv4: Smile, bv5: MessagesSquare, bv6: Star,
      pk1: Timer, pk2: Info, pk3: Package, pk4: Smile, pk5: Users, pk6: Star,
      mh1: Info, mh2: Bus, mh3: Users, mh4: Smile, mh5: Star,
  };
  
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      nomorHp: "",
      jenisKelamin: undefined,
      informasiHaji: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0, q10: 0 },
      saranInformasiHaji: "",
      rekomendasiPaspor: { rp1: 0, rp2: 0, rp3: 0, rp4: 0, rp5: 0, rp6: 0 },
      saranRekomendasiPaspor: "",
      biovisa: { bv1: 0, bv2: 0, bv3: 0, bv4: 0, bv5: 0, bv6: 0 },
      saranBiovisa: "",
      penjemputanKoper: { pk1: 0, pk2: 0, pk3: 0, pk4: 0, pk5: 0, pk6: 0 },
      saranPenjemputanKoper: "",
      mobilisasi: { mh1: 0, mh2: 0, mh3: 0, mh4: 0, mh5: 0 },
      saranMobilisasi: "",
      tidakDiarahkan: false,
      perbaikan: [],
      tandaTangan: "",
    },
  });
  
  const activeConfig = config || DEFAULT_QUESTIONS;

  useEffect(() => {
    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const configDoc = await getDoc(doc(db, "config", "questions"));
            if (configDoc.exists()) {
                const dbConfig = configDoc.data();
                // Deep merge with defaults to prevent partial data issues
                const mergedConfig = {
                    informasiHaji: { ...DEFAULT_QUESTIONS.informasiHaji, ...(dbConfig.informasiHaji || {}) },
                    rekomendasiPaspor: { ...DEFAULT_QUESTIONS.rekomendasiPaspor, ...(dbConfig.rekomendasiPaspor || {}) },
                    biovisa: { ...DEFAULT_QUESTIONS.biovisa, ...(dbConfig.biovisa || {}) },
                    penjemputanKoper: { ...DEFAULT_QUESTIONS.penjemputanKoper, ...(dbConfig.penjemputanKoper || {}) },
                    mobilisasi: { ...DEFAULT_QUESTIONS.mobilisasi, ...(dbConfig.mobilisasi || {}) },
                    perbaikan: { ...DEFAULT_QUESTIONS.perbaikan, ...(dbConfig.perbaikan || {}) },
                };
                setConfig(mergedConfig);
            } else {
                setConfig(DEFAULT_QUESTIONS);
            }
        } catch (error) {
            console.error("Error fetching config:", error);
            setConfig(DEFAULT_QUESTIONS);
            toast({ variant: "destructive", title: "Gagal memuat konfigurasi.", description: "Menggunakan pertanyaan default." });
        } finally {
            setIsLoading(false);
        }
    };
    
    onAuthStateChanged(auth, (user: User | null) => {
        if (user) {
            fetchConfig();
        } else {
            signInAnonymously(auth).catch((error) => {
                console.error("Error signing in anonymously: ", error);
                if (error.code === 'auth/operation-not-allowed') {
                    toast({
                        variant: "destructive",
                        title: "Login Anonim Belum Diaktifkan",
                        description: "Mohon aktifkan metode login 'Anonymous' di Firebase Console > Authentication > Sign-in method.",
                    });
                } else {
                    toast({
                      variant: "destructive",
                      title: "Gagal Terhubung",
                      description: "Terjadi kesalahan koneksi. Mohon muat ulang halaman.",
                    });
                }
                setIsLoading(false);
            });
        }
    });
  }, [toast]);

  const informasiHajiQuestions = useMemo(() => {
    if (!activeConfig?.informasiHaji) return {};
    return {
        "A. Kejelasan Informasi Tahapan Haji": [
            { id: 'q1', label: activeConfig.informasiHaji.q1, ratings: KUALITAS_RATINGS },
            { id: 'q2', label: activeConfig.informasiHaji.q2, ratings: KUALITAS_RATINGS },
            { id: 'q3', label: activeConfig.informasiHaji.q3, ratings: KUALITAS_RATINGS },
        ],
        "B. Ketersediaan dan Akses Informasi": [
            { id: 'q4', label: activeConfig.informasiHaji.q4, ratings: KUALITAS_RATINGS },
            { id: 'q5', label: activeConfig.informasiHaji.q5, ratings: KUALITAS_RATINGS },
        ],
        "C. Waktu Penyampaian Informasi": [
            { id: 'q6', label: activeConfig.informasiHaji.q6, ratings: KUALITAS_RATINGS },
            { id: 'q7', label: activeConfig.informasiHaji.q7, ratings: KUALITAS_RATINGS },
        ],
        "D. Efektivitas Media dan Bimbingan": [
            { id: 'q8', label: activeConfig.informasiHaji.q8, ratings: KUALITAS_RATINGS },
            { id: 'q9', label: activeConfig.informasiHaji.q9, ratings: KUALITAS_RATINGS },
        ],
        "E. Kepuasan Umum": [
            { id: 'q10', label: activeConfig.informasiHaji.q10, ratings: KUALITAS_RATINGS },
        ],
    };
  }, [activeConfig]);

  const rekomendasiPasporQuestions = useMemo(() => {
      if (!activeConfig?.rekomendasiPaspor) return [];
      return Object.entries(activeConfig.rekomendasiPaspor).map(([id, label]) => ({ 
          id, 
          label: label as string, 
          ratings: KEPUASAN_RATINGS
      }));
  }, [activeConfig]);
  
  const biovisaQuestions = useMemo(() => {
      if (!activeConfig?.biovisa) return [];
      return Object.entries(activeConfig.biovisa).map(([id, label]) => ({ 
          id, 
          label: label as string, 
          ratings: KEPUASAN_RATINGS
      }));
  }, [activeConfig]);

  const penjemputanKoperQuestions = useMemo(() => {
      if (!activeConfig?.penjemputanKoper) return [];
      return Object.entries(activeConfig.penjemputanKoper).map(([id, label]) => ({ 
          id, 
          label: label as string, 
          ratings: KEPUASAN_RATINGS
      }));
  }, [activeConfig]);

  const mobilisasiQuestions = useMemo(() => {
      if (!activeConfig?.mobilisasi) return [];
      return Object.entries(activeConfig.mobilisasi).map(([id, label]) => ({ 
          id, 
          label: label as string, 
          ratings: KEPUASAN_RATINGS
      }));
  }, [activeConfig]);

  const perbaikanItems = useMemo(() => {
    if (!activeConfig?.perbaikan) return [];
    const allItems = Object.entries(activeConfig.perbaikan).map(([id, label]) => ({ id, label: label as string }));
    const tidakAdaItem = allItems.find(item => item.id === 'tidak_ada');
    const otherItems = allItems.filter(item => item.id !== 'tidak_ada');
    return tidakAdaItem ? [...otherItems, tidakAdaItem] : otherItems;
  }, [activeConfig]);
  
  const handleNextStep = async () => {
    let fieldsToValidate: FieldPath<FormSchemaType>[] = [];
    switch(currentStep) {
        case 1: fieldsToValidate = ['pekerjaan', 'usia', 'jenisKelamin', 'pendidikan']; break;
        case 2: fieldsToValidate = Object.keys(form.getValues().informasiHaji).map(k => `informasiHaji.${k}` as FieldPath<FormSchemaType>); break;
        case 3: fieldsToValidate = Object.keys(form.getValues().rekomendasiPaspor).map(k => `rekomendasiPaspor.${k}` as FieldPath<FormSchemaType>); break;
        case 4: fieldsToValidate = Object.keys(form.getValues().biovisa).map(k => `biovisa.${k}` as FieldPath<FormSchemaType>); break;
        case 5: fieldsToValidate = Object.keys(form.getValues().penjemputanKoper).map(k => `penjemputanKoper.${k}` as FieldPath<FormSchemaType>); break;
        case 6: fieldsToValidate = Object.keys(form.getValues().mobilisasi).map(k => `mobilisasi.${k}` as FieldPath<FormSchemaType>); break;
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if(isValid) {
        setCurrentStep(prev => prev + 1);
    } else {
        toast({
            variant: "destructive",
            title: "Formulir Belum Lengkap",
            description: "Mohon isi semua pertanyaan yang wajib diisi pada bagian ini sebelum melanjutkan.",
        });
    }
  };

  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  async function onSubmit(values: FormSchemaType) {
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

    } catch (error: any) {
      console.error("Error adding document: ", error);
      if (error.code === 'permission-denied') {
        toast({
            variant: "destructive",
            title: "Izin Ditolak Firestore",
            description: "Gagal mengirim survei. Periksa aturan keamanan Firestore Anda.",
        });
      } else {
        toast({
            variant: "destructive",
            title: "Gagal Mengirim Survey",
            description: "Terjadi kesalahan. Mohon coba lagi.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
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
        <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
        {currentStep === 1 && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">I. Identitas Responden</CardTitle>
                    <CardDescription>Bagian {currentStep} dari {totalSteps}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="nama" render={({ field }) => (
                    <FormItem><FormLabel>Nama Lengkap (Opsional)</FormLabel><FormControl><Input placeholder="Masukkan nama lengkap Anda" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="nomorHp" render={({ field }) => (
                    <FormItem><FormLabel>Nomor HP (Opsional)</FormLabel><FormControl><Input type="tel" placeholder="Contoh: 081234567890" {...field} /></FormControl><FormMessage /></FormItem>
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
        )}
        
        {currentStep === 2 && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">II. Penyampaian Informasi Tahapan Haji dalam Negeri</CardTitle>
                    <CardDescription>
                    Berikan penilaian Anda terhadap penyampaian informasi haji di <strong className="font-semibold text-foreground/90">Tingkat Kemenag Kota Gorontalo</strong>.
                    Bagian {currentStep} dari {totalSteps}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-md space-y-2">
                        <p className="font-semibold text-foreground">Petunjuk:</p>
                        <p>Silakan beri penilaian terhadap pernyataan-pernyataan berikut dengan memilih salah satu dari skala:</p>
                        <ul className="list-decimal list-inside columns-2 sm:columns-3 md:columns-5 text-sm">
                            <li>Sangat Tidak Setuju</li>
                            <li>Tidak Setuju</li>
                            <li>Netral</li>
                            <li>Setuju</li>
                            <li>Sangat Setuju</li>
                        </ul>
                    </div>
                    {Object.entries(informasiHajiQuestions).map(([sectionTitle, questions]) => (
                        <div key={sectionTitle}>
                            <h3 className="font-semibold text-primary mb-4">{sectionTitle}</h3>
                            <div className="space-y-6">
                            {(questions as any[]).map((q) => {
                                const Icon = questionIcons[q.id];
                                return (
                                <FormField key={q.id} control={form.control} name={`informasiHaji.${q.id as 'q1'}`} render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="flex items-start gap-3">
                                        {Icon && <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />}
                                        <span>{q.label}</span>
                                    </FormLabel>
                                    <FormControl><StarRating value={field.value} onChange={field.onChange} labels={q.ratings} totalStars={5} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                                )
                            })}
                            </div>
                        </div>
                    ))}
                    <Separator />
                    <FormField control={form.control} name="saranInformasiHaji" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kolom Saran dan Masukan (Opsional)</FormLabel>
                            <FormControl><Textarea placeholder="Tuliskan saran, kritik, atau apresiasi Anda terkait penyampaian informasi haji di sini..." className="resize-y" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
        )}

        {currentStep === 3 && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">III. Penerbitan Rekomendasi Paspor</CardTitle>
                    <CardDescription>
                    Beri penilaian terhadap setiap pernyataan berikut sesuai dengan pengalaman Anda di <strong className="font-semibold text-foreground/90">Tingkat Kemenag Kota Gorontalo</strong>.
                    Bagian {currentStep} dari {totalSteps}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-md space-y-2">
                        <p className="font-semibold text-foreground">Petunjuk:</p>
                        <p>Gunakan skala berikut:</p>
                        <ul className="list-decimal list-inside columns-2 sm:columns-3 md:columns-5 text-sm">
                            <li>Sangat Tidak Puas</li>
                            <li>Tidak Puas</li>
                            <li>Cukup Puas</li>
                            <li>Puas</li>
                            <li>Sangat Puas</li>
                        </ul>
                    </div>
                    {rekomendasiPasporQuestions.map((q: any) => {
                    const Icon = questionIcons[q.id];
                    return (
                        <FormField key={q.id} control={form.control} name={`rekomendasiPaspor.${q.id as 'rp1'}`} render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-start gap-3">
                            {Icon && <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />}
                            <span>{q.label}</span>
                            </FormLabel>
                            <FormControl><StarRating value={field.value} onChange={field.onChange} labels={q.ratings} totalStars={5} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />
                    )
                    })}
                     <Separator />
                    <FormField control={form.control} name="saranRekomendasiPaspor" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Saran atau masukan untuk perbaikan layanan penerbitan rekomendasi paspor (Opsional)</FormLabel>
                            <FormControl><Textarea placeholder="Tuliskan saran Anda di sini..." className="resize-y" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
        )}
        
        {currentStep === 4 && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">IV. Perekaman Sidik Jari untuk Biovisa</CardTitle>
                    <CardDescription>
                        Beri penilaian terhadap setiap pernyataan berikut sesuai dengan pengalaman Anda di <strong className="font-semibold text-foreground/90">Tingkat Kemenag Kota Gorontalo</strong>.
                        Bagian {currentStep} dari {totalSteps}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-md space-y-2">
                        <p className="font-semibold text-foreground">Petunjuk:</p>
                        <p>Gunakan skala berikut:</p>
                        <ul className="list-decimal list-inside columns-2 sm:columns-3 md:columns-5 text-sm">
                            <li>Sangat Tidak Puas</li>
                            <li>Tidak Puas</li>
                            <li>Cukup Puas</li>
                            <li>Puas</li>
                            <li>Sangat Puas</li>
                        </ul>
                    </div>
                    {biovisaQuestions.map((q: any) => {
                        const Icon = questionIcons[q.id];
                        return (
                        <FormField key={q.id} control={form.control} name={`biovisa.${q.id as 'bv1'}`} render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-start gap-3">
                                {Icon && <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />}
                                <span>{q.label}</span>
                            </FormLabel>
                            <FormControl><StarRating value={field.value} onChange={field.onChange} labels={q.ratings} totalStars={5} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        )
                    })}
                    <Separator />
                    <FormField control={form.control} name="saranBiovisa" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Apakah ada saran atau masukan untuk perbaikan layanan perekaman sidik jari untuk biovisa? (Opsional)</FormLabel>
                            <FormControl><Textarea placeholder="Tuliskan saran Anda di sini..." className="resize-y" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
        )}

        {currentStep === 5 && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">V. Pelayanan Penjemputan dan Penyerahan Koper</CardTitle>
                    <CardDescription>
                        Beri penilaian terhadap setiap pernyataan berikut sesuai dengan pengalaman Anda di <strong className="font-semibold text-foreground/90">Tingkat Kemenag Kota Gorontalo</strong>.
                        Bagian {currentStep} dari {totalSteps}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-md space-y-2">
                        <p className="font-semibold text-foreground">Petunjuk:</p>
                        <p>Gunakan skala berikut:</p>
                        <ul className="list-decimal list-inside columns-2 sm:columns-3 md:columns-5 text-sm">
                            <li>Sangat Tidak Puas</li>
                            <li>Tidak Puas</li>
                            <li>Cukup Puas</li>
                            <li>Puas</li>
                            <li>Sangat Puas</li>
                        </ul>
                    </div>
                    {penjemputanKoperQuestions.map((q: any) => {
                        const Icon = questionIcons[q.id];
                        return (
                        <FormField key={q.id} control={form.control} name={`penjemputanKoper.${q.id as 'pk1'}`} render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-start gap-3">
                                {Icon && <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />}
                                <span>{q.label}</span>
                            </FormLabel>
                            <FormControl><StarRating value={field.value} onChange={field.onChange} labels={q.ratings} totalStars={5} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        )
                    })}
                    <Separator />
                    <FormField control={form.control} name="saranPenjemputanKoper" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Apakah ada saran atau masukan untuk perbaikan layanan penjemputan dan penyerahan koper? (Opsional)</FormLabel>
                            <FormControl><Textarea placeholder="Tuliskan saran Anda di sini..." className="resize-y" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
        )}

        {currentStep === 6 && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">VI. Mobilisasi ke Asrama Haji</CardTitle>
                    <CardDescription>
                        Beri penilaian terhadap setiap pernyataan berikut sesuai dengan pengalaman Anda di <strong className="font-semibold text-foreground/90">Tingkat Kemenag Kota Gorontalo</strong>.
                        Bagian {currentStep} dari {totalSteps}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-md space-y-2">
                        <p className="font-semibold text-foreground">Petunjuk:</p>
                        <p>Gunakan skala berikut:</p>
                        <ul className="list-decimal list-inside columns-2 sm:columns-3 md:columns-5 text-sm">
                            <li>Sangat Tidak Puas</li>
                            <li>Tidak Puas</li>
                            <li>Cukup Puas</li>
                            <li>Puas</li>
                            <li>Sangat Puas</li>
                        </ul>
                    </div>
                    {mobilisasiQuestions.map((q: any) => {
                        const Icon = questionIcons[q.id];
                        return (
                        <FormField key={q.id} control={form.control} name={`mobilisasi.${q.id as 'mh1'}`} render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-start gap-3">
                                {Icon && <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />}
                                <span>{q.label}</span>
                            </FormLabel>
                            <FormControl><StarRating value={field.value} onChange={field.onChange} labels={q.ratings} totalStars={5} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        )
                    })}
                    <Separator />
                    <FormField control={form.control} name="saranMobilisasi" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Apakah ada saran atau masukan untuk perbaikan layanan mobilisasi jemaah menuju asrama haji? (Opsional)</FormLabel>
                            <FormControl><Textarea placeholder="Tuliskan saran Anda di sini..." className="resize-y" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
        )}

        {currentStep === 7 && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">VII. Evaluasi dan Verifikasi</CardTitle>
                    <CardDescription>
                    Masukan Anda sangat berarti untuk perbaikan layanan kami di <strong className="font-semibold text-foreground/90">Tingkat Kemenag Kota Gorontalo</strong>.
                    Bagian {currentStep} dari {totalSteps}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="perbaikan"
                        render={() => (
                            <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Menurut Anda, apa yang perlu diperbaiki dari layanan kami?</FormLabel>
                                <FormDescription>Boleh pilih lebih dari satu.</FormDescription>
                            </div>
                            {perbaikanItems.map((item: any) => (
                                <FormField
                                key={item.id}
                                control={form.control}
                                name="perbaikan"
                                render={({ field }) => {
                                    return (
                                    <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 mb-2">
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) => {
                                                const currentValue = field.value || [];
                                                if (item.id === 'tidak_ada') {
                                                    return checked ? field.onChange(['tidak_ada']) : field.onChange([]);
                                                }
                                                if (checked) {
                                                    const newValues = currentValue.filter(v => v !== 'tidak_ada');
                                                    field.onChange([...newValues, item.id]);
                                                } else {
                                                    field.onChange(currentValue.filter((value) => value !== item.id));
                                                }
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">{item.label}</FormLabel>
                                    </FormItem>
                                    )
                                }}
                                />
                            ))}
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    
                    <Separator />
                    
                    <FormField control={form.control} name="tidakDiarahkan" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                            <FormLabel>Saya menyatakan bahwa pengisian survey ini tidak diarahkan oleh pegawai/pejabat manapun dan merupakan pendapat pribadi saya.</FormLabel>
                            <FormMessage />
                            </div>
                        </FormItem>
                    )} />
                    
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
        )}

        <div className="flex justify-between gap-4">
            {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevStep} className="w-1/3">
                    Kembali
                </Button>
            )}
            {currentStep < totalSteps && (
                <Button type="button" onClick={handleNextStep} className="w-full">
                    Lanjutkan
                </Button>
            )}
            {currentStep === totalSteps && (
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
                    ) : (
                        'Simpan dan Kirim Survey'
                    )}
                </Button>
            )}
        </div>
      </form>
    </Form>
  )
}
