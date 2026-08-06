import { prisma } from "@/lib/prisma";
import SetupWizard from "@/components/SetupWizard";

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
        maximumPlayers: String(settings.maximumPlayers),
        goalieRequirement: String(settings.goalieRequirement),
        responseDeadline: settings.responseDeadline,
        reminderTime: settings.reminderTime,
        finalDeadlineTreatNo: settings.finalDeadlineTreatNo,
      }
    : undefined;

  return <SetupWizard initialData={initialData} />;
}
