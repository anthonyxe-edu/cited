import type { Source } from "@/types";

const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const NCBI_API_KEY = process.env.NCBI_API_KEY || ""; // optional, raises rate limit
const S2_BASE = "https://api.semanticscholar.org/graph/v1/paper";
const CT_BASE = "https://clinicaltrials.gov/api/v2/studies";

/* ── helpers ───────────────────────────────────────────────────────────────── */

function ncbiParams(extra: Record<string, string>) {
  const p = new URLSearchParams({ retmode: "json", ...extra });
  if (NCBI_API_KEY) p.set("api_key", NCBI_API_KEY);
  return p.toString();
}

async function fetchJSON(url: string, timeout = 8000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

/* ── PubMed (Medline) ──────────────────────────────────────────────────────── */

async function searchPubMed(query: string, max = 5): Promise<Source[]> {
  // Step 1: search for PMIDs
  const searchUrl = `${NCBI_BASE}/esearch.fcgi?${ncbiParams({
    db: "pubmed",
    term: query,
    retmax: String(max),
    sort: "relevance",
  })}`;
  const searchData = (await fetchJSON(searchUrl)) as {
    esearchresult?: { idlist?: string[] };
  } | null;
  const ids = searchData?.esearchresult?.idlist;
  if (!ids?.length) return [];

  // Step 2: fetch summaries
  const sumUrl = `${NCBI_BASE}/esummary.fcgi?${ncbiParams({
    db: "pubmed",
    id: ids.join(","),
  })}`;
  const sumData = (await fetchJSON(sumUrl)) as {
    result?: Record<string, PubMedSummary>;
  } | null;
  if (!sumData?.result) return [];

  const sources: Source[] = [];
  for (const id of ids) {
    const r = sumData.result[id];
    if (!r || !r.title) continue;

    const doi = r.elocationid?.replace(/^doi:\s*/i, "") ||
      r.articleids?.find((a: { idtype: string; value: string }) => a.idtype === "doi")?.value || null;
    const pmid = id;

    sources.push({
      title: r.title.replace(/\.$/, ""),
      authors: formatAuthors(r.authors),
      year: r.pubdate?.split(" ")[0] || "",
      journal: r.fulljournalname || r.source || "",
      doi,
      pmid,
      url: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${pmid}`,
      type: r.pubtype?.[0] || "article",
      source_db: "PubMed",
      abstract: "",
      citedByCount: 0,
      verified: true, // came from PubMed directly
    });
  }
  return sources;
}

interface PubMedSummary {
  title?: string;
  authors?: { name: string }[];
  pubdate?: string;
  fulljournalname?: string;
  source?: string;
  elocationid?: string;
  articleids?: { idtype: string; value: string }[];
  pubtype?: string[];
}

function formatAuthors(authors?: { name: string }[]): string {
  if (!authors?.length) return "";
  if (authors.length <= 3) return authors.map((a) => a.name).join(", ");
  return `${authors[0].name}, ${authors[1].name} et al.`;
}

/* ── PubMed Central (PMC) ──────────────────────────────────────────────────── */

async function searchPMC(query: string, max = 3): Promise<Source[]> {
  const searchUrl = `${NCBI_BASE}/esearch.fcgi?${ncbiParams({
    db: "pmc",
    term: query,
    retmax: String(max),
    sort: "relevance",
  })}`;
  const searchData = (await fetchJSON(searchUrl)) as {
    esearchresult?: { idlist?: string[] };
  } | null;
  const ids = searchData?.esearchresult?.idlist;
  if (!ids?.length) return [];

  const sumUrl = `${NCBI_BASE}/esummary.fcgi?${ncbiParams({
    db: "pmc",
    id: ids.join(","),
  })}`;
  const sumData = (await fetchJSON(sumUrl)) as {
    result?: Record<string, PMCSummary>;
  } | null;
  if (!sumData?.result) return [];

  const sources: Source[] = [];
  for (const id of ids) {
    const r = sumData.result[id];
    if (!r || !r.title) continue;

    const doi = r.doi || r.articleids?.find((a: { idtype: string; value: string }) => a.idtype === "doi")?.value || null;
    const pmcid = `PMC${id}`;

    sources.push({
      title: r.title.replace(/\.$/, ""),
      authors: formatAuthors(r.authors as { name: string }[] | undefined),
      year: r.pubdate?.split(" ")[0] || r.epubdate?.split(" ")[0] || "",
      journal: r.fulljournalname || r.source || "",
      doi,
      pmid: r.pmid || null,
      url: doi ? `https://doi.org/${doi}` : `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
      type: "article",
      source_db: "PMC",
      abstract: "",
      citedByCount: 0,
      verified: true,
    });
  }
  return sources;
}

interface PMCSummary {
  title?: string;
  authors?: { name: string }[];
  pubdate?: string;
  epubdate?: string;
  fulljournalname?: string;
  source?: string;
  doi?: string;
  pmid?: string;
  articleids?: { idtype: string; value: string }[];
}

/* ── Semantic Scholar ──────────────────────────────────────────────────────── */

async function searchSemanticScholar(query: string, max = 4): Promise<Source[]> {
  const fields = "title,authors,year,journal,externalIds,abstract,citationCount,publicationTypes";
  const url = `${S2_BASE}/search?query=${encodeURIComponent(query)}&limit=${max}&fields=${fields}`;
  const data = (await fetchJSON(url, 10000)) as {
    data?: SemanticScholarPaper[];
  } | null;
  if (!data?.data) return [];

  return data.data
    .filter((p) => p.title && (p.externalIds?.DOI || p.externalIds?.PubMed))
    .map((p): Source => {
      const doi = p.externalIds?.DOI || null;
      const pmid = p.externalIds?.PubMed || null;
      return {
        title: p.title!,
        authors: p.authors?.slice(0, 3).map((a) => a.name).join(", ") +
          (p.authors && p.authors.length > 3 ? " et al." : ""),
        year: p.year ? String(p.year) : "",
        journal: p.journal?.name || "",
        doi,
        pmid,
        url: doi ? `https://doi.org/${doi}` : pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}` : null,
        type: p.publicationTypes?.[0] || "article",
        source_db: "Semantic Scholar",
        abstract: truncate(p.abstract || "", 200),
        citedByCount: p.citationCount || 0,
        verified: true,
      };
    });
}

interface SemanticScholarPaper {
  title?: string;
  authors?: { name: string }[];
  year?: number;
  journal?: { name?: string };
  externalIds?: { DOI?: string; PubMed?: string };
  abstract?: string;
  citationCount?: number;
  publicationTypes?: string[];
}

/* ── ClinicalTrials.gov ────────────────────────────────────────────────────── */

async function searchClinicalTrials(query: string, max = 2): Promise<Source[]> {
  const url = `${CT_BASE}?query.term=${encodeURIComponent(query)}&pageSize=${max}&format=json`;
  const data = (await fetchJSON(url, 10000)) as {
    studies?: ClinicalTrialStudy[];
  } | null;
  if (!data?.studies) return [];

  return data.studies
    .filter((s) => s.protocolSection?.identificationModule)
    .map((s): Source => {
      const id = s.protocolSection!.identificationModule!;
      const status = s.protocolSection?.statusModule;
      const desc = s.protocolSection?.descriptionModule;
      const nctId = id.nctId || "";

      return {
        title: id.briefTitle || id.officialTitle || "Untitled Trial",
        authors: id.organization?.fullName || "",
        year: status?.startDateStruct?.date?.split("-")[0] || "",
        journal: "ClinicalTrials.gov",
        doi: null,
        pmid: null,
        url: nctId ? `https://clinicaltrials.gov/study/${nctId}` : null,
        type: "clinical_trial",
        source_db: "ClinicalTrials.gov",
        abstract: truncate(desc?.briefSummary || "", 200),
        citedByCount: 0,
        verified: !!nctId,
      };
    });
}

