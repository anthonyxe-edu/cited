import type { Source } from "@/types";

export async function searchEuropePMC(
  query: string,
  maxResults = 12
): Promise<Source[]> {
  const baseUrl =
    `https://www.ebi.ac.uk/europepmc/webservices/rest/search` +
    `?query=${encodeURIComponent(query)}` +
    `&format=json&pageSize=${maxResults}&sort=RELEVANCE&resultType=core`;

  const res = await fetch(baseUrl, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`EuropePMC error: ${res.status}`);
  const data = await res.json();

  if (!data.resultList?.result) return [];

  return data.resultList.result
    .map((p: Record<string, unknown>): Source => {
      const doi = (p.doi as string) || null;
      const pmid = (p.pmid as string) || null;
      const url = doi
        ? `https://doi.org/${doi}`
        : pmid
        ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}`
        : null;

      const authorList = p.authorList as
        | { author: { fullName?: string; lastName?: string }[] }
        | undefined;
      let authors = "";
      if (authorList?.author) {
        authors = authorList.author
          .slice(0, 3)
          .map((a) => a.fullName || a.lastName || "")
          .join(", ");
        if (authorList.author.length > 3) authors += " et al.";
      }

      const pubTypeList = p.publicationTypeList as
        | { publicationType: string[] }
        | undefined;
      const type =
        (p.pubType as string) ||
        pubTypeList?.publicationType?.[0] ||
        "article";

      const bookOrReport = p.bookOrReportDetails as
        | { publisher?: string }
        | undefined;

      return {
        title: (p.title as string) || "Untitled",
        authors,
        year: (p.pubYear as string) || "",
        journal:
          (p.journalTitle as string) || bookOrReport?.publisher || "",
        doi,
        pmid,
        url,
        type,
        source_db: "EuropePMC",
        abstract: (p.abstractText as string) || "",
        citedByCount: (p.citedByCount as number) || 0,
        verified: !!(doi || pmid),
      };
    })
    .filter((s: Source) => s.url && s.title !== "Untitled");
}
