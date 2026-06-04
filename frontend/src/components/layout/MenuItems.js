import {
  LayoutDashboard,
  Users,
  Landmark,
  Wallet,
  CreditCard,
  FileBarChart,
  Settings,
} from "lucide-react";

export const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Loans",
    href: "/loans",
    icon: Landmark,
  },
  {
    title: "Collections",
    href: "/collections",
    icon: Wallet,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileBarChart,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];