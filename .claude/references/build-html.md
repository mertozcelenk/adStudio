# Üretim — HTML çıktısı

`ads-design-builder` yalnızca **HTML** işinde bu dosyayı okur (Figma işinde `build-figma.md`). Kuralların kendisi ve
seviyeleri `references/rules.md`'dedir; bu dosya HTML/CSS'te nasıl uygulanacağını anlatır.

---

## Üretim

Her görev için self-contained bir HTML dosyası üret:

- Her component kendi dosyasında: `components/[katman]/[component-adı].html`
- Ekranlar: `screens/[ekran-adı].html`
- Token değerlerini CSS custom properties olarak tanımla (`--color-primary` vb.)
- Animasyon varsa yalnızca `transform` / `opacity` kullan
- Animasyon varsa `prefers-reduced-motion` guard ekle
- WCAG AA kontrast oranını koru (`color_scheme: both` ise her iki temada)

### Zorunlu: Koyu Tema (`color_scheme: both` veya `dark`)

`color_scheme: light` ise bu bölümü atla.

`both` ise semantic renk token'larını üç blokta tanımla — component CSS'i yalnızca
semantic değişkenleri kullanır, temaya göre ayrı kural yazmaz:

```css
:root {                                   /* açık tema (varsayılan) */
  --color-bg-default: #fafafa;
  --color-text-primary: #111111;
}
[data-theme="dark"] {                     /* elle seçilen koyu tema */
  --color-bg-default: #121212;
  --color-text-primary: #ededed;
}
@media (prefers-color-scheme: dark) {     /* sistem tercihi */
  :root:not([data-theme="light"]) {
    --color-bg-default: #121212;
    --color-text-primary: #ededed;
  }
}
```

- Açık değerler `$value`'dan, koyu değerler `$extensions.mode.dark`'tan gelir
  (`references/token-standards.md → Tema Modları`) — uydurma. Koyu değer eksikse Açık Sorular'a ekle.
- `dark` ise tek koyu set `:root` içinde tanımlanır.
- Sayfanın ortasında tek bir section'ı ters temaya çevirme — tema tüm sayfa için tektir.
- `index.html` sidebar'ına açık/koyu tema anahtarı ekle (`document.documentElement.dataset.theme`
  ayarlar ve iframe'deki sayfaya da iletir).

### Hareket Bantları (MOTION)

| MOTION | Uygula | Uygulama |
|---|---|---|
| 1-3 | Yalnızca durum geçişleri: hover, focus, açılma/kapanma, pressed | CSS `transition` |
| 4-6 | + **tek imza an** + yumuşak giriş (fade/translate), kademeli liste girişi | `IntersectionObserver` veya CSS |
| 7-10 | + scroll ile açılan / scroll'a bağlı bölümler, sabitlenen (sticky) anlatım; geçişlerde blur / mask / clip-path | CSS scroll-driven animations (`animation-timeline: view()`) veya `IntersectionObserver` |

**Tek imza an (MOTION ≥ 4):** Hareketi sayfanın **bir** önemli anında yoğunlaştır ve bu anı brief'teki
Tez'e bağla (ör. "laboratuvar raporu" tezi → içerik tablosu satır satır dolar). Geri kalan section'lar
sakin kalır: hover/focus ve gerekiyorsa kısa bir giriş.
- Aynı giriş animasyonu (aynı `animation-name` / aynı reveal sınıfı) **en fazla 2 section'da** kullanılır.
  Her section'a aynı fade-up koymak yasak.
- Kademeli giriş (stagger) yalnızca gerçekten liste olarak beliren öğelerde; toplam gecikme ≤ 400ms.
- İçerik **varsayılan olarak görünür**: başlangıç durumu `opacity: 0` / `visibility: hidden` olan bir
  reveal, JavaScript çalışmazsa içeriği gizli bırakır. Gizleme sınıfını JS ekler (`.js .reveal`),
  CSS'te varsayılan görünür kalır.

