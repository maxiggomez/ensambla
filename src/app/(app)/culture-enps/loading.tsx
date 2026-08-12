import { Card, CardContent } from "@/components/ui/card";

export default function LoadingCultureEnps() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" aria-busy="true">
      <div className="h-12 w-2/3 animate-pulse rounded-sm bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((item) => (
          <Card key={item}>
            <CardContent>
              <div className="h-40 animate-pulse rounded-sm bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
