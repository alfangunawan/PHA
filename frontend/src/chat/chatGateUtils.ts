export type Gad7Status = { needsGad7: boolean; lastTakenAt: string | null } | null;

export function resolveChatRoute(
    gad7Status: Gad7Status | undefined,
): 'Chat' | 'Gad7Onboarding' {
    if (gad7Status?.needsGad7 === true) return 'Gad7Onboarding';
    return 'Chat';
}
