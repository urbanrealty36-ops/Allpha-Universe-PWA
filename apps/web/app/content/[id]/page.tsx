import ContentCapsuleExperience from "../../../components/content/content-capsule-experience";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContentCapsuleExperience contentId={id} />;
}
