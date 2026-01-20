import { AppLayout } from "@/components/app-layout"
import UserProfile from "@/components/user-profile"
import { getCurrentUser } from "@/actions/auth"

export default async function ProfilePage() {

    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    return (
        <AppLayout>
            <div className="py-8 px-12 space-y-8 max-w-6xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold">Profile Settings</h1>
                    <p className="text-muted-foreground mt-2">This is how others will see you on the platform</p>
                </div>
                <div className="max-w-6xl mx-auto">
                    <UserProfile user={currentUser} />
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">

                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
