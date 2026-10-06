const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.resolve(__dirname, '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const supabaseUrlMatch = envFile.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : null;
const supabaseKey = supabaseKeyMatch ? supabaseKeyMatch[1].trim() : null;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Clearing existing data...');
  await supabase.from('about_me').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Inserting About Me...');
  const { error: aboutError } = await supabase.from('about_me').insert({
    content: "Halo, saya Ahmad Rosyid Alfualdi, seorang Web Developer dan Data Scientist yang berdedikasi tinggi dalam merancang dan mengembangkan solusi teknologi yang inovatif. Memadukan keahlian dalam pengembangan aplikasi web modern (Next.js, React) dan analisis data berbasis machine learning (Python, R), saya antusias untuk menciptakan produk digital yang tidak hanya fungsional, tetapi juga memberikan dampak nyata.",
    skills: [
      { name: "Python", level: 5, category: "data" },
      { name: "R", level: 4, category: "data" },
      { name: "TypeScript", level: 5, category: "frontend" },
      { name: "Next.js", level: 5, category: "frontend" },
      { name: "React", level: 5, category: "frontend" },
      { name: "HTML", level: 5, category: "frontend" },
      { name: "CSS", level: 5, category: "frontend" },
      { name: "JavaScript", level: 5, category: "frontend" }
    ]
  });
  if (aboutError) console.error(aboutError);

  console.log('Inserting Contacts...');
  await supabase.from('contacts').insert([
    { type: 'phone', label: 'WhatsApp', value: '+6288292081326', order_index: 1, is_active: true },
    { type: 'instagram', label: 'Instagram', value: 'Zarsyd.Al', order_index: 2, is_active: true },
    { type: 'email', label: 'Email', value: 'ahmadrosyidalfualdi@gmail.com', order_index: 3, is_active: true },
    { type: 'github', label: 'GitHub', value: 'al-s999', order_index: 4, is_active: true },
    { type: 'linkedin', label: 'LinkedIn', value: 'ahmad-rosyid-al-fualdi-b04234354', order_index: 5, is_active: true }
  ]);

  console.log('Inserting Projects...');
  await supabase.from('projects').insert([
    {
      title: 'Phishing Email Classification',
      short_description: 'Prototipe model machine learning di Kaggle untuk mengklasifikasikan email phishing vs non-phishing.',
      description: 'Proyek ini adalah prototipe yang dibangun di Kaggle untuk mengklasifikasikan email sebagai phishing atau non-phishing menggunakan model yang telah di-fine-tune. Fokus utama proyek ini mencakup prapemrosesan data, ekstraksi fitur, dan pelatihan model menggunakan library Python seperti Pandas dan NumPy. Tujuannya adalah meningkatkan keamanan siber dengan mendeteksi pola email mencurigakan. Implementasi ini mendemonstrasikan pipeline machine learning end-to-end dari pembersihan data hingga evaluasi model.',
      tech_stack: ['Python', 'Pandas', 'NumPy', 'Machine Learning'],
      demo_url: 'https://www.kaggle.com/ahmadrosyidalfualdi/code',
      featured: true,
      order_index: 1
    },
    {
      title: 'Mental Health Assistant',
      short_description: 'Model AI percakapan yang di-fine-tune dari Gemini Flash untuk merespons pertanyaan seputar kesehatan mental.',
      description: 'Proyek ini adalah model AI prototipe yang dibuat di Kaggle menggunakan Python, dilatih ulang (retrained) dari model Gemini Flash dengan dataset dialog psikiater-pasien. Tujuan utamanya adalah mengembangkan asisten AI yang dapat merespons pertanyaan seputar kesehatan mental dengan empati. Proyek ini mendemonstrasikan teknik fine-tuning untuk AI percakapan (Conversational AI) agar lebih memahami konteks emosional dan memberikan balasan yang suportif.',
      tech_stack: ['Python', 'Gemini Flash', 'NLP', 'Fine-tuning'],
      demo_url: 'https://www.kaggle.com/ahmadrosyidalfualdi/code',
      featured: true,
      order_index: 2
    }
  ]);
  
  // Updating profile full_name if exists
  const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
  if (profiles && profiles.length > 0) {
    await supabase.from('profiles').update({ full_name: 'Ahmad Rosyid Alfualdi' }).eq('id', profiles[0].id);
  }

  console.log('Data successfully seeded!');
}

seed();
