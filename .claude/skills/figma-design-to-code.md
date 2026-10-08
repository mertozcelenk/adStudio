---
name: figma-design-to-code
description: Figma tasarımını inceleyerek üretim kalitesinde React/HTML/CSS kodu üretir. Token binding ve component yapısını korur.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-design-to-code/SKILL.md
last_checked: 2026-08-28
---

# figma-design-to-code

Figma frame veya component'ından üretim kalitesinde kod üretir.
Bu skill `use_figma` yazmaz — Figma'dan okur, dosyaya yazar.

## Adım 1 — Figma İncelemesi

Hedef node'u incele:
```
get_design_context → layer ağacı, fill, typography, spacing, binding
get_variable_defs → bağlı token'ların gerçek değerleri
get_screenshot → görsel referans
```

Şunlara özellikle dikkat et:
- Variable bağlantıları → CSS custom property'ye dönüşecek
- Auto-layout → Flexbox veya Grid'e dönüşecek
- Text style'lar → typography token'lara
- Component instance'lar → import edilecek component'lar

## Adım 2 — Token Mapping

Figma variable → CSS custom property:
```
color/bg/primary → var(--color-bg-primary)
spacing/md       → var(--spacing-md)
radius/sm        → var(--radius-sm)
```

Token JSON mevcutsa eşleştirmeyi ondan yap.

## Adım 3 — Kod Üret

**React + CSS Modules:**
```tsx
import styles from './Button.module.css';

interface ButtonProps {
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  label,
  size = 'md',
  variant = 'primary',
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[size]} ${styles[variant]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

```css
.button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: none;
  transition: background-color 150ms ease;
}

.sm { padding: var(--spacing-xs) var(--spacing-sm); font-size: var(--font-size-sm); }
.md { padding: var(--spacing-sm) var(--spacing-md); font-size: var(--font-size-md); }
.lg { padding: var(--spacing-md) var(--spacing-lg); font-size: var(--font-size-lg); }

.primary { background: var(--color-bg-interactive); color: var(--color-text-on-interactive); }
.secondary { background: transparent; border: 1px solid var(--color-border-default); color: var(--color-text-primary); }
.ghost { background: transparent; color: var(--color-text-primary); }

.button:disabled { opacity: 0.4; cursor: not-allowed; }
```

## Adım 4 — Erişilebilirlik

Her component için:
- Semantik HTML element seç (`button`, `a`, `nav`, `main`)
- `aria-label` eksikse ekle (ikon-only elementler için zorunlu)
- Focus visible stili var mı kontrol et
- Kontrast oranını tahmin et (token değerlerine bakarak)

## Adım 5 — Responsive

Viewport token'ları varsa breakpoint'ler ekle:
```css
@media (max-width: 768px) { /* viewport-tablet */ }
@media (max-width: 375px) { /* viewport-mobile */ }
```

## Adım 6 — Dosyaya Yaz

```
components/atoms/Button/Button.tsx
components/atoms/Button/Button.module.css
components/atoms/Button/index.ts
```

## Kritik Kurallar

- Hardcode renk/spacing asla — her zaman `var(--token-adı)`.
- Token karşılığı bulunamayan değerler için yorum ekle: `/* TODO: token yok, Figma value: #3B82F6 */`
- Component'ı önce yaz, sonra CSS — önce CSS sonra TSX değil (bağımlılık sırası).
- `any` tipi kullanma — her prop'u tip güvenli yaz.
