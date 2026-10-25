"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
};

export default function NavLink({ href, children }: Props) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`transition ${
            active
            ? "font-semibold text-gray-900 dark:text-white"
            : "text-gray-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
        }`}
        >
        {children}
        </Link>
    );
}