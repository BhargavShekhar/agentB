import { Suspense } from "react";

import { onBoard } from '@/features/auth/action/onboard';
import { auth } from '@clerk/nextjs/server';
import ChatShell from "@/features/conversation/components/chat-shell";

async function AuthGate({ children }: { children: React.ReactNode }) {
    await auth.protect();
    await onBoard();  // TODO extra db call here, use web hooks instead

    return <>{children}</>;
}

const RootGroupLayout = async ({ children }: {
    children: React.ReactNode
}) => {
    // TODO make fallback to some skeleton
    return (
        <div>
            <Suspense fallback={null}>
                <AuthGate>
                    <ChatShell>
                        {children}
                    </ChatShell>
                </AuthGate>
            </Suspense>
        </div>
    )
}

export default RootGroupLayout;