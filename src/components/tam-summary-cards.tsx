import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  totalTAM: number;
  knownSchools: number;
  contacted: number;
  responseRate: string;
}

export function TAMSummaryCards({
  totalTAM,
  knownSchools,
  contacted,
  responseRate,
}: Props) {
  const identifiedPct =
    totalTAM > 0 ? ((knownSchools / totalTAM) * 100).toFixed(1) : "0";
  const contactedPct =
    knownSchools > 0 ? ((contacted / knownSchools) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total TAM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalTAM.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            schools in target market
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Known Schools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {knownSchools.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {identifiedPct}% of TAM identified
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Contacted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {contacted.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {contactedPct}% of known schools
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Response Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{responseRate}%</div>
          <p className="text-xs text-muted-foreground">
            of contacted schools replied
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
