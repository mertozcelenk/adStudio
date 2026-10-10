# Ortak Hesap — Flows

## F-01 — Grup oluştur
- Önkoşul: yok
- Giriş: Gruplar listesi → "Grup oluştur"
- Adımlar:
  1. Grup listesi — screens/groups.html · T-LIST
  2. Grup adı — screens/group-create.html · T-FORM
  3. Grup detayı — screens/group-detail.html · T-DETAIL
- Dallar:
  - Hata: ad boş → kaydet pasif
- Sonra: screens/group-detail.html → F-12

## F-02 — Harcama ekle
- Önkoşul: F-08
- Giriş: Grup detayı → "+"
- Adımlar:
  1. Tutar — screens/expense-add.html · T-WIZARD
- Dallar:
  - Hata: ağ yok
- Sonra: screens/group-detail.html

## F-03 — Hesap kapat
- Önkoşul: F-04
- Giriş: Grup detayı → "Hesabı kapat"
- Adımlar:
  1. Özet — screens/group-detail.html · T-DETAIL
- Sonra: screens/groups.html

## F-04 — Ödeme yap
- Önkoşul: F-03
- Adımlar:
  1. Özet — screens/group-detail.html · T-DETAIL
- Dallar:
  - İptal: geri dön
- Sonra: screens/groups.html