**Blur / mask / clip-path (yalnızca MOTION ≥ 7):** İmza anda geçiş malzemesi olarak kullanılabilir:
odak (modal açılırken arka planın 200ms içinde hafifçe bulanıklaşması), açılma (görselin maske ile
perde gibi belirmesi). Efekt alanı küçük ve sınırlı tutulur (tam ekran sürekli blur yok), yalnızca geçiş
sırasında çalışır ve `prefers-reduced-motion`'da kapanır. Duran süs amaçlı cam efekti (glassmorphism)
her MOTION değerinde yasaktır.

- `window.addEventListener('scroll', …)` kullanma.
- Her animasyon tek cümleyle gerekçelendirilebilmeli (hiyerarşi, geri bildirim, durum geçişi, anlatım) — süs için sonsuz döngü yok.
- MOTION ne olursa olsun `@media (prefers-reduced-motion: reduce)` altında animasyonları kapat veya yalnızca opacity'ye indir.

### Zorunlu: HTML Metadata

Her üretilen HTML dosyasının `<head>` bölümüne aşağıdakileri ekle:

```html
<!-- Designed by: adesso Turkey -->
<meta name="author" content="adesso Turkey">
```

**Kesinlikle yasak:**
- `generator`, `ai`, `claude`, `artificial intelligence`, `machine learning` içeren herhangi bir `<meta>` etiketi
- Yapay zeka kökenini ima eden her türlü HTML yorumu (`<!-- AI generated -->`, `<!-- Claude -->` vb.)
- `data-ai`, `data-generated`, `data-claude` gibi özel veri özelliği

### Zorunlu: Mobile-First CSS

Tüm CSS **mobile-first** yazılır — temel stiller 375px için geçerlidir,
büyük ekranlar `min-width` media query ile üzerine yazar:

```css
/* Temel — 375px ve üzeri */
.card { padding: 16px; flex-direction: column; }

/* Tablet — 768px ve üzeri */
@media (min-width: 768px) {
  .card { padding: 24px; }
}

/* Desktop — 1280px ve üzeri */
@media (min-width: 1280px) {
  .card { flex-direction: row; padding: 32px; }
}
```

**Kurallar:**
- `max-width` media query kullanma — yalnızca `min-width`
- Sabit `px` genişlik (`width: 800px`) kullanma — `max-width`, `%`, `clamp()` veya `min()` kullan
- Yatay overflow'a yol açan her element `overflow-x: hidden` veya `flex-wrap: wrap` alır
- Token JSON'da `Viewport` koleksiyonu varsa breakpoint değerlerini oradan oku;
  yoksa varsayılan: 375 / 768 / 1280px

**Mobil web kuralları (web ekranları):**
- Dokunulan her buton, ikon ve link en az **44×44px** tıklanabilir alana sahip (padding dahil); 24px altı kesinlikle yok.
  Paragraf içindeki metin linkleri muaf.
- Hiçbir işlev yalnızca `:hover` ile erişilebilir olmaz — hover'da beliren buton/menü dokunmayla da açılır
  veya varsayılan görünür. Süs amaçlı hover efekti serbest.
- Tam ekran bölümlerde `100vh` kullanma — `100svh` / `100dvh`.
- `viewport-fit=cover` kullanılıyorsa üst/alt sabit öğeler `env(safe-area-inset-*)` ile boşluk alır.

### Zorunlu: Uygulama Ekranı Çerçevesi (`data-platform="ios|android"`)

Uygulama ekranları web sayfası gibi değil, cihaz çerçevesinde üretilir — şablon ve ölçüler
`references/mobile-platforms.md → 9`:
- `<body class="ads-stage">`: çerçevenin dışındaki sunum arka planı yalnızca `.ads-stage` kuralında; uygulamanın kendi
  arka planı `.device` / `.screen` üzerinde ve token'a bağlı (token testi yalnızca `.ads-stage`'i muaf tutar).
- `.device` iOS 390×844 / Android 412×915, `--safe-top` / `--safe-bottom` değişkenleri, durum çubuğu ve
  home indicator alanlarına buton/link yok.
