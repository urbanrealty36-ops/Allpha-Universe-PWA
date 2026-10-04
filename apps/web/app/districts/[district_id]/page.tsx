import DistrictExperienceSurface from "../../../components/district-experience-surface";

export default async function DistrictExperiencePage({ params }: { params: Promise<{ district_id: string }> }) {
  const { district_id } = await params;
  return <DistrictExperienceSurface districtId={district_id} />;
}
