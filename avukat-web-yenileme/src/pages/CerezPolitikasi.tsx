import LegalPageLayout from "@/components/LegalPageLayout";

const CerezPolitikasi = () => (
  <LegalPageLayout
    title="Çerez Politikası"
    description="Vega Hukuk sitesi için taslak çerez politikası iskeleti."
    canonicalPath="/cerez-politikasi"
    sections={[
      {
        heading: "Yayın Durumu",
        paragraphs: [
          "Bu metin canlı öncesi taslak durumundadır ve son çerez envanteri çıkartıldıktan sonra tamamlanacaktır.",
        ],
      },
      {
        heading: "Hazırlanacak Kapsam",
        paragraphs: [
          "Nihai sürümde zorunlu, analitik ve tercihe bağlı çerez kategorileri ayrı ayrı listelenecektir.",
          "Kullanıcının çerez tercihlerini nasıl yöneteceği ve gerekiyorsa onay mekanizması son metinde açıklanacaktır.",
        ],
      },
      {
        heading: "Geçici Not",
        paragraphs: [
          "Şu anda site için çerez kullanımı ve üçüncü taraf etiketleri canlıya alma öncesi teknik olarak tekrar kontrol edilmelidir.",
        ],
      },
    ]}
  />
);

export default CerezPolitikasi;
