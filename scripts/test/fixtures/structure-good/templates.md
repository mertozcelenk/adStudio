# Ortak Hesap — Templates

## T-LIST — Liste ekranı
- Kullanım: Gruplar
- Bölgeler: header, list, primary-action
- Zorunlu durumlar: loading, empty, error
- Davranış: Satıra dokununca grup detayı; boşken açıklama + "Grup oluştur"

## T-DETAIL — Detay ekranı
- Kullanım: Grup detayı
- Bölgeler: header, summary, content
- Zorunlu durumlar: loading, empty
- Davranış: Harcamalar tarih sırasıyla; "+" harcama ekler

## T-FORM — Form
- Kullanım: Grup oluştur, Harcama ekle
- Bölgeler: header, fields, submit
- Zorunlu durumlar: error
- Davranış: Doğrulama alandan çıkınca; kaydet zorunlu alanlar dolunca etkin
