import BoothExperienceSurface from "../../../components/booth-experience-surface";

export default async function BoothExperiencePage({ params }: { params: Promise<{ booth_id: string }> }) {
  const { booth_id } = await params;
  return <BoothExperienceSurface boothId={booth_id} />;
}
