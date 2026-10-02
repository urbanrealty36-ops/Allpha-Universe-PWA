import CommunitiesSurface from "../../../components/communities-platform";

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CommunitiesSurface detailId={id} />;
}
