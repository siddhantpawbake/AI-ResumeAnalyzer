import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import { resumes } from "../../constants/index";
import ResumeCard from "~/components/resumecard";
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { usePuterStore } from '~/lib/puter'

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResuMind" },
    { name: "description", content: "AI feedback for your dream Job!" },
  ];
}

export default function Home() {
  const {auth}=usePuterStore();
    const navigate=useNavigate();
    useEffect(()=>{
        if(!auth.isAuthenticated) navigate('auth?next=/');
    },[auth.isAuthenticated])
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      
      <section className="main-section">
        <div className="page-heading py-12">
          <h1>Track your Applications & Resume score</h1>
          <h2>Review your sumbissions and check AI powered feedback.</h2>
        </div>
      {resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}
      </section>
    </main>
  );
}
