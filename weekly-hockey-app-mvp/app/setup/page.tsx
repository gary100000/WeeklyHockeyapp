import { prisma } from "@/lib/prisma";
import SetupWizard from "@/components/SetupWizard";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const settings = await prisma.teamSettings.findUnique({
    where: { id: 1 },
    include: { arena: true },
  });

  const initialData = settings
    ? {
        teamName: settings.teamName,
        adminName: settings.adminName,
        adminMobileNumber: settings.adminMobileNumber,
        arenaName: settings.arena?.name ?? "",
        arenaAddress: settings.arena?.address ?? "",
        defaultGameDay: settings.defaultGameDay,
        defaultGameTime: settings.defaultGameTime,
        goalieRequirement: String(settings.goalieRequirement),
        defenceRequirement: String(settings.defenceRequirement),
        forwardRequirement: String(settings.forwardRequirement),
        defenceDeclineThreshold: String(settings.defenceDeclineThreshold),
        defenceMaxWithSubs: String(settings.defenceMaxWithSubs),
        forwardDeclineThreshold: String(settings.forwardDeclineThreshold),
        forwardMaxWithSubs: String(settings.forwardMaxWithSubs),
        responseDeadline: settings.responseDeadline,
        reminderTime: settings.reminderTime,
        finalDeadlineTreatNo: settings.finalDeadlineTreatNo,
      }
    : undefined;

  return <SetupWizard initialData={initialData} />;
}
