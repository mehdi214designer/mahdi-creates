import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahdi Creates | UI/UX Designer & Creative Problem Solver",
  description:
    "Portfolio of Md Mahdi Hasan (Mahdi Creates), an award-winning UI/UX Designer with 9+ years of experience. Specializing in strategic, high-conversion web experiences and design systems for global brands like WPManageNinja.",
  openGraph: {
    title: "Mahdi Creates | UI/UX Designer & Creative Problem Solver",
    description:
      "Portfolio of Md Mahdi Hasan (Mahdi Creates), an award-winning UI/UX Designer with 9+ years of experience.",
    type: "website",
    url: "https://mahdicreates.com",
    images: [
      {
        url: "https://framerusercontent.com/assets/HCNyxmDFJarEJs5uqh49sJe1KU.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mahdi Creates | UI/UX Designer & Creative Problem Solver",
    description:
      "Portfolio of Md Mahdi Hasan (Mahdi Creates), an award-winning UI/UX Designer with 9+ years of experience.",
    images: ["https://framerusercontent.com/assets/HCNyxmDFJarEJs5uqh49sJe1KU.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" data-redirect-timezone="1">
      <head>
        <link rel="preconnect" href="https://framerusercontent.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
