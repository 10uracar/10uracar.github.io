GOOGLE SHEETS -> APPS SCRIPT -> ONURACAR.NET TESTİ

1) Google Sheets'te boş bir çalışma kitabı aç.
2) Sayfa adını Dashboard yap.
3) A1:B5 arasını şöyle doldur:

key | value
participants | 123
avgProductivity | 4.12
timeSavingPct | 61
message | Deneme verisi başarıyla geliyor.

4) Uzantılar > Apps Script'e gir.
5) Varsayılan kodu silip Code.gs içindeki kodu yapıştır.
6) Kaydet.
7) Deploy > New deployment > Web app.
8) Execute as: Me.
9) Who has access: Anyone.
10) Deploy et ve oluşan /exec adresini kopyala.
11) Onuracar anket klasöründeki config.js dosyasında RESULTS_ENDPOINT alanına bu adresi yaz.

ÖNEMLİ:
- Bu test için sadece toplu, anonim istatistikler döndürülür.
- Bireysel Google Forms cevaplarını API üzerinden yayınlama.
- JSONP yalnızca salt-okunur, hassas olmayan sonuçlar için kullanılıyor.
