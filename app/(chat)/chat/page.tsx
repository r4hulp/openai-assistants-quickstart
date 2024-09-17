import AssistantsList from '@/app/components/assistants-list';
import { SignIn } from '@/app/components/auth/login';
import LogoutButton from '@/app/components/auth/logout-button';
import { auth } from '@/auth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function ChatPage() {
  const session = await auth();
  console.log('session', session);
  if (!session) {
    return (
      <section>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">You are not authorized</h2>
            <p className="mb-4">Please sign in to access the Chat App.</p>
            <SignIn />
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {session && (
        <header className="border-b">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold">Chat App</h1>
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-sm font-medium">{session.user?.name} ({session.user?.email})</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || 'User'} />
                      <AvatarFallback>{session.user?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogoutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1">
        <AssistantsList userId={session.user?.email} />
      </main>
    </div>
  );
}