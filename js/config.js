// LaganiSanjal — Supabase connection
// The anon (public) key is safe to expose in a static site; access is
// controlled by Row Level Security in Supabase.
window.LAGANISANJAL_CONFIG = {
  SUPABASE_URL: 'https://iqzwvxarmpaixyydixjk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxend2eGFybXBhaXh5eWRpeGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMDk5MTgsImV4cCI6MjA5NTc4NTkxOH0.XciZAYDdCKNlaLb-8lSrJdfzfC33RIZDUYhmhZsVVYA',
  IMAGE_BUCKET: 'business-images',
  MAX_IMAGES: 8,
  MAX_IMAGE_MB: 5,
};

window.sb = window.supabase.createClient(
  window.LAGANISANJAL_CONFIG.SUPABASE_URL,
  window.LAGANISANJAL_CONFIG.SUPABASE_ANON_KEY
);
