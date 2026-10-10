# Ortak Hesap — Flows

## Ortak Davranış
- Doğrulama: alandan çıkınca
- Başarı geri bildirimi: toast 3 sn
- Yıkıcı işlem: onay ister

## F-01 — Grup oluştur
- Önkoşul: yok
- Giriş: Gruplar listesi → "Grup oluştur"
- Adımlar:
  1. Grup listesi — screens/groups.html · T-LIST
  2. Grup adı — screens/group-create.html · T-FORM
- Dallar:
  - Hata: ad boş → kaydet pasif
  - İptal: değişiklik varsa onay sor
- Sonra: screens/group-detail.html → F-02

## F-02 — Harcama ekle
- Önkoşul: F-01 (en az 1 grup)
- Giriş: Grup detayı → "+"
- Adımlar:
  1. Grup detayı — screens/group-detail.html · T-DETAIL
  2. Tutar ve açıklama — screens/expense-add.html · T-FORM
- Dallar:
  - Boş: harcama yoksa grup detayında "İlk harcamayı ekle"
  - Hata: ağ yok → taslak saklanır
  - İptal: değişiklik varsa onay sor
- Sonra: screens/group-detail.html
