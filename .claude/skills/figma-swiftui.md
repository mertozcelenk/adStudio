---
name: figma-swiftui
description: Figma tasarımını inceleyerek SwiftUI kodu üretir. iOS/macOS uyumlu, token bağlantılı çıktı.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-swiftui/SKILL.md
last_checked: 2026-08-28
---

# figma-swiftui

Figma frame veya component'ından üretim kalitesinde SwiftUI kodu üretir.
Bu skill `use_figma` yazmaz — Figma'dan okur, `.swift` dosyasına yazar.

## Adım 1 — Figma İncelemesi

```
get_design_context → layer hiyerarşisi, fills, typography, spacing
get_variable_defs → token değerleri ve isimleri
get_screenshot → görsel referans
```

## Adım 2 — Auto-layout → SwiftUI Layout Mapping

| Figma | SwiftUI |
|---|---|
| Horizontal auto-layout | `HStack` |
| Vertical auto-layout | `VStack` |
| Wrap | `LazyVGrid` / `FlowLayout` |
| Absolute positioned | `ZStack` + `.offset()` |
| Fixed size | `.frame(width:height:)` |
| Fill container | `.frame(maxWidth: .infinity)` |

## Adım 3 — Token Mapping

Figma variable → SwiftUI Color/CGFloat:
```swift
// Design tokens
extension Color {
    static let bgPrimary = Color("color/bg/primary")      // Asset Catalog
    static let textPrimary = Color("color/text/primary")
    static let borderDefault = Color("color/border/default")
}

extension CGFloat {
    static let spacingXS: CGFloat = 4
    static let spacingSM: CGFloat = 8
    static let spacingMD: CGFloat = 16
    static let spacingLG: CGFloat = 24
}
```

## Adım 4 — Component Kodu Üret

**Örnek Button:**
```swift
import SwiftUI

struct Button: View {
    let label: String
    var size: ButtonSize = .medium
    var variant: ButtonVariant = .primary
    var isDisabled: Bool = false
    var action: () -> Void

    var body: some View {
        SwiftUI.Button(action: action) {
            Text(label)
                .font(size.font)
                .foregroundColor(variant.foregroundColor)
                .padding(.horizontal, size.horizontalPadding)
                .padding(.vertical, size.verticalPadding)
        }
        .background(variant.backgroundColor)
        .cornerRadius(.radiusSM)
        .disabled(isDisabled)
        .opacity(isDisabled ? 0.4 : 1)
    }
}

enum ButtonSize {
    case small, medium, large

    var font: Font {
        switch self {
        case .small:  return .system(size: 14, weight: .medium)
        case .medium: return .system(size: 16, weight: .medium)
        case .large:  return .system(size: 18, weight: .semibold)
        }
    }

    var horizontalPadding: CGFloat {
        switch self { case .small: return 12; case .medium: return 16; case .large: return 24 }
    }
    var verticalPadding: CGFloat {
        switch self { case .small: return 8; case .medium: return 12; case .large: return 16 }
    }
}

enum ButtonVariant {
    case primary, secondary, ghost

    var backgroundColor: Color {
        switch self {
        case .primary:   return .bgInteractive
        case .secondary: return .clear
        case .ghost:     return .clear
        }
    }
    var foregroundColor: Color {
        switch self {
        case .primary: return .textOnInteractive
        case .secondary, .ghost: return .textPrimary
        }
    }
}
```

## Adım 5 — Erişilebilirlik

```swift
.accessibilityLabel(label)
.accessibilityHint("Aktivite için çift dokun")
.accessibilityAddTraits(.isButton)
```

## Adım 6 — Preview

Her view için `#Preview`:
```swift
#Preview {
    VStack(spacing: 16) {
        Button(label: "Primary", variant: .primary) {}
        Button(label: "Secondary", variant: .secondary) {}
        Button(label: "Disabled", isDisabled: true) {}
    }
    .padding()
}
```

## Adım 7 — Dosyaya Yaz

```
Sources/[ModuleName]/Components/Button/Button.swift
Sources/[ModuleName]/Components/Button/ButtonStyle.swift
```

## Kritik Kurallar

- Hardcode renk asla — Asset Catalog veya extension kullan.
- `frame(width: x, height: y)` sabit boyutlardan kaçın — mümkünse esnek layout.
- Her public view için accessibility modifier zorunlu.
- iOS 16+ için `.containerRelativeFrame()` kullan — GeometryReader'ı minimize et.
- `#Preview` macro kullan — eski `PreviewProvider` yerine.
