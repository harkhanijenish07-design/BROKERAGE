import Header from "@/components/Header";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const clerkUser = await currentUser();

    if(!clerkUser) redirect('/sign-in');

    const user = {
        id: clerkUser.id,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        email: clerkUser.emailAddresses[0]?.emailAddress,
    }

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={user} />

            <div className="container py-10">
                {children}
            </div>
        </main>
    )
}
export default Layout
