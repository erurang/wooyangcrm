"use client";

import Head from "next/head";

export default function HeadComponent({ title }: { title: string }) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
    </>
  );
}
