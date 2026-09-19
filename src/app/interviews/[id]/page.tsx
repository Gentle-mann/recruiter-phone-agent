import { InterviewDetail } from "@/components/interview-detail";
export const metadata = { title: "Conversation brief" };
export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InterviewDetail id={id} />;
}
