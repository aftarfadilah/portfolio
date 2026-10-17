import type { Key } from "@/data/karhutla";
import styles from "./karhutla.module.css";

export type T = (k: Key) => string;
export const serif = styles.serif;
export const fmt = (n: number, lang: string) => n.toLocaleString(lang === "id" ? "id-ID" : "en-US");
