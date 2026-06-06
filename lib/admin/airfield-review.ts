export type RegulatoryAuthority = {
  label: string;
  url: string;
};

/** ICAO prefix / location hint → national aviation authority for licence checks. */
export function getRegulatoryAuthority(
  icaoCode: string,
  location?: string | null,
): RegulatoryAuthority | null {
  const icao = icaoCode.trim().toUpperCase();
  if (icao.startsWith("LD")) {
    return { label: "CCAA (Croatia)", url: "https://www.ccaa.hr" };
  }
  if (icao.startsWith("LI")) {
    return { label: "ENAC (Italy)", url: "https://www.enac.gov.it" };
  }
  if (icao.startsWith("LJ")) {
    return { label: "CAA Slovenia", url: "https://www.caa.si" };
  }

  const loc = (location ?? "").toLowerCase();
  if (loc.includes("croatia") || loc.includes("hrvatska")) {
    return { label: "CCAA (Croatia)", url: "https://www.ccaa.hr" };
  }
  if (loc.includes("italy") || loc.includes("italija")) {
    return { label: "ENAC (Italy)", url: "https://www.enac.gov.it" };
  }
  if (loc.includes("slovenia") || loc.includes("slovenija")) {
    return { label: "CAA Slovenia", url: "https://www.caa.si" };
  }

  return null;
}
