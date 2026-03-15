import LegalPageLayout from "@/components/LegalPageLayout";

const KvkkAydinlatma = () => (
  <LegalPageLayout
    title="KVKK Aydınlatma Metni"
    description="Vega Hukuk web sitesi üzerinden iletilen temel iletişim verileri için taslak aydınlatma yapısı."
    canonicalPath="/kvkk-aydinlatma"
    sections={[
      {
        heading: "Yayın Durumu",
        paragraphs: [
          "Bu içerik şu anda canlı öncesi taslak iskelet olarak tutulmaktadır.",
          "Nihai KVKK metni, veri sorumlusu bilgileri ve güncel işleme senaryoları netleştikten sonra yayınlanacaktır.",
        ],
      },
      {
        heading: "Hazırlanacak Kapsam",
        paragraphs: [
          "Nihai metinde form üzerinden alınan kimlik, iletişim ve mesaj verilerinin işlenme amacı açıkça listelenecektir.",
          "Ayrıca saklama süresi, aktarım yapılan hizmet sağlayıcılar ve ilgili kişi hakları son metinde detaylandırılacaktır.",
        ],
      },
      {
        heading: "Geçici Not",
        paragraphs: [
          "Bu sayfa kullanıcıyı boş bir bağlantıya düşürmemek için oluşturulmuştur; yayın öncesi son metinle değiştirilmelidir.",
        ],
      },
    ]}
  />
);

export default KvkkAydinlatma;
