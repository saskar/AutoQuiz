"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

// SVG Icons
function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H13L13 2z" />
    </svg>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8m-4-4v4M5 3H3a2 2 0 00-2 2v4c0 3.314 2.686 6 6 6m0 0h8m-8 0a6 6 0 006 0m-6 0V3m6 0h2a2 2 0 012 2v4c0 3.314-2.686 6-6 6M5 3h14" />
    </svg>
  )
}

function GraduationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  )
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [role, setRole] = useState<"Maker" | "Student">("Maker")

  useEffect(() => {
    const stored = localStorage.getItem("autoquiz_role")
    if (stored === "Student" || stored === "Maker") setRole(stored)
  }, [])

  const switchRole = () => {
    const next = role === "Maker" ? "Student" : "Maker"
    setRole(next)
    localStorage.setItem("autoquiz_role", next)
  }

  const navLink = (href: string, label: string, Icon: React.FC<{ className?: string }>) => {
    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
    return (
      <Link
        href={href}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          active
            ? "text-indigo-600 bg-indigo-50"
            : "text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-1.5 text-indigo-600">
              <BoltIcon className="w-5 h-5" />
              <span className="text-xl font-bold tracking-tight">AutoQuiz</span>
            </Link>
            {session && (
              <div className="hidden sm:flex items-center gap-1">
                {navLink("/dashboard", "Dashboard", GridIcon)}
                {navLink("/quiz/create", "Create", PlusCircleIcon)}
                {navLink("/browse", "Browse", BookOpenIcon)}
                {navLink("/my-results", "My Results", TrophyIcon)}
                {navLink("/report-card", "Report Card", GraduationIcon)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-gray-200"
                  />
                )}
                <span className="hidden sm:block text-sm text-gray-700 font-medium">
                  {session.user.name?.split(" ")[0]}
                </span>
                <span className="hidden sm:inline text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                  {role}
                </span>
                <button
                  onClick={switchRole}
                  className="hidden sm:inline text-xs text-gray-600 hover:text-indigo-700 border border-gray-200 hover:border-indigo-300 px-2.5 py-1 rounded-full transition-colors"
                >
                  Switch Role
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                  title="Sign out"
                >
                  <SignOutIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
