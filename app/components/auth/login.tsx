import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
 
export function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn()
      }}
    >
      <Button type="submit">Sign in</Button>
    </form>
  )
}