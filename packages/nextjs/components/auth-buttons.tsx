"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ExitIcon, ReloadIcon } from "@radix-ui/react-icons";
import { LoginButton } from "@telegram-auth/react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function SignInButton({ botUsername }: { botUsername: string }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <ReloadIcon className="h-6 w-6 animate-spin" />;
  }

  if (status === "authenticated") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div>
            <Avatar>
              <AvatarImage src={session.user?.image ?? "/default.webp"} alt="@shadcn" />
              <AvatarFallback>{session.user?.name}</AvatarFallback>
            </Avatar>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{session.user?.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Test 1</DropdownMenuItem>
          <DropdownMenuItem disabled>Test 2</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <ExitIcon className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <LoginButton
      botUsername={botUsername}
      onAuthCallback={data => {
        signIn("telegram-login", { callbackUrl: location.pathname }, data as any);
      }}
    />
  );
}