- `font-size` değerleri `rem` ile (değerler adStudio ölçeğinde) — büyük yazı (%130) testi bunu gerektirir.
- Sekme çubuğu iOS'ta 2–5, Android'de 3–5 öğe.
- Ekranlar arası geçiş, kaydırınca belirme ve giriş animasyonu yok; hareket yalnızca mikro etkileşim ve
  tek imza an (`mobile-platforms.md → 7`). Web "Hareket Bantları" bu ekranlarda uygulanmaz.

### Zorunlu: Token Bağlama — Hardcode Yasağı

Aşağıdaki değerleri **asla** hardcode etme; her zaman token değişkenini kullan:

| Özellik | Yasak | Doğru |
|---------|-------|-------|
| `font-size` | `10px`, `11px`, `12px` vb. herhangi bir px değeri | `var(--text-2xs)`, `var(--text-xs)` vb. |
| `font-family` | `"Inter"`, `"Cabin"` vb. | `var(--font-family-display)` / `var(--font-family-body)` |
| `color` | `#F9423A`, `#1B2A4A` vb. | `var(--color-accent)` vb. |
| `background-color` | literal hex/rgb | `var(--color-bg-*)` vb. |
| `border-radius` | `4px`, `8px` vb. | `var(--radius-sm)` vb. |
| `gap`, `padding`, `margin` | literal px | `var(--space-*)` vb. |

Token setinde karşılık bulunamıyorsa (örn. 10px için `--text-2xs` yok):
- Token dosyasına yeni token ekle, oradan referans ver
- Sessizce hardcode etme — "Açık Sorular" bölümüne ekle

**Inline style yasağı:** `style="font-size:..."` gibi inline tipografi stilleri kullanma. Her zaman CSS sınıfına taşı.

### Zorunlu: Yapı İşaretleri (`yapi` varsa)

Her `screens/*.html` dosyası Adım 2b'deki yapıyı işaretlerle taşır — `structure` testi bunları okur:

```html
<body data-template="T-DETAIL" data-flow="F-01 F-02">
  <header data-region="header">…</header>
  <section data-region="content">
    <div data-state="loading" hidden>…</div>
    <div data-state="empty" hidden>
      <p>Henüz harcama yok.</p>
      <a href="expense-add.html" data-flow-start="F-02">İlk harcamayı ekle</a>
    </div>
    …
  </section>
</body>
```

- `data-template` ve `data-flow` `<body>`'de; ekran birden çok akışta geçiyorsa hepsi boşlukla yazılır.
- Template'in her bölgesi `data-region`, her zorunlu durumu `data-state` bloğu olarak bulunur.
- Uygulama ekranlarında (`data-platform`) işaretler aynı `<body>`'ye eklenir.

### Side Navigation — `index.html`

Tüm HTML görevleri tamamlandıktan sonra proje kökünde `index.html` oluştur.
Bu dosya tasarımlar arasında hızlı geçiş için side navigation içerir.

Yapı:
- Sol tarafta sabit sidebar — katman başlıkları (Primitives, Atoms, Molecules, Organisms, Screens) ve altında o katmandaki component'lar liste halinde
- `yapi` varsa Screens bölümü akışlara göre gruplanır (`F-01 — Grup oluştur` başlığı altında o akışın ekranları,
  adım sırasıyla); ortak ekran her akışında görünür
- Sağ tarafta `<iframe>` — seçilen component'ı gösterir
- Aktif link highlight edilir
- Varsayılan olarak ilk component açık gelir

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Designed by: adesso Turkey -->
  <meta name="author" content="adesso Turkey">
  <title>[Proje Adı] — Design System</title>
</head>
<body>
<nav>
  <section>
    <h3>Atoms</h3>
    <a href="components/atoms/button.html" target="preview">Button</a>
    <a href="components/atoms/input.html" target="preview">Input</a>
  </section>
  <section>
    <h3>Screens</h3>
    <a href="screens/login.html" target="preview">Login</a>
  </section>
</nav>
<iframe name="preview" src="[ilk component]"></iframe>
</body>
</html>
```

Sidebar token'lardan renk ve tipografi değerlerini kullanır — hardcode etme.

### Her görev için bildir
```
TASK-001 ✓ — Button/Primary → components/atoms/button.html
TASK-002 ✓ — Input/Default  → components/atoms/input.html
```
