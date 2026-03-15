import LegalPageLayout from "@/components/LegalPageLayout";

const HukukiUyari = () => (
  <LegalPageLayout
    title="Hukuki Uyarı"
    description="Site içeriklerinin bilgilendirme amacına yönelik olduğunu belirten taslak hukuki uyarı sayfası."
    canonicalPath="/hukuki-uyari"
    sections={[
      {
        heading: "Yayın Durumu",
        paragraphs: ["Bu sayfa yayın öncesi taslak uyarı metni olarak oluşturulmuştur."],
      },
      {
        heading: "Hazırlanacak Kapsam",
        paragraphs: [
          "Nihai metinde web sitesi içeriklerinin genel bilgilendirme niteliğinde olduğu ve somut olay bazlı hukuki görüş yerine geçmeyeceği netleştirilecektir.",
          "Ayrıca baro reklam kuralları ve meslek ilkeleriyle uyumlu son ifade seti burada yer alacaktır.",
        ],
      },
      {
        heading: "Geçici Not",
        paragraphs: [
          "Canlıya alma öncesinde bu sayfanın son içeriği ilgili hukuk birimi tarafından onaylanmalıdır.",
        ],
      },
    ]}
  />
);

export default HukukiUyari;
