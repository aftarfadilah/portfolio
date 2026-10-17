import { Instrument_Serif } from "next/font/google";

// Display serif for the karhutla story only; the rest of the site keeps Geist.
const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
});

export default function KarhutlaLayout({ children }: { children: React.ReactNode }) {
  return <div className={serif.variable}>{children}</div>;
}