interface ClinicalTrialStudy {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
      officialTitle?: string;
      organization?: { fullName?: string };
    };
    statusModule?: {
      startDateStruct?: { date?: string };
    };
    descriptionModule?: {
      briefSummary?: string;
    };
  };
}

/* ── DOI verification ──────────────────────────────────────────────────────── */

async function verifyDOI(doi: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

async function verifyAndEnrichSources(sources: Source[]): Promise<Source[]> {
  const results = await Promise.allSettled(
    sources.map(async (s) => {
      if (s.source_db === "ClinicalTrials.gov") return s; // NCT IDs don't have DOIs

      if (s.doi) {
        const valid = await verifyDOI(s.doi);
        if (!valid) {
          // DOI didn't resolve — try falling back to PMID URL
          if (s.pmid) {
            return { ...s, doi: null, url: `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}` };
          }
          return null; // discard — can't verify
        }
      }
      return s;
    })
  );

  return results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((s): s is Source => s !== null);
}

/* ── Deduplicate across databases ──────────────────────────────────────────── */

function deduplicateSources(sources: Source[]): Source[] {
  const seen = new Map<string, Source>();

  for (const s of sources) {
    // Dedupe key: prefer DOI, then PMID, then title
    const key = s.doi?.toLowerCase() || s.pmid || s.title.toLowerCase().slice(0, 60);

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, s);
    } else {
      // Keep the one with more info (abstract, citation count, DOI)
      const score = (src: Source) =>
        (src.doi ? 3 : 0) + (src.abstract ? 2 : 0) + (src.citedByCount || 0 > 0 ? 1 : 0);
      if (score(s) > score(existing)) {
        seen.set(key, s);
      }
    }
  }

  return Array.from(seen.values());
}

/* ── Main search: query all databases in parallel, dedupe, verify ──────── */

export async function searchAllSources(query: string): Promise<Source[]> {
  const [pubmed, pmc, s2, ct] = await Promise.allSettled([
    searchPubMed(query, 5),
    searchPMC(query, 3),
    searchSemanticScholar(query, 4),
    searchClinicalTrials(query, 2),
  ]);

  const all: Source[] = [
    ...((pubmed.status === "fulfilled" && pubmed.value) || []),
    ...((pmc.status === "fulfilled" && pmc.value) || []),
    ...((s2.status === "fulfilled" && s2.value) || []),
    ...((ct.status === "fulfilled" && ct.value) || []),
  ];

  // Deduplicate across databases
  const unique = deduplicateSources(all);

  // Verify DOIs are real
  const verified = await verifyAndEnrichSources(unique);

  // Return top results, prioritize those with DOIs and citation counts
  return verified
    .sort((a, b) => {
      // Prioritize: has DOI > has citations > by db diversity
      const scoreA = (a.doi ? 10 : 0) + (a.citedByCount || 0 > 5 ? 3 : 0);
      const scoreB = (b.doi ? 10 : 0) + (b.citedByCount || 0 > 5 ? 3 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 8); // cap at 8 verified sources
}
