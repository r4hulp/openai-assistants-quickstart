"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-r">
      <Link href="/chat">
        <Button variant="outline" size="lg">
          View Available Assistants
        </Button>
      </Link>
    </main>
  );
};

export default Home;