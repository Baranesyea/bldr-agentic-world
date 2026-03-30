import { getCaseStudies } from "@/lib/data/case-studies";
export const dynamic = "force-dynamic";
import CaseStudiesClient from "./case-studies-client";

export default async function CaseStudiesPage() {
  const dbCaseStudies = await getCaseStudies();

  // Transform to the shape the client expects
  const caseStudies = dbCaseStudies.map((cs) => ({
    id: cs.id,
    title: cs.title,
    description: cs.description || "",
    videoUrl: cs.content || "", // videoUrl was stored in content field during seed
    tags: (cs.tags as string[]) || [],
    createdAt: cs.createdAt.toISOString(),
  }));

  return <CaseStudiesClient caseStudies={caseStudies} />;
}
