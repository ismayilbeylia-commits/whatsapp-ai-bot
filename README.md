# WhatsApp AI Bot — Qurulum Təlimatı

Bu bot WhatsApp-a yazan insanlarla Claude AI vasitəsilə avtomatik danışır.

## Lazım olanlar
- Meta (Facebook) developer hesabı — pulsuz
- Anthropic API açarı — [console.anthropic.com](https://console.anthropic.com)
- Kod işlədəcək bir hostinq (Render, Railway, Fly.io — hamısında pulsuz tier var)

## 1-ci addım: Meta tərəfi
1. [developers.facebook.com](https://developers.facebook.com) saytında hesab aç
2. "Create App" → "Business" tipini seç
3. App-a **WhatsApp** məhsulunu əlavə et
4. "API Setup" səhifəsindən bunları götür:
   - **Temporary access token** (24 saatlıqdır, sonra System User token yaratmaq lazımdır)
   - **Phone number ID**
5. Test üçün Meta sənə pulsuz bir test nömrəsi verir — öz nömrənlə (səninlə yazışacaq insanların nömrəsini) "to" siyahısına əlavə etməlisən (test rejimində məhdudiyyət var, canlıya keçəndə Business Verification lazımdır)

## 2-ci addım: Kodu hazırla
```bash
npm install
cp .env.example .env
```
`.env` faylını aç və öz məlumatlarını yaz (token, phone number id, Anthropic key).

## 3-cü addım: Yerli test (opsional)
```bash
npm start
```
Server `localhost:3000`-də işə düşəcək. Meta-nın webhook-u internetə açıq URL tələb etdiyi üçün yerli testdə `ngrok` kimi bir alətlə tunel açmaq lazımdır:
```bash
ngrok http 3000
```

## 4-cü addım: Hostinq et (canlıya çıxar)
Render.com kimi bir xidmətə bu qovluğu yüklə (GitHub-a push edib Render-ə qoşmaq ən asanıdır):
1. Render-də "New Web Service" yarat
2. GitHub reponu bağla
3. Environment Variables bölməsinə `.env` faylındakı hər dəyəri əlavə et
4. Deploy et — sənə bir URL veriləcək, məs: `https://sənin-appın.onrender.com`

## 5-ci addım: Webhook-u Meta-ya bağla
Meta developer panelində "WhatsApp" → "Configuration" bölməsində:
- **Callback URL**: `https://sənin-appın.onrender.com/webhook`
- **Verify Token**: `.env`-də yazdığın `VERIFY_TOKEN` ilə eyni olmalıdır
- "Verify and Save" düyməsini bas
- "messages" webhook sahəsinə abunə ol

## Hazırdır!
İndi WhatsApp-da o test nömrəyə (və ya canlıya keçmisənsə öz biznes nömrənə) yazan hər kəsə Claude avtomatik cavab verəcək.

## Vacib qeydlər
- **SYSTEM_PROMPT** dəyişənini dəyişməklə AI-nin xarakterini, tonunu, hansı mövzularda danışacağını tam idarə edə bilərsən
- Test rejimində yalnız əvvəlcədən əlavə etdiyin nömrələr yaza bilər — hamı ilə işləməsi üçün Meta Business Verification lazımdır
- 24 saatlıq müvəqqəti token vaxtı bitəndə yenilənməlidir — daimi işləməsi üçün "System User" token yaratmaq tövsiyə olunur (Meta Business Settings-də)
- Söhbət tarixçəsi hazırda serverin yaddaşında saxlanılır (server yenidən başlayanda silinir) — uzunmüddətli yaddaş üçün verilənlər bazası (məs. Redis, PostgreSQL) əlavə etmək lazımdır
