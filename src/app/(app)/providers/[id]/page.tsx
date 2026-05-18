import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  MedicalResourceSummary,
  Provider,
  ProviderParticipationType,
} from "@/lib/types";
import {
  specialtyKey,
  specialtyTagClasses,
} from "../provider-summary";

async function loadProvider(id: string): Promise<Provider | null> {
  try {
    return await api.get<Provider>(`/providers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

async function hydrate(p: Provider): Promise<Provider> {
  if (p.participationType && p.medicalResource) return p;
  try {
    const [pts, mrs] = await Promise.all([
      api.get<
        ProviderParticipationType[] | { items: ProviderParticipationType[] }
      >("/participation-types"),
      api.get<MedicalResourceSummary[] | { items: MedicalResourceSummary[] }>(
        "/medical-resources",
      ),
    ]);
    const ptList = Array.isArray(pts) ? pts : (pts.items ?? []);
    const mrList = Array.isArray(mrs) ? mrs : (mrs.items ?? []);
    return {
      ...p,
      participationType:
        p.participationType ??
        ptList.find((t) => t.id === p.providerParticipationTypeId) ??
        null,
      medicalResource:
        p.medicalResource ??
        mrList.find((m) => m.id === p.medicalResourceId) ??
        null,
    };
  } catch {
    return p;
  }
}

const AVATAR_ACCENTS = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
];

function avatarColor(name: string): string {
  const code = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_ACCENTS[code % AVATAR_ACCENTS.length];
}

function providerInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await loadProvider(id);
  if (!raw) notFound();
  const provider = await hydrate(raw);

  const tagKey = specialtyKey(provider);
  const tagClasses = specialtyTagClasses(tagKey);
  const location = [
    provider.medicalResource?.address?.city,
    provider.medicalResource?.address?.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/providers">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to providers
        </Link>
      </Button>

      {/* Hero card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white",
                  avatarColor(provider.name),
                )}
                aria-hidden="true"
              >
                {providerInitials(provider.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">
                    {provider.name}
                  </h1>
                  <span
                    className={cn(
                      "inline-block h-2.5 w-2.5 rounded-full",
                      provider.active ? "bg-emerald-500" : "bg-zinc-400",
                    )}
                    title={provider.active ? "Active" : "Inactive"}
                    aria-label={provider.active ? "Active" : "Inactive"}
                  />
                </div>
                {provider.participationType?.name && (
                  <span
                    className={cn(
                      "mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      tagClasses,
                    )}
                  >
                    {provider.participationType.name}
                  </span>
                )}
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`/providers/${provider.id}/edit`}>Edit</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detail cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow icon={<Mail size={14} />} label="Email">
              {provider.emailAddress ? (
                <a
                  href={`mailto:${provider.emailAddress}`}
                  className="text-sky-600 hover:underline flex items-center gap-1"
                >
                  {provider.emailAddress}
                  <ExternalLink size={11} className="opacity-60" />
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </DetailRow>
          </CardContent>
        </Card>

        {/* Practice */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Practice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Participation type">
              {provider.participationType?.name ?? (
                <span className="text-muted-foreground">—</span>
              )}
            </DetailRow>
            <Separator />
            <DetailRow icon={<Building2 size={14} />} label="Medical resource">
              {provider.medicalResource ? (
                <div className="text-right">
                  <p className="font-medium">
                    {provider.medicalResource.name}
                  </p>
                  {location && (
                    <p className="text-xs text-muted-foreground">{location}</p>
                  )}
                  {provider.medicalResource.primaryContact && (
                    <p className="text-xs text-muted-foreground">
                      {provider.medicalResource.primaryContact}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </DetailRow>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right">{children}</span>
    </div>
  );
}
