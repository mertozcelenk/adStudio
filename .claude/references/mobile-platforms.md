# Mobil Platformlar — Uygulama Kuralları

`spec.md → platform: app | both` olan projelerde **uygulama ekranları** (`data-platform="ios|android"`,
Figma'da `platform: ios|android`) için tek kaynak. Strategist, builder, ads-ux-designer, reviewer'lar ve
`tells.mjs` bu dosyaya atıf yapar; kurallar başka yerde tekrarlanmaz.
Kaynak: Apple Human Interface Guidelines, Material Design 3.

Mobil **web** kuralları (375px, dokunma 24/44, hover, güvenli alan, 100vh) burada değil:
`reviewer-checklist.md → q. Mobil Web`.

---

## 1. Spec alanları

| Alan | Değerler | Kaynak |
|---|---|---|
| `platform` | `web` · `app` · `both` | spec-intake |
| `app_platforms` | `[ios]` · `[android]` · `[ios, android]` | spec-intake (yalnızca app/both) |
| `tablet` | `true` · `false` | spec-intake (isteğe bağlı) |
| `icon_source` | `platform` · `shared:<set>` · `custom:<link>` | spec-intake (uygulama, ikon seti verilmediyse) |
| `component_source` | `kit` · `drawn` · `own` | ads-design-strategy (uygulama + Figma) |

Eski spec'lerde `platform: mobile` → ads-design-strategy bir kez "web mi, uygulama mı?" diye sorar ve alanı günceller.

## 2. Yapı platformun, marka açık katmanlarda

Navigasyon, kontroller, geri davranışı ve modal davranışı platformun kuralıdır (iOS HIG / Material 3).
Marka şu katmanlarda kendini gösterir:

- **Tint / accent rengi** — etkileşimli öğeleri tek renk taşır; süs görevi yoktur
- **Display fontu** — büyük başlıklar; gövde, etiket ve kontroller okunaklı iş fontu (SF Pro / Roboto veya markanın body fontu)
- **Hareketin karakteri** — mikro etkileşimler ve tek imza an (bkz. §7)
- **İçerik** — görsel, illüstrasyon, metin dili, boş durumlar

Stratejistin **Tez** ve **Kendi dünyası** satırları yalnızca bu katmanları tarif eder. VARIANCE yalnızca içerik
alanının kompozisyonunu etkiler; menü ve kontroller sabittir. Onboarding, splash ve paywall ekranlarında içerik
alanı daha serbesttir, butonlar ve navigasyon yine native kalır.

**Slop testi:** "Bu ekran telefonun geri kalanına alışkın bir kullanıcıya güven verir mi, yoksa 'web'den taşınmış'
gibi mi durur?" Kendi icadı menü, web tarzı buton, hover'a dayalı işlev, kapatılmış geri hareketi → **High**.

## 3. Ölçüler

| | iOS | Android |
|---|---|---|
| Dokunma alanı | **≥ 44×44 pt** | **≥ 48×48 dp**, öğeler arası **≥ 8 dp** |
| Cihaz çerçevesi (HTML / Figma) | 390×844 | 412×915 |
| Üst güvenli alan (durum çubuğu) | 47 pt | 24 dp |
| Alt güvenli alan | 34 pt (home indicator) | 24 dp (gezinme çubuğu) |
| Sekme / navigation bar öğe sayısı | 2–5 | 3–5 |

Görsel ikon küçük olabilir; ölçülen **dokunulan alandır** (padding dahil).
Yazı ölçeği adStudio'nun kendi ölçeğidir (caption ≥ 12, 4 katı önerisi) — platform yazı stillerine eşleme geliştiriciye bırakılır.

## 4. Renk rolleri ve tema

- `color_scheme` sorusunda uygulama için **"ikisi" önerilen seçenektir**. Tek tema seçilirse:
  > "Telefon koyu temadayken uygulama açık kalacak. Emin misin?" — karar kullanıcının.
- Token adları değişmez; her renk token'ına platform rolü notu eklenir (`$extensions.platform`):

Eşleme token adına değil **role** göre yapılır (token adları projeden projeye değişebilir):

| Semantik rol (örnek token) | iOS | Android (M3) |
|---|---|---|
| Varsayılan zemin (`color-bg-default`) | systemBackground | surface |
| Yükseltilmiş / ikincil yüzey (kart, sheet zemini) | secondarySystemBackground | surfaceContainer |
| Birincil metin (`color-text-primary`) | label | onSurface |
| İkincil metin | secondaryLabel | onSurfaceVariant |
| Ayraç / kenarlık | separator | outline |
| Accent / etkileşim (`color-accent`) | tint | primary |
| Accent üstündeki metin | — | onPrimary |
| Hata | systemRed | error |

Karşılığı olmayan token'lara not eklenmez (ör. marka illüstrasyon renkleri).

- Sistem zeminine eşlenen **zemin token'ları** (`color-bg-*`) saf `#FFFFFF` / `#000000` olabilir (iOS ve Android).
  Metin ve diğer renklerde saf beyaz/siyah yasağı sürer.
- Android Dynamic Color (duvar kâğıdından renk) kullanılmaz; her zaman marka renkleri.

## 5. Kontroller ve bileşen kaynağı

Yeniden icat edilmez (dikdörtgen + daireden "switch benzeri" → **High**):

| | iOS | Android (M3) |
|---|---|---|
| Ana navigasyon | Tab bar (bölümler, eylem değil) | Navigation bar (kompakt) · rail / drawer (geniş) |
| Hiyerarşi | Navigation stack, büyük başlık → kaydırınca inline | Top app bar |
| Geri | Sol üst "‹" + kenardan kaydırma (kapatılmaz) | Sistem geri hareketi / tuşu (ele geçirilmez) |
| Açma/kapama, seçim | Switch, segmented control, stepper, picker | Material switch, chip, Material picker |
| Onay / uyarı | Action sheet, alert | Material dialog |
| Geçici geri bildirim | Satır içi / banner | Snackbar |
| Alt görev | Sheet (aşağı kaydırınca kapanır) | Bottom sheet |
| Ayarlar | Inset grouped list | Liste + bölüm başlıkları |
| Ana eylem | Navigasyon çubuğunda buton | **Tek** FAB |
| Yüzey derinliği | Çubuk/sheet arkasında sistem materyali | Tonal elevation (gölge yerine ton) |

`component_source`:
- `kit` — builder Figma dosyasına eklenmiş Apple **iOS UI Kit** / Google **Material 3 Design Kit** bileşenlerini
  `search_design_system` ile bulur, instance olarak yerleştirir ve marka token'larıyla temalar.
  Kit dosyada yoksa durur ve kullanıcıya hatırlatır (sessizce çizime geçmez).
- `drawn` — builder bileşenleri platform ölçü ve davranışına uygun çizer (switch oranları, 44/48 satır, sheet tutamacı)
  ve component adını platform adıyla verir (`iOS/Switch`, `M3/FilledButton`).
- `own` — dosyadaki mevcut kütüphane kullanılır; §3 ölçüleri ve §2 davranışları yine kontrol edilir.

`icon_source`:
- `platform` — iOS → SF Symbols, Android → Material Symbols (SF Symbols yalnızca Apple platformlarında kullanılabilir)
- `shared:<set>` — iki platformda aynı set
- `custom:<link>` — kullanıcının seti

Liste bölüm başlıkları ("GENEL", "GİZLİLİK") eyebrow yasağından **muaftır**; ekran veya kart başlığının üstüne
konan süs etiket uygulamada da yasaktır.

## 6. iOS + Android birlikte (ortak tasarım + farklar)

Ekranlar bir kez tasarlanır. Aşağıdaki parçalar **iki versiyon component** olarak üretilir ve stratejist brief'inde
"Platform farkları" tablosu olarak listelenir:

| Parça | iOS | Android |
|---|---|---|
| Ana menü | Tab bar | Navigation bar (seçili sekmede hap vurgu) |
| Geri | "‹" + kenar kaydırma | Sistem geri |
| Silme / onay | Action sheet | Material dialog |
| Ana eylem | Üst sağ buton | FAB |
| Switch, seçiciler | iOS switch, tekerlek seçici | Material switch, takvim seçici |
| İkon / font | SF Symbols / SF Pro (`icon_source: platform` ise) | Material Symbols / Roboto |

Bir platformun kalıbını ötekine taşımak (Android'de iOS switch, iOS'ta FAB) → **High**.

## 7. Hareket

- Ekranlar arası geçiş **sistemin**: iOS push (sağdan kayma), sheet alttan yükselir, kapatma açılışın tersi;
  Android container transform, shared-axis, fade-through. Özel geçiş → **High**.
- Kaydırınca belirme / giriş animasyonu yok — içerik anında görünür → **Medium**.
- MOTION yalnızca **mikro etkileşim ve geri bildirim** miktarını belirler (beğeni, tamamlama, yükleme, boş durum, onboarding görselleri).
- Tek imza an "bir section'da" değil, **bir akışın kilit anında** (ör. görev tamamlandığında halkanın dolması); Tez'e bağlı.
- Elle yapılmış blur yok; bulanıklık yalnızca sistem materyali olarak.
- Reduce Motion / Remove animations açıkken imza an crossfade'e döner.

## 8. Uygulama ekranında geçerli olmayan web kuralları

"N/A — uygulama ekranı" yazılır:
`[marketing]` düzen kuralları (hero, nav ≤ 80px, logo duvarı, layout ailesi çeşitliliği, zigzag, bento, split-header),
3 eşit feature card, `[content]` okuma kuralları, scroll cue, 1280px CTA satır kayması, `data-page-kind` zorunluluğu,
web hareket bantları (section bazlı giriş, MOTION ≥ 7 blur/mask).

Geçerli kalanlar: em-dash, placeholder isim / dolgu kelime / mükemmel sayı, sahte ürün UI, emoji ikon, tutarlılık
kilitleri, kontrast, 4 katı, krem zemin, ışık halesi / ızgara / çizgili zemin, kalite kontrolleri.

## 9. HTML prototip (cihaz çerçevesi)

```html
<body class="ads-stage" data-platform="ios" data-page-kind="product">  <!-- sunum sahnesi: çerçevenin dışı -->
  <div class="device" style="--safe-top: 47px; --safe-bottom: 34px;">  <!-- Android: 24px / 24px -->
    <div class="status-bar" aria-hidden="true"></div>                  <!-- yükseklik var(--safe-top) -->
    <main class="screen">…</main>                                        <!-- içerik güvenli alanın içinde -->
    <nav class="tab-bar">…</nav>                                         <!-- padding-bottom: var(--safe-bottom) -->
  </div>
</body>
```

- `.device` genişliği 390px (iOS) / 412px (Android), yüksekliği 844px / 915px; masaüstünde ortalanır.
- Çerçevenin dışındaki sunum arka planı yalnızca `.ads-stage { … }` kuralında tanımlanır — token testi yalnızca bu
  kuralı muaf tutar. Uygulamanın kendi arka planı (`.device`, `.screen`) token'a bağlanır; `body` kuralına renk yazma.
- Uygulama prototiplerinde `font-size` değerleri `rem` ile yazılır (değerler adStudio ölçeğinde) — büyük yazı testi (%130) bunu gerektirir.
- Durum çubuğu ve home indicator alanlarına buton/link konmaz.
