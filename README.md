# FrostNav Wiki

Docusaurus ile yazılan kurulum ve kullanım rehberi. Yayın adresi: https://wiki.frostnav.com
Yönetim paneli: https://wiki.frostnav.com/admin

## Düzenleyiciler için

1. https://wiki.frostnav.com/admin adresine gidin ve **GitHub ile giriş yapın**. Herhangi bir GitHub hesabı yeterlidir; repoya eklenmeniz gerekmez.
   İlk girişte panel bu reponun bir kopyasını (fork) hesabınızda oluşturmayı ister, onaylayın.
2. Soldan bölümü seçin (ör. "TR · Kullanım") ve sayfayı açın. Sitedeki her sayfanın altındaki **"Bu sayfayı düzenle"** bağlantısı da doğrudan buraya getirir.
3. Değişikliği yapın ve **Kaydet**'e basın. Değişiklik kendi kopyanızda taslak olarak kaydedilir; site değişmez.
4. **"İncelemeye gönder"**e basın. Bu, wiki'ye bir PR açar. Yayına alma kararı wiki sahibinindir; onaylanınca site birkaç dakika içinde güncellenir.

Kurallar:

- Bir sayfayı değiştirdiyseniz İngilizce karşılığını da güncelleyin (ya da sahibine not bırakın).
- `<Shot …/>`, `<VehicleFinder />` gibi bileşenler ve `import` satırları olan sayfaları yalnızca **Markdown** modunda düzenleyin. Görsel (rich text) mod bu satırları bozabilir.
- "Adres (slug)" alanı doluysa değiştirmeyin; bağlantılar kırılır.
- Görsel eklemek için içerikteki görsel düğmesini kullanın. Görseller `static/img/uploads/` altına kaydedilir.

## Geliştirme

```bash
npm install
npm start          # Türkçe (varsayılan dil)
npm run start:en   # İngilizce
npm run build      # build/ (TR) ve build/en/ (EN); kırık link ve çapa varsa hata verir
npm run preview    # build + Worker ile yerel önizleme (/admin ve /oauth dahil)
```

## İçerik

| Yer | Ne |
|---|---|
| `docs/` | Türkçe sayfalar |
| `i18n/en/docusaurus-plugin-content-docs/current/` | Aynı yollarla İngilizce sayfalar |
| `i18n/en/*.json` | Menü, kenar çubuğu ve footer çevirileri (`npx docusaurus write-translations --locale en`) |
| `assets/` | Sayfalarda `require('@site/assets/...')` ile kullanılan görseller |
| `static/img/` | Logo, favicon ve panelden yüklenen görseller (`uploads/`) |
| `src/components/Shot` | Dokunulacak yeri yanıp sönen noktayla gösteren ekran görüntüsü |
| `src/components/VehicleFinder` | "Aracınızın ekranı hangisine benziyor?" sihirbazı ve `ProductIdSteps` |
| `static/admin/` | Yönetim paneli (Decap CMS) ve ayarları |
| `worker/index.js` | Cloudflare Worker: statik siteyi sunar, `/oauth/*` ile panel girişini yapar |

Yeni sayfa eklerken TR ve EN dosyasını aynı yolda oluşturun. Menüdeki sıra `sidebar_position` ile belirlenir.

Sihirbazdaki metinler `installer.app` (VehicleFinder) ve `adbauth.web` (Customer_Pid_*) ile aynıdır; birinde değişiklik olursa diğerlerini de güncelleyin.

## Yayın

`main` dalına her birleştirmede GitHub Actions build alır ve Cloudflare'e yayınlar (`.github/workflows/deploy.yml`).
PR'larda yalnızca build alınır; kırık link varsa PR kırmızı olur.

Elle yayın: `npm run deploy`.

## Bir kerelik kurulum

1. **GitHub OAuth App** (Settings → Developer settings → OAuth Apps):
   Homepage `https://wiki.frostnav.com`, callback `https://wiki.frostnav.com/oauth/callback`.
2. Worker gizli değerleri:
   ```bash
   npx wrangler@4.166.0 secret put GITHUB_CLIENT_ID
   npx wrangler@4.166.0 secret put GITHUB_CLIENT_SECRET
   ```
3. Repo gizli değerleri (Settings → Secrets → Actions): `CLOUDFLARE_API_TOKEN` (Workers düzenleme yetkili), `CLOUDFLARE_ACCOUNT_ID`.
4. `main` dalı koruması: PR zorunlu, **Require review from Code Owners** açık, `build` kontrolü zorunlu (repo açık olduğu için ücretsiz).
5. Düzenleyicileri repoya eklemeye gerek yok: panel "open authoring" modunda, herkes kendi fork'undan PR açar.
   Yalnızca sahip birleştirir. Repoya Write rolüyle kimseyi eklemeyin; eklenen kişi korumayı aşamaz ama fork yerine doğrudan dal açar.
