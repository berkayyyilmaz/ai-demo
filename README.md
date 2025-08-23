# Google Gemini AI Demo

Bu proje, Google Gemini API kullanarak serverless bir AI sohbet uygulamasıdır. Backend gerektirmez ve Vercel gibi platformlarda kolayca deploy edilebilir.

## Kurulum

1. Projeyi klonlayın ve bağımlılıkları yükleyin:

```bash
npm install
```

2. Ortam değişkenlerini ayarlayın:

**Yerel geliştirme için `.env.local` dosyası oluşturun:**

```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-2.5-flash
```

**Vercel deployment için environment variables:**

- `GEMINI_API_KEY` - Google AI Studio'dan aldığınız API anahtarı
- `GEMINI_API_BASE_URL` - `https://generativelanguage.googleapis.com/v1beta`
- `GEMINI_MODEL` - `gemini-2.5-flash` (veya kullanmak istediğiniz model)

3. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

## Google API Anahtarı Alma

1. [Google AI Studio](https://aistudio.google.com/) adresine gidin
2. Ücretsiz API anahtarınızı oluşturun
3. API anahtarını ortam değişkenlerine ekleyin

## Kullanım

Uygulama, Google Gemini API'yi kullanarak doğal dil işleme sağlar. Kullanıcılar metin tabanlı sorular sorabilir ve AI'dan yanıtlar alabilir.

## Deployment

Vercel'e deploy etmek için:

1. GitHub repository'nizi Vercel'e bağlayın
2. Environment variables'ları Vercel dashboard'unda ayarlayın
3. Deploy edin

Diğer serverless platformlar da desteklenir (Netlify, Cloudflare Pages vb.)
